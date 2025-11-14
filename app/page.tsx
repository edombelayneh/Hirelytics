'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import HomePage from './home/page'
import AvailableJobsPage from './jobs/page'
import MyApplicationsPage from './applications/page'
import type { UserProfile } from './data/profileData'
import { defaultProfile } from './data/profileData'
import { ProfilePage } from './profile/page'
import { Navbar } from './components/Navbar'
import { Toaster, toast } from './components/ui/sonner'
import { SignInButtonBridge, protectedAction } from './utils/protectedAction'
import { linkClerkToFirebase } from './utils/linkClerkToFirebase'
import { signOut as fbSignOut } from 'firebase/auth'
import { firebaseAuth } from './lib/firebaseClient'

type Page = 'home' | 'available' | 'applications' | 'profile'

function LandingPage() {
  const { isSignedIn } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    console.log('Profile updated:', updatedProfile)
  }

  // ---------------------------
  // NAVIGATION + AUTH PROTECTION
  // ---------------------------
  // Ensures signed-out users cannot access protected routes via URL hash (#)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)

      // Determine next page based on hash
      const next: Page =
        hash === '/applications'
          ? 'applications'
          : hash === '/jobs'
            ? 'available'
            : hash === '/profile'
              ? 'profile'
              : 'home'

      // If navigating to protected routes (jobs/applications) while signed out,
      // show toast and redirect to home
      const isProtected = next === 'available' || next === 'applications'
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
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [isSignedIn])

  // ---------------------------
  // CLERK ↔ FIREBASE LINKING
  // ---------------------------
  // When user signs in with Clerk, also sign them into Firebase using a custom token.
  // When user signs out, sign them out of Firebase
  useEffect(() => {
    if (isSignedIn) {
      linkClerkToFirebase()
        .then(() => console.log('Clerk linked to Firebase'))
        .catch((err) => console.error('Firebase link error', err))
    } else {
      // Sign out of Firebase when Clerk signs out
      fbSignOut(firebaseAuth).catch(() => {})
    }
  }, [isSignedIn])

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <div className='min-h-screen bg-background'>
      <Toaster />
      <SignInButtonBridge />

      {/* Show app navbar ONLY for signed-in users */}
      {isSignedIn ? (
        <Navbar
          currentPage={currentPage}
          applicationCount={0}
        />
      ) : null}

      {/* Render active page */}
      <main className={currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'applications' && <MyApplicationsPage applications={[]} />}
        {currentPage == 'profile' && (
          <ProfilePage
            profile={defaultProfile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>
    </div>
  )
}

export default LandingPage
