'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import HomePage from './home/page'
import AvailableJobsPage from './jobs/page'
import MyApplicationsPage from './applications/page'
import AddNewJobPage from './addNewJob/page'
import AddExternalJobPage from './addExternalJob/page'
import type { UserProfile } from './data/profileData'
import { defaultProfile } from './data/profileData'
import { ProfilePage } from './profile/page'
import { Navbar } from './components/Navbar'
import { Toaster, toast } from './components/ui/sonner'
import { SignInButtonBridge } from './utils/protectedAction'
import { linkClerkToFirebase } from './utils/linkClerkToFirebase'
import { signOut as fbSignOut } from 'firebase/auth'
import { firebaseAuth } from './lib/firebaseClient'
import { JobApplication } from './data/mockData'
import { AvailableJob } from './data/availableJobs'
import { RolePage } from './components/RolePage'
import { getUserRole, createUserDoc, type Role } from './utils/userRole'
import { RecruiterProfilePage } from './profile/recruiterProfile'
import {
  getUserProfile,
  saveUserProfile,
  getRecruiterProfile,
  saveRecruiterProfile,
  type RecruiterProfile,
} from './utils/userProfiles'

type Page = 'home' | 'available' | 'applications' | 'profile' | 'addNewJob' | 'addExternalJob' | 'role'

function LandingPage() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  const [firebaseReady, setFirebaseReady] = useState(false) // tells us when Firebase is signed in (after linkClerkToFirebase works)
  const [role, setRole] = useState<Role | null>(null) // stores the user role from Firestore
  const [roleLoaded, setRoleLoaded] = useState(false) // tells us when we finished checking Firestore for the role

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

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)

      // Determine next page based on hash
      const next: Page =
        hash === '/applications'
          ? 'applications'
          : hash === '/jobs'
            ? 'available'
            : hash === '/addNewJob'
              ? 'addNewJob'
              : hash === '/addExternalJob' 
                ? 'addExternalJob'
                : hash === '/profile'
                  ? 'profile'
                  : 'home'

      const isProtected =
        next === 'available' ||
        next === 'applications' ||
        next === 'profile' ||
        next === 'addNewJob' ||
        next === 'addExternalJob'

      if (isProtected && !isSignedIn) {
        setCurrentPage('home')
        toast('Please sign in to continue', { description: 'This area is for members only.' })
        const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
        btn?.click() // Opens Clerk sign-in modal
      } else {
        setCurrentPage(next)
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isSignedIn, isLoaded])

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
    // Only run when everything is ready
    if (!isLoaded) return
    if (!isSignedIn) return
    if (!firebaseReady) return

    const loadRole = async () => {
      setRoleLoaded(false)

      const uid = firebaseAuth.currentUser?.uid

      // If Firebase user is missing stop
      if (!uid) {
        setRole(null)
        setRoleLoaded(true)
        return
      }

      // Read role from Firestore
      const foundRole = await getUserRole(uid)

      setRole(foundRole)
      setRoleLoaded(true)

      // If user has NO role yet, force them to the role picker
      if (!foundRole) {
        if (window.location.hash !== '#/role') {
          window.location.hash = '/role'
        }
        return
      }

      // If user DOES have a role, and they are on home or role page send them to the dashboard page for that role
      const currentHash = window.location.hash.slice(1)
      const onHome = currentHash === '' || currentHash === '/' || currentHash === '/home'
      const onRolePage = currentHash === '/role'

      if (onHome || onRolePage) {
        window.location.hash = foundRole === 'applicant' ? '/applications' : '/addNewJob'
      }
    }

    loadRole().catch((err) => {
      console.error('Role load error:', err)
      setRole(null)
      setRoleLoaded(true)
    })
  }, [isLoaded, isSignedIn, firebaseReady])

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

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)

      // Convert URL hash to internal page name
      const next: Page =
        hash === '/applications'
          ? 'applications'
          : hash === '/jobs'
            ? 'available'
            : hash === '/addNewJob'
              ? 'addNewJob'
              : hash === '/addExternalJob'
                ? 'addExternalJob'
                : hash === '/profile'
                  ? 'profile'
                  : hash === '/role'
                    ? 'role'
                      : 'home'

      // Pages that require sign-in
      const isProtected =
        next === 'available' ||
        next === 'applications' ||
        next === 'profile' ||
        next === 'addNewJob' ||
        next === 'addExternalJob'||
        next === 'role'
        

      // If signed out, block protected pages
      if (isProtected && !isSignedIn) {
        setCurrentPage('home')
        toast('Please sign in to continue', {
          description: 'This area is for members only.',
        })

        // Open Clerk sign-in modal
        const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
        btn?.click()
        return
      }

      // If signed in but we are still checking Firestore role avoid navigating into protected pages
      if (isSignedIn && isProtected && !roleLoaded) {
        setCurrentPage('home')
        return
      }

      // If signed in, role check finished, but no role exists force user to role picker
      if (isSignedIn && roleLoaded && !role && next !== 'role') {
        window.location.hash = '/role'
        return
      }

      // If role exists, block the wrong pages -- applicant vs recruiter pages
      // FIXME: here make sure we create more recruiter based pages later on
      if (isSignedIn && roleLoaded && role) {
        const applicantOnly = next === 'available' || next === 'applications' || next === 'addExternalJob'
        const recruiterOnly = next === 'addNewJob'

        if (applicantOnly && role !== 'applicant') {
          toast('Recruiter account', { description: 'This page is for applicants.' })
          window.location.hash = '/addNewJob'
          return
        }

        if (recruiterOnly && role !== 'recruiter') {
          toast('Applicant account', { description: 'This page is for recruiters.' })
          window.location.hash = '/applications'
          return
        }

        // If user already has a role, they should not go back to /role
        if (next === 'role') {
          window.location.hash = role === 'applicant' ? '/applications' : '/addNewJob'
          return
        }
      }

      // If all checks pass, allow navigation
      setCurrentPage(next)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isSignedIn, isLoaded, roleLoaded, role])

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

    // Create the user doc in Firestore with their role
    await createUserDoc({
      uid,
      role: picked,
      clerkUserId: userId ?? undefined,
    })

    // Save role locally so UI updates right away
    setRole(picked)

    // Send user to the correct page
    window.location.hash = picked === 'applicant' ? '/applications' : '/addNewJob'
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

    // Navigate to applications page
    window.location.hash = '/applications'
  }

  return (
    <div className='min-h-screen bg-background'>
      <Toaster />
      <SignInButtonBridge />
      {/* Show navbar only after we know the user's role, and not on role screen */}
      {/* FIXME: Navbar currenly has pages dedicated only to applicants */}
      {isLoaded && isSignedIn && roleLoaded && role && currentPage !== 'role' && (
        <Navbar currentPage={currentPage} />
      )}

      {/* Render active page  */}
      <main className={currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''}>
        {currentPage === 'home' && <HomePage />}

        {currentPage === 'role' && <RolePage onSelectRole={handleSelectRole} />}

        {currentPage === 'available' && (
          <AvailableJobsPage
            onAddApplication={handleAddApplication}
            appliedJobIds={appliedJobIds}
            role={role}
          />
        )}
        {currentPage === 'applications' && (
          <MyApplicationsPage
            applications={applications}
            onStatusChange={(id, status) =>
              setApplications((apps) =>
                apps.map((app) => (app.id === id ? { ...app, status } : app))
              )
            }
            onNotesChange={(id, notes) =>
              setApplications((apps) =>
                apps.map((app) => (app.id === id ? { ...app, notes } : app))
              )
            }
          />
        )}
        {currentPage === 'profile' && role === 'applicant' && (
          <ProfilePage
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {currentPage === 'profile' && role === 'recruiter' && (
          <RecruiterProfilePage
            recruiterProfile={recruiterProfile}
            onSave={handleSaveRecruiterProfile}
          />
        )}

        {currentPage === 'addNewJob' && <AddNewJobPage />}
        {currentPage === 'addExternalJob' && <AddExternalJobPage />}
      </main>
    </div>
  )
}

export default LandingPage
