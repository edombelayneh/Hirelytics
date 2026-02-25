'use client'

// A form page that lets recruiters submit new jobs.
// - Collect job information
// - Shows a redirecting overlay and then sends the user to the "Job Details" page using hash navigation.
// - Saves job data to Firebase and checks user role (recruiter only)

import { useState } from 'react'

type AddNewJobPageProps = {
  initialUserRole?: 'recruiter' | 'applicant'
}

type RecruiterJobPayload = {
  jobName: string
  companyName: string
  recruiterEmail: string
  description: string
  qualifications: string
  preferredSkills: string
  country: string
  state: string
  city: string
  hourlyRate: number | null
  visaRequired: boolean
  jobType: string
  employmentType: string
  experienceLevel: string
  applicationDeadline: string
  generalDescription: string
  recruiterId: string
  jobSource: 'internal'
  createdAt: string
}

// Page for recruiters to create a new job
export default function AddNewJobPage({ initialUserRole = 'recruiter' }: AddNewJobPageProps) {
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
  const [redirecting, setRedirecting] = useState(false)
  const [userRole] = useState<'recruiter' | 'applicant'>(initialUserRole)

  // handleSubmit
  // This prevents the form from default submission.
  // Saves the job data to Firebase in the 'jobs' collection
  // Show a short success message and redirect overlay.
  const handleSubmit = (e: React.FormEvent) => {
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

    setSubmitting(true)
    // Create job object (currently just logged)
    const jobData: RecruiterJobPayload = {
      jobName,
      companyName,
      recruiterEmail,
      description,
      qualifications,
      preferredSkills,
      country,
      state: stateValue,
      city,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      visaRequired,
      jobType,
      employmentType,
      experienceLevel,
      applicationDeadline,
      generalDescription,
      recruiterId: 'recruiter',
      jobSource: 'internal',
      createdAt: new Date().toISOString(),
    }

    console.log('New job submitted: ', jobData)

    setMessage('Job submitted. Redirecting to Job Details...')
    setRedirecting(true)

    // small delay so the user sees the overlay, then go to Job Details
    setTimeout(() => {
      window.location.hash = '/jobdetails'
    }, 2000)
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Overlay shown during redirect */}
      {redirecting && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-lg px-6 py-4 shadow-lg text-center'>
            <p className='font-medium mb-2'>Submitting job...</p>
            <p className='text-sm text-gray-600'>Redirecting you to the Job Details page.</p>
          </div>
        </div>
      )}

      <div className='max-w-3xl mx-auto py-10 px-6'>
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
              onChange={(e) => setRecruiterEmail(e.target.value)}
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

          <div>
            <label className='block text-sm mb-1'>Pay per hour (USD)</label>
            <input
              type='number'
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder='e.g. 25.00'
              step='0.01'
              min='0'
              className='w-full border rounded p-2'
            />
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
