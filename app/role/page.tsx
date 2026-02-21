'use client'

import { useUser } from '@clerk/nextjs'
import { RolePageUI, type Role } from '../components/RolePage'

export default function RolePage() {
  const { user } = useUser()

  const onSelectRole = async (role: Role) => {
    const res = await fetch('/api/user/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (!res.ok) return

    await user?.reload()

    // hard nav to guarantee middleware runs
    window.location.assign(role === 'applicant' ? '/applicant/applications' : '/recruiter/myJobs')
  }

  return <RolePageUI onSelectRole={onSelectRole} />
}
