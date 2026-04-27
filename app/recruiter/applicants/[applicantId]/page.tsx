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
  // Extract applicant ID from URL parameters
  const { applicantId } = useParams() as { applicantId?: string }

  // State management for profile data and UI states
  const [profile, setProfile] = useState<UserProfile>(defaultProfile) // Applicant's profile information
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([]) // Array of applicant's work experience
  const [loading, setLoading] = useState(true) // Loading state while fetching data
  const [notFound, setNotFound] = useState(false) // Error state if applicant doesn't exist

  // Load applicant profile and job history from Firebase when component mounts
  // This effect runs once on mount and whenever applicantId changes
  useEffect(() => {
    // Don't attempt to load if no applicant ID is provided
    if (!applicantId) return

    /**
     * Async function to fetch applicant data from Firebase
     * Handles both profile information and job history collection
     */
    const loadProfile = async () => {
      // Reset states for fresh data load
      setLoading(true)
      setNotFound(false)

      try {
        // Step 1: Fetch main user profile document
        const userRef = doc(db, 'users', applicantId)
        const userSnap = await getDoc(userRef)

        // Handle case where applicant doesn't exist
        if (!userSnap.exists()) {
          setNotFound(true)
          return
        }

        // Extract and merge profile data with defaults
        const userData = userSnap.data() as { profile?: UserProfile }
        setProfile({ ...defaultProfile, ...(userData.profile ?? {}) })

        // Step 2: Fetch job history subcollection
        // Job history is stored as a subcollection under each user document
        const historySnap = await getDocs(collection(db, 'users', applicantId, 'jobHistory'))

        // Transform Firestore documents into JobHistoryItem array
        setJobHistory(
          historySnap.docs.map((docItem) => ({
            id: docItem.id, // Firestore document ID
            ...(docItem.data() as Omit<JobHistoryItem, 'id'>), // Document data without ID
          }))
        )
      } catch (error) {
        // Log error for debugging and set not found state
        console.error('Failed to load applicant profile:', error)
        setNotFound(true)
      } finally {
        // Always stop loading regardless of success/failure
        setLoading(false)
      }
    }

    // Execute the data loading function
    loadProfile()
  }, [applicantId]) // Re-run effect if applicantId changes

  return (
    // Main page container with full height and white background
    <div className='min-h-screen bg-white'>
      {/* Centered content container with responsive padding */}
      <main className='mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6'>
        {/* Navigation: Back button to return to recruiter's job dashboard */}
        <div className='mb-6'>
          <Button
            asChild
            variant='outline'
          >
            <Link href='/recruiter/myJobs'>Back to my jobs</Link>
          </Button>
        </div>

        {/* Conditional rendering based on data loading state */}
        {loading ? (
          // Loading state: Show loading message while data is being fetched
          <div className='rounded-md border bg-card p-6 text-sm text-muted-foreground'>
            Loading applicant profile...
          </div>
        ) : notFound ? (
          // Error state: Show error message if applicant profile doesn't exist
          <div className='rounded-md border bg-card p-6 text-sm text-muted-foreground'>
            Applicant profile not found.
          </div>
        ) : (
          // Success state: Render the complete applicant profile
          <div className='space-y-6'>
            {/* MAIN PROFILE CARD - Contains sidebar and main content areas */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-primary'>
                  Candidate Profile
                </CardTitle>
                <CardDescription>
                  Candidate profile pulled from the user&apos;s account.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Two-column layout: Sidebar (photo/contact) and Main content (about/experience) */}
                <div className='grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
                  {/* LEFT SIDEBAR - Profile photo and contact information */}
                  <div className='space-y-4 rounded-xl border p-4'>
                    {/* Profile photo and name section */}
                    <div className='flex flex-col items-center gap-4 text-center'>
                      <Avatar className='h-24 w-24'>
                        {profile.profilePicture ? (
                          <AvatarImage
                            src={profile.profilePicture}
                            alt='Applicant photo'
                          />
                        ) : (
                          // Fallback to first letter of first name
                          <AvatarFallback>
                            {(profile.firstName?.[0] ?? 'A').toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* Applicant name and current title */}
                      <div>
                        <p className='text-lg font-semibold'>
                          {`${profile.firstName} ${profile.lastName}`.trim() || 'Unnamed candidate'}
                        </p>
                        {profile.currentTitle && (
                          <p className='text-sm text-muted-foreground'>{profile.currentTitle}</p>
                        )}
                      </div>
                    </div>

                    {/* CONTACT INFORMATION SECTION */}
                    <div className='space-y-3 text-sm'>
                      {/* Email contact */}
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Mail
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.email || 'No email saved'}</span>
                      </div>

                      {/* Phone contact */}
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Phone
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.phone || 'No phone saved'}</span>
                      </div>

                      {/* Location */}
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <MapPin
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.location || 'No location saved'}</span>
                      </div>

                      {/* Availability status */}
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Globe
                          className='h-4 w-4'
                          style={{ color: '#F05DC1' }}
                        />
                        <span>{profile.availability || 'Availability not set'}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT CONTENT - Main profile information and details */}
                  <div className='space-y-6'>
                    {/* ABOUT SECTION - Professional bio and key information */}
                    <div className='grid gap-4 rounded-xl border p-6'>
                      <div>
                        <h2 className='text-lg font-semibold text-primary mb-3'>About</h2>
                        <p className='text-sm leading-6 text-muted-foreground'>
                          {profile.bio || 'No bio available for this applicant.'}
                        </p>
                      </div>

                      {/* EXPERIENCE SUMMARY CARDS */}
                      <div className='grid gap-3 sm:grid-cols-2'>
                        {/* Years of experience card */}
                        <div className='rounded-xl border p-4'>
                          <h3 className='text-base font-semibold text-primary mb-2'>Experience</h3>
                          <p className='text-sm text-muted-foreground'>
                            {profile.yearsOfExperience || 'Not provided'}
                          </p>
                        </div>

                        {/* Current role card */}
                        <div className='rounded-xl border p-4'>
                          <h3 className='text-base font-semibold text-primary mb-2'>
                            Current role
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {profile.currentTitle || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {/* PROFESSIONAL LINKS SECTION */}
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

            {/* JOB HISTORY SECTION - Displays applicant's work experience */}
            <Card className='p-6'>
              {/* Section header with title and description */}
              <div className='space-y-2'>
                <h2 className='text-lg font-semibold text-primary'>Job History</h2>
                <p className='text-sm text-muted-foreground'>
                  Past positions saved by the applicant.
                </p>
              </div>

              {/* Job history content area */}
              <div className='mt-4 space-y-4'>
                {/* Handle empty state when no job history exists */}
                {jobHistory.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No job history added yet.</p>
                ) : (
                  // Render each job history item
                  jobHistory.map((item) => (
                    <div
                      key={item.id}
                      className='rounded-lg border p-4 space-y-3'
                    >
                      {/* Job title, company and date header */}
                      <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                        <div>
                          <h3 className='text-base font-semibold'>{item.title}</h3>
                          <p className='text-sm text-muted-foreground'>{item.company}</p>
                        </div>

                        {/* Employment date range */}
                        <span className='text-sm text-muted-foreground'>
                          {item.startDate} - {item.isCurrent ? 'Current' : item.endDate || 'Ended'}
                        </span>
                      </div>

                      {/* Job role description */}
                      <p className='text-sm whitespace-pre-wrap'>{item.roleDescription}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
