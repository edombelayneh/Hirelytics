import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

// Restricts valid role values to prevent invalid metadata updates
type Role = 'applicant' | 'recruiter'

export async function POST(req: Request) {
  // Ensure the request is coming from an authenticated Clerk user
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Parse the request body and extract the selected role
  const body = (await req.json()) as { role?: Role }
  const role = body.role
  // Validate role input before writing to Clerk metadata
  if (role !== 'applicant' && role !== 'recruiter') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  // Initialize Clerk client for server-side user updates
  const client = await clerkClient()
  // Store the selected role in public metadata
  // This allows frontend routing and role-based UI logic
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  })
  // Return success response after metadata update
  return NextResponse.json({ ok: true })
}
