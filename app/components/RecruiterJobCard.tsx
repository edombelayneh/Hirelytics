'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import type { RecruiterJob } from '../types/recruiterJobs'

export function RecruiterJobCard({ job }: { job: RecruiterJob }) {
  return (
    <Card>
      <CardHeader className='space-y-1'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <CardTitle className='text-lg'>{job.title}</CardTitle>
            <div className='text-sm text-muted-foreground'>
              {job.company}
              {job.location ? ` • ${job.location}` : ''}
              {job.type ? ` • ${job.type}` : ''}
            </div>
          </div>

          <Button
            asChild
            variant='outline'
            size='sm'
          >
            <Link href={`/recruiter/JobDetails/${job.id}`}>View details</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='text-sm space-y-2'>
        <div className='flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground'>
          {job.postedAt ? <span>Posted: {job.postedAt}</span> : null}
          {job.status ? <span>Status: {job.status}</span> : null}
          {typeof job.applicantsCount === 'number' ? (
            <span>Applicants: {job.applicantsCount}</span>
          ) : null}
        </div>

        {/* small preview */}
        {job.description ? (
          <p className='text-muted-foreground line-clamp-2'>{job.description}</p>
        ) : (
          <p className='text-muted-foreground'>No description yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
