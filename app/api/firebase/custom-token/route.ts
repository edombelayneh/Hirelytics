import { adminAuth } from '@/app/lib/firebaseAdmin';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// IMPORTANT: Force Node.js runtime (Admin SDK isn't edge-compatible)
export const runtime = 'nodejs'; // Next 14+ (if you use older Next, use config with dynamic = 'force-dynamic')

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optionally: set custom claims or map metadata
    // e.g., by default, UID = Clerk userId
    const customToken = await adminAuth.createCustomToken(userId, {
      provider: 'clerk',
    });

    return NextResponse.json({ customToken });
  } catch (err: unknown) {
    console.error('Custom token error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
