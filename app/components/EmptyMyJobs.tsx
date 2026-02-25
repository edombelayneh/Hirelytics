'use client'

import Link from 'next/link'
import { Button } from '@/app/components/ui/button'

export function EmptyMyJobs() {
  return (
    <div className='rounded-lg border bg-card p-8 text-center space-y-3'>
      <div className='text-lg font-semibold'>No jobs posted yet</div>
      <div className='text-sm text-muted-foreground'>
        Post your first job to start receiving applicants.
      </div>
      <Button asChild>
        <Link href='/recruiter/add-new-job'>Post a job</Link>
      </Button>
    </div>
  )
}
