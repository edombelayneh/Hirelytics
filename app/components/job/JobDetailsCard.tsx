'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { Job } from '../../types/job'

type JobDetailsCardProps = {
  job: Job
}

export function JobDetailsCard({ job }: JobDetailsCardProps) {
  return (
    <Card className='h-fit'>
           {' '}
      <CardHeader>
                <CardTitle className='text-xl'>{job.title}</CardTitle>       {' '}
        {/* Render compact job metadata only when values are available. */}       {' '}
        <div className='text-sm text-muted-foreground'>
                    {job.company ? <span>{job.company}</span> : null}         {' '}
          {job.company && job.location ? <span className='mx-2'>•</span> : null}         {' '}
          {job.location ? <span>{job.location}</span> : null}       {' '}
        </div>
             {' '}
      </CardHeader>
           {' '}
      <CardContent className='space-y-3'>
                {/* Keep high-level job attributes grouped together for quick scanning. */}       {' '}
        <div className='text-sm'>
                   {' '}
          {job.type ? (
            <div>
                            <span className='font-medium'>Work Arrangement:</span> {job.type}       
                 {' '}
            </div>
          ) : null}
                   {' '}
          {job.postedAt ? (
            <div>
                            <span className='font-medium'>Posted:</span> {job.postedAt}         
               {' '}
            </div>
          ) : null}
                 {' '}
        </div>
                {/* Fall back gracefully when a description has not been provided. */}       {' '}
        {job.description ? (
          <div className='text-sm leading-relaxed whitespace-pre-wrap'>{job.description}</div>
        ) : (
          <div className='text-sm text-muted-foreground'>No description yet.</div>
        )}
             {' '}
      </CardContent>
         {' '}
    </Card>
  )
}
