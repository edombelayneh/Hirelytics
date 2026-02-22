'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import HomePage from './home/page'
import type { UserProfile } from './data/profileData'
import { defaultProfile } from './data/profileData'
import { Toaster, toast } from './components/ui/sonner'
import { SignInButtonBridge } from './utils/protectedAction'
import { linkClerkToFirebase } from './utils/linkClerkToFirebase'
import { signOut as fbSignOut } from 'firebase/auth'
import { firebaseAuth } from './lib/firebaseClient'
import { JobApplication } from './data/mockData'
import { AvailableJob } from './data/availableJobs'
import { getUserRole, createUserDoc, type Role } from './utils/userRole'
import {
  getUserProfile,
  saveUserProfile,
  getRecruiterProfile,
  saveRecruiterProfile,
  type RecruiterProfile,
} from './utils/userProfiles'
import { RolePageUI } from './components/RolePage'

type Page = 'home' | 'available' | 'applications' | 'profile' | 'addNewJob' | 'role'

function LandingPage() {
  const { user } = useUser()
  const { isSignedIn, isLoaded, userId } = useAuth()

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  const [firebaseReady, setFirebaseReady] = useState(false) // tells us when Firebase is signed in (after linkClerkToFirebase works)
  const [role, setRole] = useState<Role | null>(null) // stores the user role from Firestore
  const [roleLoaded, setRoleLoaded] = useState(false) // tells us when we finished checking Firestore for the role

  const pathname = usePathname()
  const router = useRouter()

  // state of recruiter profile
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile>({
    companyName: '',
    companyWebsite: '',
    recruiterTitle: '',
  })

  // ---------------------------
  // NAVIGATION + AUTH PROTECTION
  // Makes sure signed-out users cannot access protected routes via URL hash
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return

    const next: Page = pathname.startsWith('/applicant/applications')
      ? 'applications'
      : pathname.startsWith('/applicant/jobs')
        ? 'available'
        : pathname.startsWith('/recruiter/addNewJob')
          ? 'addNewJob'
          : pathname.startsWith('/applicant/profile') || pathname.startsWith('/recruiter/profile')
            ? 'profile'
            : pathname.startsWith('/role')
              ? 'role'
              : 'home'

    const isProtected =
      next === 'available' ||
      next === 'applications' ||
      next === 'profile' ||
      next === 'addNewJob' ||
      next === 'role'

    if (isProtected && !isSignedIn) {
      toast('Please sign in to continue', {
        description: 'This area is for members only.',
      })

      router.replace('/')
      return
    }
  }, [pathname, isSignedIn, isLoaded, router])

  // ---------------------------
  // CLERK ↔ FIREBASE LINKING
  // When user signs in with Clerk, also sign them into Firebase using a custom token
  // When user signs out, sign them out of Firebase
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return // Wait for Clerk to load

    if (isSignedIn) {
      // When Clerk signs in, also sign into Firebase
      linkClerkToFirebase()
        .then(() => {
          console.log('Clerk linked to Firebase')
          setFirebaseReady(true) // Firebase is ready now
        })
        .catch((err: unknown) => {
          console.error('Firebase link error', err)
          setFirebaseReady(false) // If linking failed, Firebase is not ready
        })
    } else {
      // When Clerk signs out, also sign out of Firebase
      fbSignOut(firebaseAuth).catch(() => {})

      // Defer state resets to avoid synchronous setState in effect
      queueMicrotask(() => {
        setFirebaseReady(false) // Firebase is not ready
        setRole(null)
        setRoleLoaded(false)
        setProfile(defaultProfile)
        setRecruiterProfile({
          companyName: '',
          companyWebsite: '',
          recruiterTitle: '',
        })
      })
    }
  }, [isSignedIn, isLoaded])

  // ---------------------------
  // USER ROLE HANDLING
  // After Firebase is ready, check Firestore for users/{uid}
  // If no doc exists -> send them to role picker
  // If doc exists -> route them to the correct default page (only if they are on home/role for now)
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return
    if (!firebaseReady) return

    const loadRole = async () => {
      setRoleLoaded(false)

      const uid = firebaseAuth.currentUser?.uid

      if (!uid) {
        setRole(null)
        setRoleLoaded(true)
        return
      }

      const foundRole = await getUserRole(uid)

      setRole(foundRole)
      setRoleLoaded(true)

      // -----------------------------
      // 🚨 No role → force /role
      // -----------------------------
      if (!foundRole) {
        if (!pathname.startsWith('/role')) {
          router.replace('/role')
        }
        return
      }

      // -----------------------------
      // ✅ Has role → redirect from home or role
      // -----------------------------
      const onHome = pathname === '/' || pathname === '/home'
      const onRolePage = pathname.startsWith('/role')

      if (onHome || onRolePage) {
        if (foundRole === 'applicant') {
          router.replace('/applicant/applications')
        } else {
          router.replace('/recruiter/addNewJob')
        }
      }
    }

    loadRole().catch((err) => {
      console.error('Role load error:', err)
      setRole(null)
      setRoleLoaded(true)
    })
  }, [isLoaded, isSignedIn, firebaseReady, pathname, router])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return
    if (!roleLoaded) return

    // No role yet -> stay on this page so RolePage can render
    if (!role) return

    // Has role -> send them to their “home” route
    router.replace(role === 'applicant' ? '/applicant/applications' : '/recruiter/myJobs')
  }, [isLoaded, isSignedIn, roleLoaded, role, router])

  // ---------------------------
  // LOAD PROFILE FROM FIRESTORE
  // After role is loaded, fetch the profile data for the user based on their role
  // ---------------------------
  useEffect(() => {
    // Only load profile once we are signed in and Firebase is ready
    if (!isLoaded) return
    if (!isSignedIn) return
    if (!firebaseReady) return
    if (!roleLoaded) return

    const loadProfile = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return

      // If applicant, load applicant profile
      if (role === 'applicant') {
        const saved = await getUserProfile(uid)
        if (saved) setProfile(saved)
      }

      // If recruiter, load recruiter profile
      if (role === 'recruiter') {
        const saved = await getRecruiterProfile(uid)
        if (saved) setRecruiterProfile(saved)
      }
    }

    loadProfile().catch((err) => console.error('Load profile error:', err))
  }, [isLoaded, isSignedIn, firebaseReady, roleLoaded, role])

  // ---------------------------
  // NAVIGATION + AUTH + ROLE PROTECTION
  // Makes sure users cannot access pages not allowed for their role using URL hash
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return

    // Convert pathname to your internal Page type
    const next: Page = pathname.startsWith('/applicant/applications')
      ? 'applications'
      : pathname.startsWith('/applicant/jobs')
        ? 'available'
        : pathname.startsWith('/recruiter/addNewJob')
          ? 'addNewJob'
          : pathname.startsWith('/applicant/profile') || pathname.startsWith('/recruiter/profile')
            ? 'profile'
            : pathname.startsWith('/role')
              ? 'role'
              : 'home'

    const isProtected =
      next === 'available' ||
      next === 'applications' ||
      next === 'profile' ||
      next === 'addNewJob' ||
      next === 'role'

    // If signed out, block protected pages
    if (isProtected && !isSignedIn) {
      toast('Please sign in to continue', {
        description: 'This area is for members only.',
      })

      // optional: open clerk modal (your current behavior)
      const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
      btn?.click()

      // route back to a safe public page
      router.replace('/')
      return
    }

    // If signed in but role not loaded yet, don't allow protected pages
    if (isSignedIn && isProtected && !roleLoaded) {
      return
    }

    // If signed in, role loaded, but no role -> force /role
    if (isSignedIn && roleLoaded && !role && next !== 'role') {
      router.replace('/role')
      return
    }

    // If role exists, block wrong pages
    if (isSignedIn && roleLoaded && role) {
      // Update these to match your REAL route structure
      const applicantOnly =
        next === 'available' || next === 'applications' || pathname.startsWith('/applicant')
      const recruiterOnly = next === 'addNewJob' || pathname.startsWith('/recruiter')

      if (applicantOnly && role !== 'applicant') {
        toast('Recruiter account', { description: 'This page is for applicants.' })
        router.replace('/recruiter/addNewJob')
        return
      }

      if (recruiterOnly && role !== 'recruiter') {
        toast('Applicant account', { description: 'This page is for recruiters.' })
        router.replace('/applicant/applications')
        return
      }

      // If user already has a role, they should not go back to /role
      if (next === 'role') {
        router.replace(role === 'applicant' ? '/applicant/applications' : '/recruiter/addNewJob')
        return
      }
    }

    // allow navigation
  }, [pathname, isSignedIn, isLoaded, roleLoaded, role, router])

  // ----------------
  // update applicant profile handler
  // ----------------
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    // Save profile in Firestore
    await saveUserProfile(uid, updatedProfile)

    // Update local state so UI also updates
    setProfile(updatedProfile)
  }

  // ----------------
  // update recruiter profile handler
  // ----------------
  const handleSaveRecruiterProfile = async (updated: RecruiterProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    // Save recruiter profile in Firestore
    await saveRecruiterProfile(uid, updated)

    // Update local state so UI updates too
    setRecruiterProfile(updated)
  }

  // ---------------------------
  // ROLE PICKER SAVE HANDLER
  // This runs when the user clicks "Apply to jobs" or "Post jobs"
  // ---------------------------
  const handleSelectRole = async (picked: Role) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    // 1) Save role in Firestore
    await createUserDoc({
      uid,
      role: picked,
      clerkUserId: userId ?? undefined,
    })

    // 2) Save role in Clerk publicMetadata
    const res = await fetch('/api/user/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: picked }),
    })

    if (!res.ok) {
      toast.error('Could not save role', { description: 'Please try again.' })
      return
    }

    // 3) Make sure Clerk user object refreshes so Navbar sees the role
    await user?.reload()

    // 4) Update local state
    setRole(picked)

    // 5) Redirect using Next router (no full page reload)
    if (picked === 'applicant') {
      router.replace('/applicant/applications')
    } else {
      router.replace('/recruiter/myJobs')
    }
  }

  // ---------------------------
  // Handle adding a job application
  // ---------------------------
  const handleAddApplication = (job: AvailableJob) => {
    if (appliedJobIds.has(job.id)) return

    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      company: job.company,
      city: job.location.split(',')[0],
      country: job.location.split(',')[1]?.trim() || '',
      jobLink: job.applyLink,
      position: job.title,
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      contactPerson: '',
      notes: `Applied via job board. ${job.type} position.`,
      jobSource: 'Other',
      outcome: 'Pending',
    }

    setApplications((prev) => [newApp, ...prev])
    setAppliedJobIds((prev) => new Set([...prev, job.id]))

    toast.success(`Successfully applied to ${job.title} at ${job.company}`)

    router.push('/applicant/applications')
  }

  return (
    <div className='min-h-screen bg-background'>
      <Toaster />
      <SignInButtonBridge />

      {/* Signed out: show marketing home */}
      {!isSignedIn && <HomePage />}

      {/* Signed in but role not loaded yet: show nothing / loading */}
      {isSignedIn && !roleLoaded && <main className='container mx-auto px-6 py-8'>Loading...</main>}

      {/* Signed in, role loaded, no role: show role picker */}
      {isSignedIn && roleLoaded && !role && <RolePageUI onSelectRole={handleSelectRole} />}

      {/* Signed in, role exists: we redirect in useEffect; optionally render a loading shell */}
      {isSignedIn && roleLoaded && role && (
        <main className='container mx-auto px-6 py-8'>Redirecting...</main>
      )}
    </div>
  )
}

export default LandingPage
