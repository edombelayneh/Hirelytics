'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import HomePage from './home/page'
import AvailableJobsPage from './jobs/page'
import MyApplicationsPage from './applications/page'
import AddNewJobPage from './addNewJob/page'
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
import { getOnboardingStatus, createUserDoc, type Role } from './utils/userRole'
import { RecruiterProfilePage } from './profile/recruiterProfile'
import {
  defaultRecruiterProfile,
  getUserProfile,
  saveUserProfile,
  getRecruiterProfile,
  saveRecruiterProfile,
  type RecruiterProfile,
} from './utils/userProfiles'

type Page = 'home' | 'available' | 'applications' | 'profile' | 'addNewJob' | 'role'

function LandingPage() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('home')

  // redirect banner
  const [showProfileBanner, setShowProfileBanner] = useState(false)

  const [applications, setApplications] = useState<JobApplication[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  // Firebase + Role state
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  // Onboarding state
  const [applicantProfileCompleted, setApplicantProfileCompleted] = useState(false)
  const [recruiterProfileCompleted, setRecruiterProfileCompleted] = useState(false)

  // Recruiter profile state
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null)

  // ---------------------------
  // Helpers: what "complete" means
  // (Adjust these required fields if your required list changes.)
  // ---------------------------
  const isNonEmpty = (v: unknown) => typeof v === 'string' && v.trim().length > 0

  const isApplicantProfileComplete = (p: UserProfile) => {
    return isNonEmpty(p.firstName) && isNonEmpty(p.lastName) && isNonEmpty(p.email)
  }

  const isRecruiterProfileComplete = (p: RecruiterProfile) => {
    return isNonEmpty(p.companyName) && isNonEmpty(p.recruiterEmail)
  }

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
              : hash === '/profile'
                ? 'profile'
                : hash === '/role'
                  ? 'role'
                  : 'home'

      const isProtected =
        next === 'available' ||
        next === 'applications' ||
        next === 'profile' ||
        next === 'addNewJob' ||
        next === 'role'

      if (isProtected && !isSignedIn) {
        setCurrentPage('home')
        toast('Please sign in to continue', { description: 'This area is for members only.' })
        const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
        btn?.click()
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
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      linkClerkToFirebase()
        .then(() => {
          console.log('Clerk linked to Firebase')
          setFirebaseReady(true)
        })
        .catch((err: unknown) => {
          console.error('Firebase link error', err)
          setFirebaseReady(false)
        })
    } else {
      fbSignOut(firebaseAuth).catch(() => {})

      // Reset state so next login is clean
      setFirebaseReady(false)
      setRole(null)
      setRoleLoaded(false)
      setProfile(defaultProfile)
      setRecruiterProfile(null)
      setApplicantProfileCompleted(false)
      setRecruiterProfileCompleted(false)
      setShowProfileBanner(false)
    }
  }, [isSignedIn, isLoaded])

  // ---------------------------
  // USER ROLE HANDLING
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
        setApplicantProfileCompleted(false)
        setRecruiterProfileCompleted(false)
        setRoleLoaded(true)
        return
      }

      // Get role and onboarding status from Firestore
      const status = await getOnboardingStatus(uid)
      const foundRole = status.role

      setRole(status.role)
      setApplicantProfileCompleted(status.applicantProfileCompleted)
      setRecruiterProfileCompleted(status.recruiterProfileCompleted)
      setRoleLoaded(true)

      // If user has NO role yet, force them to the role picker
      if (!foundRole) {
        if (window.location.hash !== '#/role') {
          window.location.hash = '/role'
        }
        return
      }

      // If user DOES have a role, and they are on home or role page, send them to the default page
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
  // Also: auto-mark onboarding complete if required fields are already present
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return
    if (!firebaseReady) return
    if (!roleLoaded) return

    const loadProfile = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return

      if (role === 'applicant') {
        const saved = await getUserProfile(uid)
        const nextProfile = saved ?? defaultProfile
        setProfile(nextProfile)

        // Auto-unlock if required fields exist
        if (isApplicantProfileComplete(nextProfile)) {
          setApplicantProfileCompleted(true)
          setShowProfileBanner(false)
        }
      }

      if (role === 'recruiter') {
        const saved = await getRecruiterProfile(uid)
        const nextRecruiter = saved ?? defaultRecruiterProfile
        setRecruiterProfile(nextRecruiter)

        if (isRecruiterProfileComplete(nextRecruiter)) {
          setRecruiterProfileCompleted(true)
          setShowProfileBanner(false)
        }
      }
    }

    loadProfile().catch((err) => console.error('Load profile error:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, firebaseReady, roleLoaded, role])

  // ---------------------------
  // NAVIGATION + AUTH + ROLE PROTECTION
  // Makes sure users cannot access pages not allowed for their role using URL hash
  // ---------------------------
  useEffect(() => {
    if (!isLoaded) return

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)

      const next: Page =
        hash === '/applications'
          ? 'applications'
          : hash === '/jobs'
            ? 'available'
            : hash === '/addNewJob'
              ? 'addNewJob'
              : hash === '/profile'
                ? 'profile'
                : hash === '/role'
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
        setCurrentPage('home')
        toast('Please sign in to continue', {
          description: 'This area is for members only.',
        })
        const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
        btn?.click()
        return
      }

      // If signed in but still checking Firestore role, avoid navigating into protected pages
      if (isSignedIn && isProtected && !roleLoaded) {
        setCurrentPage('home')
        return
      }

      // If signed in, role check finished, but no role exists force user to role picker
      if (isSignedIn && roleLoaded && !role && next !== 'role') {
        window.location.hash = '/role'
        return
      }

      // Role-based route blocking
      if (isSignedIn && roleLoaded && role) {
        const applicantOnly = next === 'available' || next === 'applications'
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

      setCurrentPage(next)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isSignedIn, isLoaded, roleLoaded, role, applicantProfileCompleted, recruiterProfileCompleted])

  // ----------------
  // update applicant profile handler
  // ----------------
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await saveUserProfile(uid, updatedProfile)
    setProfile(updatedProfile)

    setApplicantProfileCompleted(isApplicantProfileComplete(updatedProfile))
  }

  // ----------------
  // update recruiter profile handler
  // ----------------
  const handleSaveRecruiterProfile = async (updated: RecruiterProfile) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await saveRecruiterProfile(uid, updated)
    setRecruiterProfile(updated)

    setRecruiterProfileCompleted(isRecruiterProfileComplete(updated))
  }
  // ---------------------------
  // ROLE PICKER SAVE HANDLER
  // ---------------------------
  const handleSelectRole = async (picked: Role) => {
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) return

    await createUserDoc({
      uid,
      role: picked,
      clerkUserId: userId ?? undefined,
    })

    setRole(picked)

    // Mark onboarding incomplete until they save a valid profile
    setApplicantProfileCompleted(false)
    setRecruiterProfileCompleted(false)

    setShowProfileBanner(true)
    window.location.hash = '/profile'
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
    window.location.hash = '/applications'
  }

  return (
    <div className='min-h-screen bg-background'>
      <Toaster />
      <SignInButtonBridge />

      {/* Navbar: always show once signed in + role is known (not on role picker). */}
      {currentPage !== 'role' && isSignedIn && roleLoaded && role && (
        <Navbar currentPage={currentPage} />
      )}

      {/* Red banner shown when redirected to /profile for onboarding */}
      {currentPage === 'profile' &&
        isSignedIn &&
        roleLoaded &&
        role &&
        ((role === 'applicant' && !applicantProfileCompleted) ||
          (role === 'recruiter' && !recruiterProfileCompleted)) &&
        showProfileBanner && (
          <div className='w-full bg-red-600 text-white'>
            <div className='container mx-auto px-6 py-3 flex items-center justify-between'>
              <div>
                <div className='font-semibold'>Please confirm account information</div>
              </div>

              <button
                className='text-sm underline hover:opacity-80'
                onClick={() => setShowProfileBanner(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

      {/* Render active page */}
      <main className={currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''}>
        {currentPage === 'home' && <HomePage />}

        {currentPage === 'role' && <RolePage onSelectRole={handleSelectRole} />}

        {currentPage === 'available' && (
          <AvailableJobsPage
            onAddApplication={handleAddApplication}
            // appliedJobIds={appliedJobIds}
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
            isOnboardingRequired={!applicantProfileCompleted}
          />
        )}

        {currentPage === 'profile' && role === 'recruiter' && recruiterProfile && (
          <RecruiterProfilePage
            recruiterProfile={recruiterProfile}
            onSave={handleSaveRecruiterProfile}
          />
        )}

        {currentPage === 'addNewJob' && <AddNewJobPage />}
      </main>
    </div>
  )
}

export default LandingPage
