'use client'

/* This page shows details for a specific job application. 
    It is accessed by clicking on an application in the My Applications table.
    It will display all details about the application, including company, position, location, status, outcome, notes, and any links (job posting, resume, etc).
    There is also a button to go back to the My Applications page.
    This is a TEMP FILE: FIXME - replace with real fetching
    */
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import type { JobApplication } from '@/app/data/mockData'
import { Navbar } from '@/app/components/Navbar'

export default function ApplicationDetailsPage() {
  const router = useRouter()
  const params = useParams<{ applicationId: string }>()
  const applicationId = params.applicationId

  // TODO: Replace with Firestore fetch
  const [application, setApplication] = useState<JobApplication | null>(null)

  useEffect(() => {
    // TEMP: Replace this with real fetch based on applicationId
    // For now just show placeholder so the route works.
    setApplication({
      id: applicationId,
      company: 'Example Company',
      city: 'Remote',
      country: 'USA',
      jobLink: 'https://example.com',
      position: 'Software Engineer Intern',
      applicationDate: '2026-02-21',
      status: 'Applied',
      contactPerson: '',
      notes: '',
      jobSource: 'Other',
      outcome: 'Pending',
    })
  }, [applicationId])

  if (!application) {
    return <div className='container mx-auto px-6 py-8'>Loading...</div>
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
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
