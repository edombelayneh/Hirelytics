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
import { SignInButtonBridge, protectedAction } from './utils/protectedAction'
import { linkClerkToFirebase } from './utils/linkClerkToFirebase'
import { signOut as fbSignOut } from 'firebase/auth'
import { firebaseAuth } from './lib/firebaseClient'
import { JobApplication } from './data/mockData'
import { AvailableJob } from './data/availableJobs'

type Page = 'home' | 'available' | 'applications' | 'profile' | 'addNewJob' 

function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    console.log('Profile updated:', updatedProfile)
  }

  // ---------------------------
  // NAVIGATION + AUTH PROTECTION
  // ---------------------------
  // Ensures signed-out users cannot access protected routes via URL hash (#)
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
                : 'home'

      const isProtected =
        next === 'available' ||
        next === 'applications' ||
        next === 'profile' ||
        next === 'addNewJob' // 

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
  // ---------------------------
  // When user signs in with Clerk, also sign them into Firebase using a custom token.
  // When user signs out, sign them out of Firebase
  useEffect(() => {
    if (!isLoaded) return // wait for clerk to load
    if (isSignedIn) {
      linkClerkToFirebase()
        .then(() => console.log('Clerk linked to Firebase'))
        .catch((err: any) => console.error('Firebase link error', err))
    } else {
      // Sign out of Firebase when Clerk signs out
      fbSignOut(firebaseAuth).catch(() => {})
    }
  }, [isSignedIn, isLoaded])

  // Handle adding a job application
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

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <div className='min-h-screen bg-background'>
      <Toaster />
      <SignInButtonBridge />

      {isLoaded && isSignedIn && (
        <Navbar
          currentPage={currentPage}
        />
      )}

      {/* Render active page  */}
      <main className={currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'available' && (
          <AvailableJobsPage
            onAddApplication={handleAddApplication}
            appliedJobIds={appliedJobIds}
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
        {currentPage === 'profile' && (
          <ProfilePage
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
        {currentPage === 'addNewJob' && <AddNewJobPage />}
      </main>
    </div>
  )
}

export default LandingPage
