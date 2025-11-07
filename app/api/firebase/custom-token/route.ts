import { adminAuth } from '@/app/lib/firebaseAdmin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customToken = await adminAuth.createCustomToken(userId, {
      provider: 'clerk',
    })

    return NextResponse.json({ customToken })
  } catch (err: unknown) {
    console.error('Custom token error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
