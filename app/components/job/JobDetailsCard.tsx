'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { Job } from '../../types/job'

type JobDetailsCardProps = {
  job: Job
}

export function JobDetailsCard({ job }: JobDetailsCardProps) {
  return (
    <Card className='h-fit'>
      <CardHeader>
        <CardTitle className='text-xl'>{job.title}</CardTitle>
        <div className='text-sm text-muted-foreground'>
          {job.company ? <span>{job.company}</span> : null}
          {job.company && job.location ? <span className='mx-2'>•</span> : null}
          {job.location ? <span>{job.location}</span> : null}
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Add whatever fields you want later */}
        <div className='text-sm'>
          {job.type ? (
            <div>
              <span className='font-medium'>Type:</span> {job.type}
            </div>
          ) : null}

          {job.postedAt ? (
            <div>
              <span className='font-medium'>Posted:</span> {job.postedAt}
            </div>
          ) : null}
        </div>

        {job.description ? (
          <div className='text-sm leading-relaxed whitespace-pre-wrap'>{job.description}</div>
        ) : (
          <div className='text-sm text-muted-foreground'>No description yet.</div>
        )}
      </CardContent>
    </Card>
  )
}
