'use client'

/**
 * Add External Job Page
 *
 * This page allows users to:
 * 1. Paste a job link
 * 2. Confirm/edit job details
 * 3. Save the job as an application for tracking
 *
 * NOTE: This version uses Next.js routing (router.push) instead of window.location.hash.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { buildApplication, saveUserApplication } from '../../utils/applicationFirebase'
import { type JobSource, type JobSourceInput, normalizeJobSource } from '../../types/jobSource'

// Controlled select fields types
type VisaRequired = 'yes' | 'no' | ''
type WorkArrangement = 'onsite' | 'remote' | 'hybrid' | ''
type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | ''
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | ''
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
    const parts = host.split('.')
    const genericHostLabels = new Set(['careers', 'jobs', 'job', 'apply'])
    const base =
      genericHostLabels.has((parts[0] || '').toLowerCase()) && parts[1]
        ? parts[1]
        : parts[0] || 'Unknown'
    const normalized = base.toLowerCase()
    const platformHosts = new Set([
      'linkedin',
      'indeed',
      'glassdoor',
      'google',
      'greenhouse',
      'lever',
      'workday',
      'ziprecruiter',
      'monster',
      'dice',
      'builtin',
      'wellfound',
    ])

    if (platformHosts.has(normalized)) return ''
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return ''
  }
}

function inferJobSource(url: string): JobSource {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('linkedin')) return 'LinkedIn'
    if (host.includes('indeed')) return 'Indeed'
    if (host.includes('handshake')) return 'Handshake'
    if (host.includes('glassdoor')) return 'Glassdoor'
    if (host.includes('google')) return 'Google Jobs'
    if (host.includes('greenhouse')) return 'Greenhouse'
    if (host.includes('lever')) return 'Lever'
    if (host.includes('workday')) return 'Workday'
    if (host.includes('ziprecruiter')) return 'ZipRecruiter'
    if (host.includes('monster')) return 'Monster'
    if (host.includes('dice')) return 'Dice'
    if (host.includes('builtin')) return 'Built In'
    if (host.includes('wellfound') || host.includes('angel.co')) return 'Wellfound'
    return 'Company Website'
  } catch {
    return 'Other'
  }
}

function normalizeEmploymentType(value: string): EmploymentType {
  const lower = value.toLowerCase()
  if (lower.includes('full')) return 'full-time'
  if (lower.includes('part')) return 'part-time'
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('intern')) return 'internship'
  return ''
}

function normalizeWorkArrangement(value: string): WorkArrangement {
  const lower = value.toLowerCase()
  if (lower.includes('hybrid')) return 'hybrid'
  if (lower.includes('remote')) return 'remote'
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in person')) {
    return 'onsite'
  }
  return ''
}

function normalizePaymentType(value: string): PaymentType {
  const lower = value.toLowerCase()
  if (lower.includes('hour')) return 'hourly'
  if (lower.includes('salary') || lower.includes('year') || lower.includes('annual'))
    return 'salary'
  return ''
}

function sanitizeParsedText(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferFromJobUrl(url: string): { jobName: string; city: string } {
  try {
    const parsed = new URL(url)
    const slug = parsed.pathname.split('/').filter(Boolean).pop() || ''
    const segments = slug.split('--').filter(Boolean)
    const genericTitleSlugs = new Set(['jobdetail', 'job', 'jobs', 'posting', 'viewjob'])
    const rawTitlePart = segments[0] || ''
    const titlePart = genericTitleSlugs.has(rawTitlePart.toLowerCase()) ? '' : rawTitlePart
    const cityPart = segments[1] || ''

    const toTitleCase = (value: string) =>
      value
        .split('-')
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ')

    return {
      jobName: titlePart ? toTitleCase(titlePart) : '',
      city: cityPart ? toTitleCase(cityPart) : '',
    }
  } catch {
    return { jobName: '', city: '' }
  }
}
export default function AddExternalJobPage() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()

  // Step control
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1: URL
  const [jobUrl, setJobUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  // Step 2: autofill + editable fields
  const [jobName, setJobName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyContact, setCompanyContact] = useState('')
  const [description, setDescription] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [preferredSkills, setPreferredSkills] = useState('')
  const [country, setCountry] = useState('')
  const [stateValue, setStateValue] = useState('')
  const [city, setCity] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('')
  const [visaRequired, setVisaRequired] = useState<VisaRequired>('')
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement>('')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('')
  const [applicationDate, setApplicationDate] = useState(safeToday())
  const [jobSource, setJobSource] = useState<JobSourceInput>('Other')

  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [parsing, setParsing] = useState(false)

  // Enables next button only if URL is valid
  const canGoNext = useMemo(() => {
    if (!jobUrl.trim()) return false
    try {
      new URL(jobUrl.trim())
      return true
    } catch {
      return false
    }
  }, [jobUrl])

  // Cancel always returns user to applications page
  const handleCancel = () => {
    setMessage(null)
    setSaving(false)
    setRedirecting(false)
    router.push('/applicant/applications')
  }

  // When step becomes 2, attempt to autofill by parsing the job URL
  useEffect(() => {
    if (step !== 2) return

    const url = jobUrl.trim()
    setParsing(true)
    setMessage(null)

    // First, set defaults while we fetch
    setCompanyName((prev) => prev || guessCompanyFromUrl(url))
    setJobName((prev) => prev || 'Unknown Position')

    // Then try to parse the URL
    const parseJobUrl = async () => {
      try {
        const response = await fetch('/api/jobs/parse-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.warn('Parse error:', error)
          setParsing(false)
          return
        }

        const parsed = await response.json()
        const inferred = inferFromJobUrl(url)
        const blockedBySource = Boolean(parsed?.blocked)

        const parsedJobName = sanitizeParsedText(parsed.jobName)
        const parsedCompanyName = sanitizeParsedText(parsed.companyName)
        const parsedDescription = sanitizeParsedText(parsed.description)
        const parsedQualifications = sanitizeParsedText(parsed.qualifications)
        const parsedPreferredSkills = sanitizeParsedText(parsed.preferredSkills)
        const parsedCity = sanitizeParsedText(parsed.city)
        const parsedCountry = sanitizeParsedText(parsed.country)
        const parsedEmploymentType = sanitizeParsedText(parsed.employmentType) as EmploymentType
        const parsedWorkArrangement = sanitizeParsedText(parsed.workArrangement) as WorkArrangement
        const fallbackCompanyName = guessCompanyFromUrl(url)
        const fallbackBlockedDescription =
          'Auto-extraction was blocked by the source site. Paste or summarize the job description here before saving.'

        const hasCoreAutofillData =
          (parsedJobName && parsedJobName.toLowerCase() !== 'unknown position') ||
          parsedDescription.length > 40 ||
          parsedQualifications.length > 40

        if (
          !blockedBySource &&
          parsedJobName &&
          parsedJobName.toLowerCase() !== 'unknown position'
        ) {
          setJobName(parsedJobName)
        } else if (inferred.jobName) {
          setJobName(inferred.jobName)
        }
        if (
          !blockedBySource &&
          parsedCompanyName &&
          parsedCompanyName.toLowerCase() !== 'unknown company'
        ) {
          setCompanyName(parsedCompanyName)
        }
        if (!blockedBySource && parsedDescription) {
          setDescription(parsedDescription)
        }
        if (!blockedBySource && parsedQualifications) {
          setQualifications(parsedQualifications)
        }
        if (!blockedBySource && parsedPreferredSkills) {
          setPreferredSkills(parsedPreferredSkills)
        }
        if (!blockedBySource && parsedCity) {
          setCity(parsedCity)
        } else if (inferred.city) {
          setCity(inferred.city)
        }
        if (!blockedBySource && parsedCountry) {
          setCountry(parsedCountry)
        }
        if (
          !blockedBySource &&
          (parsedEmploymentType === 'full-time' ||
            parsedEmploymentType === 'part-time' ||
            parsedEmploymentType === 'contract' ||
            parsedEmploymentType === 'internship')
        ) {
          setEmploymentType(parsedEmploymentType)
        }
        if (
          !blockedBySource &&
          (parsedWorkArrangement === 'onsite' ||
            parsedWorkArrangement === 'remote' ||
            parsedWorkArrangement === 'hybrid')
        ) {
          setWorkArrangement(parsedWorkArrangement)
        }

        if (blockedBySource) {
          const unusableBlockedTitle = new Set(['unknown position', 'jobdetail', 'job', 'jobs'])
          if (!parsedJobName || unusableBlockedTitle.has(parsedJobName.toLowerCase())) {
            setJobName((prev) => prev || inferred.jobName || 'External Job Posting')
          }

          if (!parsedCompanyName || parsedCompanyName.toLowerCase() === 'unknown company') {
            setCompanyName((prev) => prev || fallbackCompanyName)
          }

          if (!parsedDescription) {
            setDescription((prev) => prev || fallbackBlockedDescription)
          }

          setMessage(
            parsed?.blockedReason ||
              'This site blocked auto-parsing. Please paste the details manually.'
          )
        } else if (hasCoreAutofillData) {
          setMessage(
            'Job information extracted successfully! Please review all fields, information may be inaccurate.'
          )
        } else {
          setMessage('Could not auto-fill this posting. Please fill in details manually.')
        }

        setParsing(false)
      } catch (err) {
        console.error('Failed to parse job URL:', err)
        setParsing(false)
        // Silently fail - user can manually fill in the fields
      }
    }

    parseJobUrl()
  }, [step, jobUrl])

  const handleNext = async () => {
    setUrlError(null)
    setMessage(null)

    const url = jobUrl.trim()
    if (!url) {
      setUrlError('Please paste a job link.')
      return
    }

    try {
      new URL(url)
    } catch {
      setUrlError(
        'That does not look like a valid URL. Example: https://www.indeed.com/viewjob?...'
      )
      return
    }

    setParsing(true)
    setJobSource((prev) => (prev && prev !== 'Other' ? prev : inferJobSource(url)))
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
    if (!jobName.trim() || !companyName.trim() || !description.trim()) {
      setMessage('Please fill in Job Name, Company Name, and Description.')
      return
    }

    setRedirecting(false)
    setSaving(true)

    try {
      if (!isLoaded || !userId) {
        setMessage('Please sign in before saving an external job.')
        return
      }

      const applicationId = crypto.randomUUID()

      const mergedJob = {
        jobId: applicationId,
        jobLink: jobUrl.trim(),
        applyLink: jobUrl.trim(),
        jobSource: jobSource || inferJobSource(jobUrl.trim()),
        applicationDate,
        title: jobName.trim(),
        company: companyName.trim(),
        companyName: companyName.trim(),
        contactPerson: companyContact.trim(),
        description: description.trim(),
        generalDescription: description.trim(),
        qualifications: qualifications.trim(),
        requirements: qualifications
          .split(/\n|,|;/)
          .map((item) => item.trim())
          .filter(Boolean),
        preferredSkills: preferredSkills.trim(),
        country: country.trim(),
        state: stateValue.trim(),
        city: city.trim(),
        paymentAmount: paymentAmount.trim(),
        paymentType,
        visaRequired,
        workArrangement,
        employmentType,
        experienceLevel,
        status: 'Applied',
        notes: '',
        createdAt: new Date().toISOString(),
      }

      const application = buildApplication({
        userId,
        jobId: applicationId,
        mergedJob,
        fallback: {
          title: jobName.trim(),
          company: companyName.trim(),
          location: city.trim(),
          description: description.trim(),
          requirements: [],
          postedDate: applicationDate,
        },
      })

      await saveUserApplication(application)

      setMessage('Saved! Redirecting to My Applications...')
      setRedirecting(true)

      // Small delay so user sees the message, then navigate
      setTimeout(() => {
        router.push('/applicant/applications')
      }, 800)
    } catch (err) {
      console.error('Save failed:', err)
      setMessage('Save failed. Please try again.')
      setRedirecting(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      {redirecting && (
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

        {message && <div className='rounded border bg-white p-3 text-sm mb-4'>{message}</div>}

        {/* STEP 1: URL */}
        {step === 1 && (
          <div className='bg-white rounded-lg border p-6 space-y-4'>
            <div>
              <label className='block text-sm mb-1'>Job Link *</label>
              <input
                type='url'
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder='https://www.linkedin.com/jobs/view/...'
                className='w-full border rounded p-2'
              />
              {urlError && <p className='text-sm text-red-600 mt-2'>{urlError}</p>}
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
                type='button'
                className='rounded bg-black text-white px-4 py-2 disabled:opacity-50'
                onClick={handleNext}
                disabled={!canGoNext || parsing}
              >
                {parsing ? 'Parsing...' : 'Next'}
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
                  disabled={saving}
                >
                  Back
                </button>

                <button
                  type='button'
                  className='rounded border px-4 py-2'
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type='submit'
                  disabled={saving}
                  className='rounded bg-black text-white px-4 py-2 disabled:opacity-50'
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className='rounded border p-3 text-sm bg-gray-50'>
              <p className='font-medium'>Job Link</p>
              <p className='break-all text-gray-700'>{jobUrl.trim()}</p>
            </div>

            <div>
              <label className='block text-sm mb-1'>Job Name *</label>
              <input
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
                <label className='block text-sm mb-1'>Job Source</label>
                <select
                  value={jobSource}
                  onChange={(e) => {
                    const value = e.target.value
                    setJobSource(value === '' ? '' : normalizeJobSource(value))
                  }}
                  className='w-full border rounded p-2'
                >
                  <option value=''>Select job source</option>
                  <option value='LinkedIn'>LinkedIn</option>
                  <option value='Indeed'>Indeed</option>
                  <option value='Handshake'>Handshake</option>
                  <option value='Glassdoor'>Glassdoor</option>
                  <option value='Google Jobs'>Google Jobs</option>
                  <option value='Company Website'>Company Website</option>
                  <option value='Greenhouse'>Greenhouse</option>
                  <option value='Lever'>Lever</option>
                  <option value='Workday'>Workday</option>
                  <option value='ZipRecruiter'>ZipRecruiter</option>
                  <option value='Monster'>Monster</option>
                  <option value='Dice'>Dice</option>
                  <option value='Built In'>Built In</option>
                  <option value='Wellfound'>Wellfound</option>
                  <option value='Referral'>Referral</option>
                  <option value='Other'>Other</option>
                </select>
              </div>

              <div>
                <label className='block text-sm mb-1'>Application Date</label>
                <input
                  type='date'
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className='w-full border rounded p-2'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm mb-1'>Company Contact</label>
              <input
                type='email'
                value={companyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                placeholder='recruiter@company.com'
                className='w-full border rounded p-2'
              />
            </div>

            <div>
              <label className='block text-sm mb-1'>Payment Type</label>
              <select
                value={paymentType}
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
                value={paymentAmount}
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
                value={workArrangement}
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
                value={employmentType}
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
                value={experienceLevel}
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
                value={visaRequired}
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
