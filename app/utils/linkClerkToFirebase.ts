'use client'

// Links Clerk authentication with Firebase client auth by signing in
// the current Clerk user with a Firebase custom token.

import { firebaseAuth } from '@/app/lib/firebaseClient'
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'

let inflight: Promise<void> | null = null

// Ensures Clerk and Firebase sessions stay in sync
export function linkClerkToFirebase(): Promise<void> {
  if (inflight) return inflight

  inflight = (async () => {
    // If already signed into Firebase as someone, skip
    const current = firebaseAuth.currentUser
    if (current) {
      return
    }

    // Fetch Firebase custom token from backend route
    const res = await fetch('/api/firebase/custom-token', { method: 'GET' })
    if (!res.ok) {
      throw new Error(`Failed to fetch custom token: ${res.status}`)
    }
    const { customToken } = await res.json()

    // Sign into Firebase using the Clerk-issued custom token
    await signInWithCustomToken(firebaseAuth, customToken)
  })()
    .catch((err) => {
      console.error('[linkClerkToFirebase] error:', err)
      throw err
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

// Waits until Firebase confirms an authenticated user
export function waitForFirebaseUser(): Promise<void> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(firebaseAuth, () => {
      unsub()
      resolve()
    })
  })
}
