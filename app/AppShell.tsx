'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { Toaster, toast } from './components/ui/sonner'
import { SignInButtonBridge } from './utils/protectedAction'
import { linkClerkToFirebase } from './utils/linkClerkToFirebase'
import { signOut as fbSignOut } from 'firebase/auth'
import { firebaseAuth } from './lib/firebaseClient'
import { getUserRole, type Role } from './utils/userRole'
import type { UserProfile } from './data/profileData'
import { defaultProfile } from './data/profileData'
import { Navbar } from './components/Navbar'
import {
  getUserProfile,
  getRecruiterProfile,
  type RecruiterProfile,
  saveUserProfile,
  saveRecruiterProfile,
} from './utils/userProfiles'

type Page =
  | 'home'
  | 'available'
  | 'applications'
  | 'profile'
  | 'addNewJob'
  | 'role'
  | 'recruiterHome'

function pageFromPathname(pathname: string): Page {
  if (pathname.startsWith('/applicant/applications')) return 'applications'
  if (pathname.startsWith('/applicant/jobs')) return 'available'
  if (pathname.startsWith('/recruiter/addNewJob')) return 'addNewJob'
  if (pathname.startsWith('/recruiter/myJobs')) return 'recruiterHome'
  if (pathname.startsWith('/applicant/profile') || pathname.startsWith('/recruiter/profile'))
    return 'profile'
  if (pathname.startsWith('/role')) return 'role'
  return 'home'
}

function isNonEmpty(v: unknown) {
  return typeof v === 'string' && v.trim().length > 0
}

function isApplicantProfileComplete(p: UserProfile) {
  return isNonEmpty(p.firstName) && isNonEmpty(p.lastName) && isNonEmpty(p.email)
}

function isRecruiterProfileComplete(p: RecruiterProfile) {
  return isNonEmpty(p.companyName) && isNonEmpty(p.recruiterEmail)
}

const defaultRecruiterProfile: RecruiterProfile = {
  companyName: '',
  companyWebsite: '',
  companyLogo: '',
  companyLocation: '',
  companyDescription: '',
  recruiterName: '',
  recruiterEmail: '',
  recruiterPhone: '',
  recruiterTitle: '',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  const { isSignedIn, isLoaded } = useAuth()
  const currentPage = useMemo(() => pageFromPathname(pathname), [pathname])

  const [firebaseReady, setFirebaseReady] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  const [showProfileBanner, setShowProfileBanner] = useState(false)

  // Clerk ↔ Firebase linking
  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      linkClerkToFirebase()
        .then(() => setFirebaseReady(true))
        .catch((err: unknown) => {
          console.error('Firebase link error', err)
          setFirebaseReady(false)
        })
    } else {
      fbSignOut(firebaseAuth).catch(() => {})

      queueMicrotask(() => {
        setFirebaseReady(false)
        setRole(null)
        setRoleLoaded(false)
        setShowProfileBanner(false)
      })
    }
  }, [isSignedIn, isLoaded])

  // Load role from Firestore
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !firebaseReady) return

    const loadRole = async () => {
      setRoleLoaded(false)

      const uid = firebaseAuth.currentUser?.uid
      if (!uid) {
        setRole(null)
        setRoleLoaded(true)
        return
      }

      const found = await getUserRole(uid)
      setRole(found)
      setRoleLoaded(true)

      if (!found && !pathname.startsWith('/role')) {
        router.replace('/role')
      }
    }

    loadRole().catch((err) => {
      console.error('Role load error:', err)
      setRole(null)
      setRoleLoaded(true)
    })
  }, [isLoaded, isSignedIn, firebaseReady, pathname, router])

  // Signed-out UX protection (toast + open sign-in modal)
  useEffect(() => {
    if (!isLoaded) return

    const isProtected =
      currentPage === 'available' ||
      currentPage === 'applications' ||
      currentPage === 'profile' ||
      currentPage === 'addNewJob' ||
      currentPage === 'recruiterHome' ||
      currentPage === 'role'

    if (isProtected && !isSignedIn) {
      toast('Please sign in to continue', { description: 'This area is for members only.' })
      const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
      btn?.click()
      router.replace('/')
    }
  }, [currentPage, isSignedIn, isLoaded, router])

  // Role-based UX guard
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (!roleLoaded) return
    if (!role) return

    const onApplicantArea = pathname.startsWith('/applicant')
    const onRecruiterArea = pathname.startsWith('/recruiter')

    if (onApplicantArea && role !== 'applicant') {
      toast('Recruiter account', { description: 'This page is for applicants.' })
      router.replace('/recruiter/myJobs')
    }

    if (onRecruiterArea && role !== 'recruiter') {
      toast('Applicant account', { description: 'This page is for recruiters.' })
      router.replace('/applicant/applications')
    }

    if (currentPage === 'role') {
      router.replace(role === 'applicant' ? '/applicant/applications' : '/recruiter/myJobs')
    }
  }, [isLoaded, isSignedIn, roleLoaded, role, pathname, currentPage, router])

  // Profile sync (Clerk -> Firestore) + banner visibility ONLY on profile page
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !firebaseReady || !roleLoaded || !role) return

    const run = async () => {
      const uid = firebaseAuth.currentUser?.uid
      if (!uid) return

      // Clerk values (may be empty)
      const clerkFirst = user?.firstName ?? ''
      const clerkLast = user?.lastName ?? ''
      const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? ''

      // Default: banner off unless we’re on profile and incomplete
      const onApplicantProfile = pathname.startsWith('/applicant/profile')
      const onRecruiterProfile = pathname.startsWith('/recruiter/profile')

      if (role === 'applicant') {
        const saved = (await getUserProfile(uid)) ?? defaultProfile

        // Fill blanks from Clerk (don’t overwrite existing Firestore values)
        const merged: UserProfile = {
          ...saved,
          firstName: isNonEmpty(saved.firstName) ? saved.firstName : clerkFirst,
          lastName: isNonEmpty(saved.lastName) ? saved.lastName : clerkLast,
          email: isNonEmpty(saved.email) ? saved.email : clerkEmail,
        }

        // Save only if we actually changed something
        const changed =
          merged.firstName !== saved.firstName ||
          merged.lastName !== saved.lastName ||
          merged.email !== saved.email

        if (changed) {
          await saveUserProfile(uid, merged)
        }

        const complete = isApplicantProfileComplete(merged)

        // Banner shows ONLY on the profile page and ONLY if incomplete
        setShowProfileBanner(onApplicantProfile && !complete)
        return
      }

      if (role === 'recruiter') {
        const saved = (await getRecruiterProfile(uid)) ?? defaultRecruiterProfile

        // We can at least prefill recruiterEmail + recruiterName from Clerk if blank
        const merged: RecruiterProfile = {
          ...saved,
          recruiterEmail: isNonEmpty(saved.recruiterEmail) ? saved.recruiterEmail : clerkEmail,
          recruiterName: isNonEmpty(saved.recruiterName)
            ? saved.recruiterName
            : [clerkFirst, clerkLast].filter(Boolean).join(' '),
        }

        const changed =
          merged.recruiterEmail !== saved.recruiterEmail ||
          merged.recruiterName !== saved.recruiterName

        if (changed) {
          await saveRecruiterProfile(uid, merged)
        }

        const complete = isRecruiterProfileComplete(merged)

        setShowProfileBanner(onRecruiterProfile && !complete)
        return
      }

      // fallback
      setShowProfileBanner(false)
    }

    run().catch((e) => console.error('Profile sync error:', e))
  }, [isLoaded, isSignedIn, firebaseReady, roleLoaded, role, pathname, user])

  const showNavbar = isSignedIn && roleLoaded && role && currentPage !== 'role'
  const showBanner =
    showProfileBanner && isSignedIn && roleLoaded && role && currentPage === 'profile'

  return (
    <div className='min-h-screen bg-background'>
      <Toaster />
      <SignInButtonBridge />
      {showNavbar && <Navbar />}
      {showBanner && (
        <div className='w-full bg-red-600 text-white'>
          <div className='container mx-auto px-6 py-3 flex items-center justify-between'>
            <div className='font-semibold'>Please confirm account information</div>
            <button
              className='text-sm underline hover:opacity-80'
              onClick={() => setShowProfileBanner(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
