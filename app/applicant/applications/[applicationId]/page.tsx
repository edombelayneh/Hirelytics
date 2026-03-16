'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import type { JobApplication } from '@/app/data/mockData'
import { useAuth } from '@clerk/nextjs'
import { db } from '@/app/lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'

export default function ApplicationDetailsPage() {
  const router = useRouter()
  const { applicationId } = useParams<{ applicationId: string }>()
  const { userId, isLoaded } = useAuth()

  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !userId) return

    const ref = doc(db, 'users', userId, 'applications', applicationId)
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setApplication({ id: snap.id, ...snap.data() } as JobApplication)
      }
      setLoading(false)
    })
  }, [isLoaded, userId, applicationId])

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='text-muted-foreground'>Application not found.</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-6 py-8 space-y-6'>
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            onClick={() => router.push('/applicant/applications')}
          >
            Back to My Applications
          </Button>

          {application.jobLink ? (
            <Button asChild>
              <Link
                href={application.jobLink}
                target='_blank'
                rel='noreferrer'
              >
                Open Job Posting
              </Link>
            </Button>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{application.position}</CardTitle>
            <div className='text-sm text-muted-foreground'>{application.company}</div>
          </CardHeader>

          <CardContent className='space-y-3 text-sm'>
            <div>
              <span className='font-medium'>Status:</span> {application.status}
            </div>
            <div>
              <span className='font-medium'>Outcome:</span> {application.outcome}
            </div>
            <div>
              <span className='font-medium'>Applied:</span> {application.applicationDate}
            </div>
            <div>
              <span className='font-medium'>Location:</span> {application.city},{' '}
              {application.country}
            </div>
            <div>
              <span className='font-medium'>Source:</span> {application.jobSource}
            </div>

            <div className='pt-2'>
              <div className='font-medium mb-1'>Notes</div>
              <div className='text-muted-foreground whitespace-pre-wrap'>
                {application.notes?.trim() ? application.notes : 'No notes yet.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
