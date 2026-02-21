'use client'

import { SignedIn } from '@clerk/nextjs'
import { Navbar } from './Navbar'

export function SignedInNavbar() {
  return (
    <SignedIn>
      <Navbar />
    </SignedIn>
  )
}
