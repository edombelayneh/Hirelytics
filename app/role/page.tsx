'use client'

import { useUser } from '@clerk/nextjs'
import { RolePageUI, type Role } from '../components/RolePage'

export default function RolePage() {
  // Clerk user object (may be undefined briefly while loading)
  const { user } = useUser()

  // Handler passed into RolePageUI
  // Persists role, refreshes Clerk, then redirects
  const onSelectRole = async (role: Role) => {
    // Send role choice to backend API route
    const res = await fetch('/api/user/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    // If save failed, do not redirect
    if (!res.ok) return
    // Refresh Clerk user so publicMetadata.role is updated client-side
    await user?.reload()

    // hard nav to guarantee middleware runs
    window.location.assign(role === 'applicant' ? '/applicant/applications' : '/recruiter/myJobs')
  }
  // Render UI-only component
  return <RolePageUI onSelectRole={onSelectRole} />
}
