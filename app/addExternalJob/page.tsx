'use client'

/**
 * Add External Job Page
 * 
 * This page allows users to 
 * 1. Paste a job link
 * 2. Confirm/edit job details
 * 3. Save the job as an application for tracking
 * 
 * This data should eventually be saved to: users/{uid}/applications not to a shared/global jobs collection.
 */

import { useEffect, useMemo, useState } from 'react'

// Controlled select fields types 
type VisaRequired = 'yes' | 'no' | ''
type WorkArrangement = 'onsite' | 'remote' | 'hybrid' | ''
type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | ''
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | ''
type JobSource = 'LinkedIn' | 'Indeed' | 'Handshake' | 'Glassdoor' | 'Google Jobs' | 'Company Career Page' | 'Other' | ''
type PaymentType = 'hourly' | 'salary' | ''

// Returns todays date, used as default value for applicationDate
function safeToday() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Extracts a company name guess from Job URL
function guessCompanyFromUrl(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    const base = host.split('.')[0] || 'Unknown'
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return 'Unknown Company'
  }
}


export default function AddExternalJobPage() {
  // Step control
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1: URL
  const [JobUrl, setJobUrl] = useState('')
  const [UrlError, setUrlError] = useState<string | null>(null)

  // Step 2: autofill + editable fields (modeled after the AddNewJob page)
  const [JobName, setJobName] = useState('')
  const [CompanyName, setCompanyName] = useState('')
  const [CompanyContact, setCompanyContact] = useState('')
  const [Description, setDescription] = useState('')
  const [Qualifications, setQualifications] = useState('')
  const [PreferredSkills, setPreferredSkills] = useState('')
  const [Country, setCountry] = useState('')
  const [StateValue, setStateValue] = useState('')
  const [City, setCity] = useState('')
  const [PaymentAmount, setPaymentAmount] = useState('')
  const [PaymentType, setPaymentType] = useState<PaymentType>('')
  const [VisaRequired, setVisaRequired] = useState<VisaRequired>('')
  const [WorkArrangement, setWorkArrangement] = useState<WorkArrangement>('')
  const [EmploymentType, setEmploymentType] = useState<EmploymentType>('')
  const [ExperienceLevel, setExperienceLevel] = useState<ExperienceLevel>('')
  const [ApplicationDate, setApplicationDate] = useState(safeToday())
  const [JobSource, setJobSource] = useState<JobSource>('Other')
  const [Message, setMessage] = useState<string | null>(null)
  const [Saving, setSaving] = useState(false)
  const [Redirecting, setRedirecting] = useState(false)

  // Enables next button only if URL is valid
  const canGoNext = useMemo(() => {
    if (!JobUrl.trim()) return false
    try {
      new URL(JobUrl.trim())
      return true
    } catch {
      return false
    }
  }, [JobUrl])

  // Cancel always returns user to applications page
  const handleCancel = () => {
    setMessage(null)
    setSaving(false)
    setRedirecting(false)
    window.location.hash = '/applications'
  }

  // When step becomes 2, autofill without scraper for now
  useEffect(() => {
    if (step !== 2) return
    const url = JobUrl.trim()

    // Autofill placeholders based on URL
    setCompanyName((prev) => prev || guessCompanyFromUrl(url))

    // If user hasn’t typed a title yet, set a placeholder title
    setJobName((prev) => prev || 'Unknown Position')
  }, [step, JobUrl])

  const handleNext = () => {
    setUrlError(null)
    setMessage(null)

    const url = JobUrl.trim()
    if (!url) {
      setUrlError('Please paste a job link.')
      return
    }

    try {
      new URL(url)
    } catch {
      setUrlError('That does not look like a valid URL. Example: https://www.indeed.com/viewjob?...')
      return
    }

    setStep(2)
  }

  const handleBack = () => {
    setMessage(null)
    setStep(1)
  }
 
  // Builds tracked job object and should eventually save to firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Basic validation
    if (!JobName.trim() || !CompanyName.trim() || !Description.trim()) {
      setMessage('Please fill in Job Name, Company Name, and Description.')
      return
    }

    setSaving(true)

    try {
    const trackedJob = {
      id: `tracked-${Date.now()}`,
      jobLink: JobUrl.trim(),
      JobSource,
      ApplicationDate,
      JobName: JobName.trim(),
      CompanyName: CompanyName.trim(),
      CompanyContact: CompanyContact.trim(),
      DOMExceptionescription: Description.trim(),
      Qualifications: Qualifications.trim(),
      PreferredSkills: PreferredSkills.trim(),
      Country: Country.trim(),
      State: StateValue.trim(),
      City: City.trim(),
      PaymentAmount: PaymentAmount.trim(),
      VisaRequired,
      WorkArrangement,
      EmploymentType,
      ExperienceLevel,
      status: 'Applied',
      outcome: 'Pending',
      notes: '',
      createdAt: new Date().toISOString(),
    }

    // For now: just log
    console.log('Tracked job saved:', trackedJob)

    setMessage('Saved. Redirecting to My Applications...')
    setRedirecting(true)

    // save delay
    setTimeout(() => {
      window.location.hash = '/applications'
    }, 1500)
  } catch (err) {
    console.error('Save failed: ', err)
    setMessage('Save failed. Please try again.')
    setRedirecting(false)
  } finally {
    setSaving(false)
  }
}

  return (
    <main className='min-h-screen bg-gray-50'>
      {Redirecting && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-lg px-6 py-4 shadow-lg text-center'>
            <p className='font-medium mb-2'>Saving application...</p>
            <p className='text-sm text-gray-600'>Redirecting you to My Applications.</p>
          </div>
        </div>
      )}

      <div className='max-w-3xl mx-auto py-10 px-6'>
        <h1 className='text-2xl font-semibold mb-2'>Add External Job (For Tracking)</h1>
        <p className='text-sm text-gray-600 mb-6'>
          Step {step} of 2. Paste the job link first, then confirm or edit the details.
        </p>

        {Message && <div className='rounded border bg-white p-3 text-sm mb-4'>{Message}</div>}

        {/* STEP 1: URL */}
        {step === 1 && (
          <div className='bg-white rounded-lg border p-6 space-y-4'>
            <div>
              <label className='block text-sm mb-1'>Job Link *</label>
              <input
                type='url'
                value={JobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder='https://www.linkedin.com/jobs/view/...'
                className='w-full border rounded p-2'
              />
              {UrlError && <p className='text-sm text-red-600 mt-2'>{UrlError}</p>}
            </div>

            <div className='flex justify-end gap-2'>
              <button
                type='button'
                className='rounded border px-4 py-2'
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                className='rounded bg-black text-white px-4 py-2 disabled:opacity-50'
                onClick={handleNext}
                disabled={!canGoNext}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Autofill + confirm */}
        {step === 2 && (
          <form
            onSubmit={handleSave}
            className='space-y-5 bg-white rounded-lg border p-6'
          >
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-lg font-semibold'>Confirm Job Details</h2>
                <p className='text-sm text-gray-600'>We pre-filled what we could. Edit anything.</p>
              </div>

              <div className='flex gap-2'>
                <button
                  type='button'
                  className='rounded border px-4 py-2'
                  onClick={handleBack}
                >
                  Back
                </button>

                 <button
                  type='button'
                  className='rounded border px-4 py-2'
                  onClick={handleCancel}
                  disabled={Saving}
                >
                  Cancel
                </button>

                <button
                  type='submit'
                  disabled={Saving}
                  className='rounded bg-black text-white px-4 py-2 disabled:opacity-50'
                >
                  {Saving ? 'Saving...' : 'Save'}
                </button>

              </div>
            </div>

            <div className='rounded border p-3 text-sm bg-gray-50'>
              <p className='font-medium'>Job Link</p>
              <p className='break-all text-gray-700'>{JobUrl.trim()}</p>
            </div>

            <div>
              <label className='block text-sm mb-1'>Job Name *</label>
              <input
                type='text'
                value={JobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder='Software Engineer'
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Company Name *</label>
              <input
                type='text'
                value={CompanyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder='Company Name'
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Description *</label>
              <textarea
                value={Description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Main role summary and responsibilities'
                rows={4}
                className='w-full border rounded p-2'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm mb-1'>Job Source</label>
                <select
                  value={JobSource}
                  onChange={(e) => setJobSource(e.target.value as JobSource)}
                  className='w-full border rounded p-2'
                  >
                    <option value=''>Select job source</option>
                    <option value='LinkedIn'>LinkedIn</option>
                    <option value='Indeed'>Indeed</option>
                    <option value='Handshake'>Handshake</option>
                    <option value='Glassdoor'>Glassdoor</option>
                    <option value='Google Jobs'>Google Jobs</option>
                    <option value='Company Career Page'>Company Career Page</option>
                    <option value='Other'>Other</option>
                </select>
              </div>
              

              <div>
                <label className='block text-sm mb-1'>Application Date</label>
                <input
                  type='date'
                  value={ApplicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className='w-full border rounded p-2'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm mb-1'>Company Contact</label>
              <input
                type='email'
                value={CompanyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                placeholder='recruiter@company.com'
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Payment Type</label>
              <select
                value={PaymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className='w-full border rounded p-2'
              >
                  <option value=''>Select payment type</option>
                  <option value='hourly'>Hourly</option>
                  <option value='salary'>Salary</option>
              </select>
            </div>

            <div>
              <label className='block text-sm mb-1'>Payment Amount (USD)</label>
              <input
                type='number'
                value={PaymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder='e.g. 25.00'
                step='0.01'
                min='0'
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Work Arrangement</label>
              <select
                value={WorkArrangement}
                onChange={(e) => setWorkArrangement(e.target.value as WorkArrangement)}
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
                value={EmploymentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
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
                value={ExperienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
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
              <label className='block text-sm mb-1'>Qualifications</label>
              <textarea
                value={Qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder='Required skills, experience, or education'
                rows={3}
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Preferred Skills</label>
              <textarea
                value={PreferredSkills}
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
                  value={Country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder='United States'
                  className='w-full border rounded p-2'
                />
              </div>

              <div>
                <label className='block text-sm mb-1'>State</label>
                <input
                  type='text'
                  value={StateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  placeholder='Michigan'
                  className='w-full border rounded p-2'
                />
              </div>

              <div>
                <label className='block text-sm mb-1'>City</label>
                <input
                  type='text'
                  value={City}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder='Mount Pleasant'
                  className='w-full border rounded p-2'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm mb-1'>Visa Sponsorship Available?</label>
              <select
                value={VisaRequired}
                onChange={(e) => setVisaRequired(e.target.value as VisaRequired)}
                className='w-full border rounded p-2'
              >
                <option value=''>Select an option</option>
                <option value='yes'>Yes, they can sponsor visas</option>
                <option value='no'>No, visa sponsorship is not available</option>
              </select>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
