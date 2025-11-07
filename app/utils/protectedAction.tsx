// app/utils/protectedAction.ts
'use client';
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
  } from '@clerk/nextjs'
import { toast } from '../components/ui/sonner';

// tiny wrapper to open Clerk modal programmatically via a hidden button
let openSignIn: (() => void) | null = null;

export function SignInButtonBridge() {
  // Invisible SignInButton we can "click" programmatically
  return (
    <div className="hidden">
      <SignInButton mode="modal" forceRedirectUrl ="/#/" signUpForceRedirectUrl="/#/">
        <button id="__sign_in_bridge__" />
      </SignInButton>
    </div>
  );
}

export function triggerSignIn() {
  const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null;
  btn?.click();
}

export function protectedAction({
  isSignedIn,
  onAuthed,
  message = 'Please sign in to continue',
}: {
  isSignedIn: boolean | undefined;
  onAuthed: () => void;
  message?: string;
}) {
  if (isSignedIn) {
    onAuthed();
  } else {
    toast(message, { description: 'You must be signed in to access this feature.' });
    triggerSignIn();
  }
}
