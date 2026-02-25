// Backend API route that exchanges a Clerk session for a Firebase custom token.
// Enables seamless Firebase access using Clerk-authenticated users.
import { adminAuth } from '@/app/lib/firebaseAdmin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Retrieve the currently authenticated Clerk user
    const { userId } = await auth()
    // If no user is authenticated, block token generation
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a Firebase custom token tied to the Clerk userId
    // The additional metadata identifies Clerk as the auth provider
    const customToken = await adminAuth.createCustomToken(userId, {
      provider: 'clerk',
    })
    // Return the generated token to the client
    return NextResponse.json({ customToken })
  } catch (err: unknown) {
    // Log unexpected errors for debugging and return a generic server error
    console.error('Custom token error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
