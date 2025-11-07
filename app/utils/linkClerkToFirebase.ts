'use client';

import { firebaseAuth } from '@/app/lib/firebaseClient';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

let inflight: Promise<void> | null = null;

/**
 * Signs into Firebase with a custom token minted for the current Clerk user.
 * Safe to call multiple times; concurrent calls will dedupe.
 */
export function linkClerkToFirebase(): Promise<void> {
  if (inflight) return inflight;

  inflight = (async () => {
    // If already signed into Firebase as someone, skip
    const current = firebaseAuth.currentUser;
    if (current) {
      return;
    }

    const res = await fetch('/api/firebase/custom-token', { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Failed to fetch custom token: ${res.status}`);
    }
    const { customToken } = await res.json();

    await signInWithCustomToken(firebaseAuth, customToken);
  })()
    .catch((err) => {
      console.error('[linkClerkToFirebase] error:', err);
      throw err;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Optional convenience: wait until Firebase is ready (i.e., user object is non-null) */
export function waitForFirebaseUser(): Promise<void> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(firebaseAuth, () => {
      unsub();
      resolve();
    });
  });
}
