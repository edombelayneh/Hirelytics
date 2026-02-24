'use client'

import { useState } from 'react'

// Allowed roles in the system
export type Role = 'applicant' | 'recruiter'

// UI-only component for choosing a role
// Parent is responsible for actually persisting the role
export function RolePageUI({
  onSelectRole,
}: {
  // Callback passed from parent to handle role persistence
  onSelectRole: (role: Role) => Promise<void> | void
}) {
  // Tracks which role is currently being saved (used for loading + disabling buttons)
  const [savingRole, setSavingRole] = useState<Role | null>(null)
  // Handles role selection and manages loading state
  const handlePick = async (role: Role) => {
    // Set loading state immediately (disables both buttons)
    setSavingRole(role)
    try {
      // Call parent handler
      await onSelectRole(role)
    } finally {
      setSavingRole(null) // Reset loading state regardless of success/failure
    }
  }

  return (
    // Full-screen centered container
    <div className='min-h-screen bg-background flex items-center justify-center px-6'>
      <div className='w-full max-w-lg rounded-xl border bg-card p-8'>
        {/* Page heading */}
        <h1 className='text-2xl font-semibold'>Welcome</h1>
        {/* Instructional text */}
        <p className='mt-2 text-sm text-muted-foreground'>
          Before you continue, tell us what you are here to do.
        </p>
        {/* Role selection buttons */}
        <div className='mt-6 space-y-3'>
          {/* Applicant button */}
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
          {/* Recruiter button */}
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
        {/* Loading indicator shown while role is being saved */}
        {savingRole && <p className='mt-4 text-sm text-muted-foreground'>Saving your choice...</p>}
      </div>
    </div>
  )
}
