'use client'
// Utility functions for protecting user actions that require authentication.
// If the user is not signed in, a toast appears and Clerk's sign-in modal opens.
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { toast } from '../components/ui/sonner'

// tiny wrapper to open Clerk modal programmatically via a hidden button
const openSignIn: (() => void) | null = null

// Invisible SignInButton that can be clicked programmatically
export function SignInButtonBridge() {
  // Invisible SignInButton we can "click" programmatically
  return (
    <div className='hidden'>
      <SignInButton
        mode='modal'
        forceRedirectUrl='/#/'
        signUpForceRedirectUrl='/#/'
      >
        <button id='__sign_in_bridge__' />
      </SignInButton>
    </div>
  )
}

// Opens Clerk sign-in modal by "clicking" the hidden button
export function triggerSignIn() {
  const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null
  btn?.click()
}

// Wraps protected actions and ensures the user is authenticated before continuing
export function protectedAction({
  isSignedIn,
  onAuthed,
  message = 'Please sign in to continue',
}: {
  isSignedIn: boolean | undefined
  onAuthed: () => void
  message?: string
}) {
  if (isSignedIn) {
    onAuthed()
  } else {
    toast(message, { description: 'You must be signed in to access this feature.' })
    triggerSignIn()
  }
}
