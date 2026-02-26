'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from '../components/ui/sonner'
import { RolePageUI, type Role } from '../components/RolePage'
import { createUserDoc } from '../utils/userRole'
import { firebaseAuth } from '../lib/firebaseClient'

export default function RolePage() {
  const { user } = useUser()
  const { userId } = useAuth()
  const router = useRouter()

  const onSelectRole = async (role: Role) => {
    // 1) Make sure Firebase UID exists
    const uid = firebaseAuth.currentUser?.uid
    if (!uid) {
      toast.error('Not ready yet', { description: 'Try again in a moment.' })
      return
    }

    // 2) Save role to Firestore (so AppShell getUserRole() sees it)
    await createUserDoc({
      uid,
      role,
      clerkUserId: userId ?? undefined,
    })

    // 3) Save role to Clerk metadata (so middleware can enforce role server-side)
    const res = await fetch('/api/user/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (!res.ok) {
      toast.error('Could not save role', { description: 'Please try again.' })
      return
    }

    // 4) Refresh Clerk user locally (Navbar reads it)
    await user?.reload()

    // 5) Go to profile first for onboarding (AppShell banner logic expects this)
    router.replace(role === 'applicant' ? '/applicant/profile' : '/recruiter/profile')
  }

  return <RolePageUI onSelectRole={onSelectRole} />
}
