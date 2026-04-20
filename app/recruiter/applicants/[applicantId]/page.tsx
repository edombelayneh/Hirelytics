'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../../../lib/firebaseClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Mail, Phone, MapPin, Globe, Linkedin, Github, FileText } from 'lucide-react'
import { defaultProfile, type UserProfile } from '../../../data/profileData'
import type { JobHistoryItem } from '../../../utils/jobHistory'

export default function RecruiterApplicantProfilePage() {
  const { applicantId } = useParams() as { applicantId?: string }

  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!applicantId) return

    const loadProfile = async () => {
      setLoading(true)
      setNotFound(false)

      try {
        const userRef = doc(db, 'users', applicantId)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          setNotFound(true)
          return
        }

        const userData = userSnap.data() as { profile?: UserProfile }
        setProfile({ ...defaultProfile, ...(userData.profile ?? {}) })

        const historySnap = await getDocs(collection(db, 'users', applicantId, 'jobHistory'))
        setJobHistory(
          historySnap.docs.map((docItem) => ({
            id: docItem.id,
            ...(docItem.data() as Omit<JobHistoryItem, 'id'>),
          }))
        )
      } catch (error) {
        console.error('Failed to load applicant profile:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [applicantId])

  return (
    <div className='min-h-screen bg-white'>
      <main className='mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6'>
        <div className='mb-6'>
          <Button
            asChild
            variant='outline'
          >
            <Link href='/recruiter/myJobs'>Back to my jobs</Link>
          </Button>
        </div>

        {loading ? (
          <div className='rounded-md border bg-card p-6 text-sm text-muted-foreground'>
            Loading applicant profile...
          </div>
        ) : notFound ? (
          <div className='rounded-md border bg-card p-6 text-sm text-muted-foreground'>
            Applicant profile not found.
          </div>
        ) : (
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>
                  {`${profile.firstName} ${profile.lastName}`.trim() || 'Applicant profile'}
                </CardTitle>
                <CardDescription>
                  Candidate profile pulled from the user&apos;s account.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className='grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
                  {/* LEFT SIDEBAR */}
                  <div className='space-y-4 rounded-xl border p-4'>
                    <div className='flex flex-col items-center gap-4 text-center'>
                      <Avatar className='h-24 w-24'>
                        {profile.profilePicture ? (
                          <AvatarImage
                            src={profile.profilePicture}
                            alt='Applicant photo'
                          />
                        ) : (
                          <AvatarFallback>
                            {(profile.firstName?.[0] ?? 'A').toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div>
                        <p className='text-lg font-semibold'>
                          {`${profile.firstName} ${profile.lastName}`.trim() || 'Unnamed candidate'}
                        </p>
                        {profile.currentTitle && (
                          <p className='text-sm text-muted-foreground'>{profile.currentTitle}</p>
                        )}
                      </div>
                    </div>

                    {/* CONTACT INFO */}
                    <div className='space-y-3 text-sm'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Mail
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.email || 'No email saved'}</span>
                      </div>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Phone
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.phone || 'No phone saved'}</span>
                      </div>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <MapPin
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.location || 'No location saved'}</span>
                      </div>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Globe
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.availability || 'Availability not set'}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT CONTENT */}
                  <div className='space-y-6'>
                    <div className='grid gap-4 rounded-xl border p-6'>
                      <div>
                        <h3 className='text-base font-semibold'>About</h3>
                        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                          {profile.bio || 'No bio available for this applicant.'}
                        </p>
                      </div>

                      <div className='grid gap-3 sm:grid-cols-2'>
                        <div className='rounded-xl border p-4'>
                          <p className='text-sm font-semibold'>Experience</p>
                          <p className='mt-2 text-sm text-muted-foreground'>
                            {profile.yearsOfExperience || 'Not provided'}
                          </p>
                        </div>
                        <div className='rounded-xl border p-4'>
                          <p className='text-sm font-semibold'>Current role</p>
                          <p className='mt-2 text-sm text-muted-foreground'>
                            {profile.currentTitle || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {/* LINKS */}
                      <div className='grid gap-3 sm:grid-cols-3'>
                        {profile.linkedinUrl && (
                          <a
                            href={profile.linkedinUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium'
                          >
                            <Linkedin
                              className='h-4 w-4'
                              style={{ color: '#F05DC1' }}
                            />
                            LinkedIn
                          </a>
                        )}

                        {profile.portfolioUrl && (
                          <a
                            href={profile.portfolioUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium'
                          >
                            <Globe
                              className='h-4 w-4'
                              style={{ color: '#F05DC1' }}
                            />
                            Portfolio
                          </a>
                        )}

                        {profile.githubUrl && (
                          <a
                            href={profile.githubUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium'
                          >
                            <Github
                              className='h-4 w-4'
                              style={{ color: '#F05DC1' }}
                            />
                            GitHub
                          </a>
                        )}
                      </div>

                      {/* RESUME */}
                      {profile.resumeFile ? (
                        <a
                          href={profile.resumeFile}
                          download={profile.resumeFileName || true}
                          className='inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium'
                        >
                          <FileText
                            className='h-4 w-4'
                            style={{ color: '#F05DC1' }}
                          />
                          {profile.resumeFileName || 'Download resume'}
                        </a>
                      ) : (
                        <div className='rounded-xl border p-4 text-sm text-muted-foreground'>
                          Resume not available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JOB HISTORY */}
            <Card>
              <CardHeader>
                <CardTitle>Employment history</CardTitle>
                <CardDescription>Past positions saved by the applicant.</CardDescription>
              </CardHeader>

              <CardContent>
                {jobHistory.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No job history entries available.</p>
                ) : (
                  <div className='space-y-4'>
                    {jobHistory.map((item) => (
                      <div
                        key={item.id}
                        className='rounded-xl border p-4'
                      >
                        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                          <div>
                            <p className='text-sm font-semibold'>{item.title}</p>
                            <p className='text-sm text-muted-foreground'>{item.company}</p>
                          </div>
                          <span className='text-sm text-muted-foreground'>
                            {item.startDate} -{' '}
                            {item.isCurrent ? 'Present' : item.endDate || 'Ended'}
                          </span>
                        </div>

                        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                          {item.roleDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
