'use client'

import { useState } from 'react'

type Role = 'applicant' | 'recruiter'

export default function RolePage({
  onSelectRole,
}: {
  // Parent (app/page.tsx) will pass this function in
  onSelectRole: (role: Role) => Promise<void> | void
}) {
  // Used to disable buttons while saving
  const [savingRole, setSavingRole] = useState<Role | null>(null)

  const handlePick = async (role: Role) => {
    setSavingRole(role)

    try {
      // Call the function the parent gave us
      await onSelectRole(role)
    } finally {
      // If parent doesn't redirect, re-enable buttons
      setSavingRole(null)
    }
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center px-6'>
      <div className='w-full max-w-lg rounded-xl border bg-card p-8'>
        <h1 className='text-2xl font-semibold'>Welcome</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Before you continue, tell us what you are here to do.
        </p>

        <div className='mt-6 space-y-3'>
          <button
            type='button'
            onClick={() => handlePick('applicant')}
            disabled={savingRole !== null}
            className='w-full rounded-lg border px-4 py-3 text-left hover:bg-accent disabled:opacity-60'
          >
            <div className='font-medium'>Apply to jobs</div>
            <div className='text-sm text-muted-foreground'>
              Track applications, save notes, and manage your job search.
            </div>
          </button>

          <button
            type='button'
            onClick={() => handlePick('recruiter')}
            disabled={savingRole !== null}
            className='w-full rounded-lg border px-4 py-3 text-left hover:bg-accent disabled:opacity-60'
          >
            <div className='font-medium'>Post jobs</div>
            <div className='text-sm text-muted-foreground'>
              Create job posts and manage applicants.
            </div>
          </button>
        </div>

        {savingRole && <p className='mt-4 text-sm text-muted-foreground'>Saving your choice...</p>}
      </div>
    </div>
  )
}
