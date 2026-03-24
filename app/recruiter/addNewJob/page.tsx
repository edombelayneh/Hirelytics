'use client'

// A form page that lets recruiters submit new jobs.
// - Collect job information
// - Shows a redirecting overlay and then sends the user to the "Job Details" page using hash navigation.
// - Saves job data to Firebase in the 'jobPostings' collection and checks user role (recruiter only)

import { type FormEvent, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addDoc, collection, getDocs } from 'firebase/firestore'
import { db, firebaseAuth } from '../../lib/firebaseClient'
import { availableJobs } from '../../data/availableJobs'
import { getRecruiterProfile } from '../../utils/userProfiles'

type AddNewJobPageProps = {
  initialUserRole?: 'recruiter' | 'applicant'
}

// Matches the AvailableJob interface shape so the document is readable by the applicant job list,
// plus extra recruiter-only fields saved alongside it.
type RecruiterJobPayload = {
  id: number
  // AvailableJob fields
  title: string
  company: string
  location: string
  type: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  status: 'Open'
  applyLink: string
  recruiterId: string
  applicantsId: string[]
  // Extra fields from the form
  recruiterEmail: string
  preferredSkills: string
  country: string
  state: string
  city: string
  paymentType: 'hourly' | 'salary'
  paymentAmount: number | null
  visaRequired: boolean
  jobType: string
  employmentType: string
  experienceLevel: string
  applicationDeadline: string
  generalDescription: string
  jobSource: 'internal'
  createdAt: string
}

// Page for recruiters to create a new job
export default function AddNewJobPage({ initialUserRole = 'recruiter' }: AddNewJobPageProps) {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Returns the next available job ID by finding the highest existing ID.
  // both the seeded static job list and all Firestore job postings, then adding 1.
  const getNextJobId = async () => {
    // Find the highest ID in the local seeded jobs array
    const seededMaxId = availableJobs.reduce((maxId, job) => Math.max(maxId, job.id), 0)

    // Fetch all job postings from Firestore to check for any higher IDs
    const snapshot = await getDocs(collection(db, 'jobPostings'))

    let maxPostedJobId = 0

    snapshot.forEach((jobDoc) => {
      const data = jobDoc.data() as { id?: unknown }

      // Normalize the id field.
      const numericId =
        typeof data.id === 'number'
          ? data.id
          : typeof data.id === 'string'
            ? Number(data.id)
            : Number.NaN

      // Only track valid finite numbers.
      if (Number.isFinite(numericId)) {
        maxPostedJobId = Math.max(maxPostedJobId, numericId)
      }
    })

    // Return one higher than the largest ID found across both sources.
    return Math.max(seededMaxId, maxPostedJobId) + 1
  }

  // Form field state
  const [jobName, setJobName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [description, setDescription] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [preferredSkills, setPreferredSkills] = useState('')
  const [country, setCountry] = useState('')
  const [stateValue, setStateValue] = useState('')
  const [city, setCity] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [visaRequired, setVisaRequired] = useState<boolean>(false)
  const [paymentType, setPaymentType] = useState<'hourly' | 'salary'>('hourly')
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')
  const [jobType, setJobType] = useState<'onsite' | 'remote' | 'hybrid' | ''>('')
  const [generalDescription, setGeneralDescription] = useState('')
  const [employmentType, setEmploymentType] = useState<
    'full-time' | 'part-time' | 'contract' | 'internship' | ''
  >('')
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'lead' | ''>(
    ''
  )
  const [applicationDeadline, setApplicationDeadline] = useState('')
  // UI state

  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [userRole] = useState<'recruiter' | 'applicant'>(initialUserRole)
  const [hasEditedRecruiterEmail, setHasEditedRecruiterEmail] = useState(false)

  // Redirects applicants away from this page.
  useEffect(() => {
    if (userRole !== 'recruiter') {
      router.replace('/') // Send applicant users back to the home page.
    }
  }, [userRole, router])

  // Pre-fill the recruiter email field.
  // Prefers the email stored in the Firebase recruiter profile over the Clerk primary email.
  // Skips the update if the user has already manually edited the field.
  useEffect(() => {
    if (!isLoaded) return // Wait until Clerk has finished loading the user.

    let isCancelled = false

    const hydrateRecruiterEmail = async () => {
      const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? '' // Fallback email from Clerk.
      const uid = firebaseAuth.currentUser?.uid // Firebase UID for profile lookup.

      let preferredEmail = clerkEmail // Start with Clerk email as the default.

      if (uid) {
        try {
          const recruiterProfile = await getRecruiterProfile(uid)
          preferredEmail = recruiterProfile?.recruiterEmail?.trim() || clerkEmail // Prefer Firebase profile email if available
        } catch (error) {
          console.error('Failed to load recruiter profile email:', error)
        }
      }

      if (isCancelled || hasEditedRecruiterEmail || !preferredEmail) return // Bail if stale, user-edited, or empty.

      setRecruiterEmail((currentEmail) => currentEmail || preferredEmail) // Only set if field is still empty.
    }

    hydrateRecruiterEmail().catch((error) => {
      console.error('Failed to hydrate recruiter email:', error)
    })

    return () => {
      isCancelled = true // Mark as cancelled on cleanup.
    }
  }, [isLoaded, user?.id, user?.primaryEmailAddress?.emailAddress, hasEditedRecruiterEmail])

  // handleSubmit
  // This prevents the form from default submission.
  // Saves the job data to the 'jobPostings' Firestore collection.
  // Show a short success message and redirect overlay.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault() // Prevent page reload

    if (userRole !== 'recruiter') {
      setMessage('Unauthorized access')
      return
    }

    setMessage(null)

    // Basic validation for required fields.
    if (!jobName || !companyName || !description || !recruiterEmail) {
      setMessage('Please fill in Job Name, Company Name, Description, and Recruiter Email.')
      return
    }

    const currentRecruiterId = user?.id?.trim()

    if (!currentRecruiterId) {
      setMessage('Unable to identify recruiter account. Please sign in again.')
      return
    }

    setSubmitting(true)

    // Build location string from individual fields
    const location = [city, stateValue, country].filter(Boolean).join(', ')

    // Build salary display string
    const salaryDisplay =
      paymentAmount !== ''
        ? paymentType === 'hourly'
          ? `$${paymentAmount}/hr`
          : `$${Number(paymentAmount).toLocaleString()}/yr`
        : ''

    // Split qualifications by newline into a requirements array
    const requirements = qualifications
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    let nextJobId: number

    try {
      nextJobId = await getNextJobId()
    } catch (error) {
      console.error('Failed to generate job id:', error)
      setMessage('Failed to generate job id. Please try again.')
      setSubmitting(false)
      return
    }

    const jobData: RecruiterJobPayload = {
      id: nextJobId,
      // AvailableJob fields
      title: jobName,
      company: companyName,
      location,
      type: employmentType,
      postedDate: new Date().toISOString().split('T')[0],
      salary: salaryDisplay,
      description,
      requirements,
      status: 'Open',
      applyLink: '#',
      recruiterId: currentRecruiterId,
      applicantsId: [],
      // Extra fields
      recruiterEmail,
      preferredSkills,
      country,
      state: stateValue,
      city,
      paymentType,
      paymentAmount: paymentAmount === '' ? null : paymentAmount,
      visaRequired,
      jobType,
      employmentType,
      experienceLevel,
      applicationDeadline,
      generalDescription,
      jobSource: 'internal',
      createdAt: new Date().toISOString(),
    }

    let createdJobDocId = ''

    try {
      const createdDocRef = await addDoc(collection(db, 'jobPostings'), jobData)
      createdJobDocId = createdDocRef.id
    } catch (error) {
      console.error('Failed to save job:', error)
      setMessage('Failed to save job. Please try again.')
      setSubmitting(false)
      return
    }

    setMessage('Job submitted. Redirecting to Job Details...')
    setShowSuccessToast(true)

    // Show success toast first, then show redirect overlay
    setTimeout(() => {
      setShowSuccessToast(false)
      setRedirecting(true)
    }, 1400)

    // Small delay so user sees toast and overlay before navigation
    setTimeout(() => {
      const detailsJobId = createdJobDocId || String(nextJobId)
      router.push(`/recruiter/JobDetails/${detailsJobId}`)
    }, 3400)
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      {showSuccessToast && (
        <div className='fixed bottom-4 right-4 z-[60]'>
          <div className='flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg'>
            <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='h-4 w-4'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M16.704 5.29a1 1 0 0 1 .006 1.414l-8 8a1 1 0 0 1-1.42-.003l-4-4a1 1 0 0 1 1.414-1.414l3.294 3.293 7.296-7.29a1 1 0 0 1 1.41 0Z'
                  clipRule='evenodd'
                />
              </svg>
            </span>
            <p className='text-sm font-medium text-emerald-900'>Job Successfully Saved</p>
          </div>
        </div>
      )}

      {/* Overlay shown during redirect */}
      {redirecting && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-lg px-6 py-4 shadow-lg text-center'>
            <p className='font-medium mb-2'>Submitting job...</p>
            <p className='text-sm text-gray-600'>Redirecting you to the Job Details page.</p>
          </div>
        </div>
      )}

      <div className='max-w-3xl mx-auto px-6 pt-4'>
        <Link
          href='/recruiter/myJobs'
          className='-ml-[120px] inline-flex items-center rounded border px-3 py-1.5 text-sm'
        >
          Back to My Jobs
        </Link>
      </div>

      <div className='max-w-3xl mx-auto pt-6 pb-10 px-6'>
        <h1 className='text-2xl font-semibold mb-4'>Add Job</h1>
        <p className='text-sm text-gray-600 mb-6'>
          Fill in the job details below. This information will be sent for review.
        </p>

        {/* Validation / status message. */}
        {message && <div className='rounded border p-3 text-sm mb-4'>{message}</div>}
        {/* Job form */}
        <form
          onSubmit={handleSubmit}
          className='space-y-5'
        >
          <div>
            <label
              htmlFor='jobName'
              className='block text-sm mb-1'
            >
              Job Name *
            </label>
            <input
              id='jobName'
              name='jobName'
              type='text'
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder='Software Engineer'
              className='w-full border rounded p-2'
            />
          </div>

          <div>
            <label className='block text-sm mb-1'>Company Name *</label>
            <input
              type='text'
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder='Company Name'
              className='w-full border rounded p-2'
            />
          </div>

          <div>
            <label className='block text-sm mb-1'>Recruiter Email *</label>
            <input
              type='email'
              value={recruiterEmail}
              onChange={(e) => {
                setHasEditedRecruiterEmail(true)
                setRecruiterEmail(e.target.value)
              }}
              placeholder='recruiter@company.com'
              className='w-full border rounded p-2'
            />
          </div>

          <div>
            <label className='block text-sm mb-1'>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Main role summary and responsibilities'
              rows={4}
              className='w-full border rounded p-2'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm mb-1'>Payment Amount (USD)</label>
              <input
                type='number'
                value={paymentAmount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    setPaymentAmount('')
                    return
                  }

                  const parsedValue = parseInt(value, 10)
                  if (!Number.isNaN(parsedValue)) {
                    setPaymentAmount(parsedValue)
                  }
                }}
                placeholder='e.g. 25'
                step='1'
                min='0'
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'hourly' | 'salary')}
                className='w-full border rounded p-2'
              >
                <option value='hourly'>Hourly</option>
                <option value='salary'>Salary</option>
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm mb-1'>Job Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value as 'onsite' | 'remote' | 'hybrid' | '')}
              className='w-full border rounded p-2'
            >
              <option value=''>Select job type</option>
              <option value='onsite'>In-person / On-site</option>
              <option value='remote'>Remote</option>
              <option value='hybrid'>Hybrid</option>
            </select>
          </div>

          <div>
            <label className='block text-sm mb-1'>Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(
                  e.target.value as 'full-time' | 'part-time' | 'contract' | 'internship' | ''
                )
              }
              className='w-full border rounded p-2'
            >
              <option value=''>Select type</option>
              <option value='full-time'>Full-time</option>
              <option value='part-time'>Part-time</option>
              <option value='contract'>Contract</option>
              <option value='internship'>Internship</option>
            </select>
          </div>

          <div>
            <label className='block text-sm mb-1'>Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) =>
                setExperienceLevel(e.target.value as 'entry' | 'mid' | 'senior' | 'lead' | '')
              }
              className='w-full border rounded p-2'
            >
              <option value=''>Select experience level</option>
              <option value='entry'>Entry-level</option>
              <option value='mid'>Mid-level</option>
              <option value='senior'>Senior-level</option>
              <option value='lead'>Lead / Manager</option>
            </select>
          </div>

          <div>
            <label className='block text-sm mb-1'>Application Deadline</label>
            <input
              type='date'
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              className='w-full border rounded p-2'
            />
          </div>

          <div>
            <label className='block text-sm mb-1'>Qualifications</label>
            <textarea
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder='Required skills, experience, or education'
              rows={3}
              className='w-full border rounded p-2'
            />
          </div>

          <div>
            <label className='block text-sm mb-1'>Preferred Skills</label>
            <textarea
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
              placeholder='Preferred but not required skills'
              rows={3}
              className='w-full border rounded p-2'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm mb-1'>Country</label>
              <input
                type='text'
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder='United States'
                className='w-full border rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm mb-1'>State</label>
              <input
                type='text'
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
                placeholder='Michigan'
                className='w-full border rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm mb-1'>City</label>
              <input
                type='text'
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder='Mount Pleasant'
                className='w-full border rounded p-2'
              />
            </div>
          </div>
          <div>
            <label className='block text-sm mb-1'>Visa Sponsorship Available?</label>
            <select
              value={String(visaRequired)}
              onChange={(e) => {
                setVisaRequired(e.target.value === 'true')
              }}
              className='w-full border rounded p-2'
            >
              <option value='true'>Yes, we can sponsor visas</option>
              <option value='false'>No, visa sponsorship is not available</option>
            </select>
          </div>

          <div>
            <label className='block text-sm mb-1'>General Description</label>
            <textarea
              value={generalDescription}
              onChange={(e) => setGeneralDescription(e.target.value)}
              placeholder='Any additional notes or context'
              rows={3}
              className='w-full border rounded p-2'
            />
          </div>

          {/* Submit button - only visible to recruiters */}
          {userRole === 'recruiter' && (
            <button
              type='submit'
              disabled={submitting}
              className='inline-flex items-center gap-2 rounded bg-black text-white px-4 py-2 text-sm font-medium'
            >
              {submitting ? 'Saving...' : 'Add Job'}
            </button>
          )}
        </form>
      </div>
    </main>
  )
}
