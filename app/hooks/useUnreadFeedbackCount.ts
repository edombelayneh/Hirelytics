'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db, firebaseAuth } from '../lib/firebaseClient'

/**
 * Subscribes to the current user's applications in Firestore and returns
 * the number of applications that have unread recruiter feedback.
 *
 * enabled:
 *   Pass false to skip the Firestore subscription entirely (e.g. for recruiters).
 *   The hook will return 0 without making any reads.
 */
export function useUnreadFeedbackCount(enabled: boolean): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }

    let unsubFirestore: (() => void) | null = null

    // Wait for Firebase auth to be ready before subscribing to Firestore.
    const unsubAuth = onAuthStateChanged(firebaseAuth, (user) => {
      // Clean up any previous Firestore listener when the auth user changes.
      unsubFirestore?.()
      unsubFirestore = null

      if (!user) {
        setCount(0)
        return
      }

      const q = query(collection(db, 'users', user.uid, 'applications'))

      unsubFirestore = onSnapshot(q, (snap) => {
        let unread = 0
        snap.docs.forEach((d) => {
          const data = d.data()
          if (data.recruiterFeedback && !data.recruiterFeedbackSeen) {
            unread++
          }
        })
        setCount(unread)
      })
    })

    return () => {
      unsubAuth()
      unsubFirestore?.()
    }
  }, [enabled])

  return count
}
