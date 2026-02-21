import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

type Role = 'applicant' | 'recruiter'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { role?: Role }
  const role = body.role

  if (role !== 'applicant' && role !== 'recruiter') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const client = await clerkClient()

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  })

  return NextResponse.json({ ok: true })
}
