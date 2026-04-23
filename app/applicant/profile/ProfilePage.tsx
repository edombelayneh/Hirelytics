'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Github,
  Upload,
  FileText,
  Camera,
  Save,
  Briefcase,
  Calendar,
} from 'lucide-react'
import type { UserProfile } from '../../data/profileData'
import { toast } from '../../components/ui/sonner'
import type { JobHistoryItem } from '../../utils/jobHistory'

type RequiredFields = 'firstName' | 'lastName' | 'email'
type JobHistoryDraft = Omit<JobHistoryItem, 'id' | 'createdAt' | 'updatedAt'>
type JobHistoryPayload = {
  company: string
  location?: string
  title: string
  roleDescription: string
  startDate: string
  endDate?: string
  isCurrent: boolean
}

interface ProfilePageProps {
  profile: UserProfile
  onUpdateProfile: (profile: UserProfile) => Promise<void>
  jobHistory: JobHistoryItem[]
  jobHistoryLoading: boolean
  onAddJobHistory: (item: {
    company: string
    location?: string
    title: string
    roleDescription: string
    startDate: string
    endDate?: string
    isCurrent: boolean
  }) => Promise<void>
  onEditJobHistory: (
    jobHistoryId: string,
    item: {
      company: string
      location?: string
      title: string
      roleDescription: string
      startDate: string
      endDate?: string
      isCurrent: boolean
    }
  ) => Promise<void>
  onDeleteJobHistory: (jobHistoryId: string) => Promise<void>
}

export const ProfilePage = memo(function ProfilePage({
  profile,
  onUpdateProfile,
  jobHistory = [],
  jobHistoryLoading = false,
  onAddJobHistory,
  onEditJobHistory,
  onDeleteJobHistory,
}: ProfilePageProps) {
  const { user, isLoaded } = useUser()

  const [formData, setFormData] = useState<UserProfile>(profile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [jobCompany, setJobCompany] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobRoleDescription, setJobRoleDescription] = useState('')
  const [jobStartDate, setJobStartDate] = useState('')
  const [jobEndDate, setJobEndDate] = useState('')
  const [jobHistorySaving, setJobHistorySaving] = useState(false)
  const [editingJobHistoryId, setEditingJobHistoryId] = useState<string | null>(null)
  // Controls the resume import UX while the server parses and inserts job history.
  const [resumeParseLoading, setResumeParseLoading] = useState(false)

  const profilePicInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const jobHistorySectionRef = useRef<HTMLDivElement>(null)

  const [errors, setErrors] = useState<Partial<Record<RequiredFields, string>>>({})

  const [jobIsCurrent, setJobIsCurrent] = useState(false)

  const normalizeForJobKey = (value?: string) =>
    value?.toLowerCase().replace(/\s+/g, ' ').trim() || ''

  const buildJobHistoryKey = (item: JobHistoryPayload) => {
    return [
      normalizeForJobKey(item.company),
      normalizeForJobKey(item.location),
      normalizeForJobKey(item.title),
      normalizeForJobKey(item.startDate),
      item.isCurrent ? 'current' : normalizeForJobKey(item.endDate),
    ].join('|')
  }

  const hasDuplicateJob = (item: JobHistoryPayload, excludeId?: string) => {
    const targetKey = buildJobHistoryKey(item)
    return jobHistory.some((existing) => {
      if (excludeId && existing.id === excludeId) return false
      return (
        buildJobHistoryKey({
          company: existing.company,
          location: existing.location,
          title: existing.title,
          roleDescription: existing.roleDescription,
          startDate: existing.startDate,
          endDate: existing.endDate,
          isCurrent: existing.isCurrent,
        }) === targetKey
      )
    })
  }

  // Sync Firestore -> form + Clerk autofill for missing fields
  useEffect(() => {
    if (!isLoaded) return

    const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? ''
    const clerkFirst = user?.firstName ?? ''
    const clerkLast = user?.lastName ?? ''

    setFormData((prev) => {
      const next: UserProfile = { ...profile }

      // Only fill missing values
      next.email = next.email || clerkEmail
      next.firstName = next.firstName || clerkFirst
      next.lastName = next.lastName || clerkLast

      // Don’t overwrite while user is editing
      if (isEditing) {
        return {
          ...prev,
          email: prev.email || next.email,
          firstName: prev.firstName || next.firstName,
          lastName: prev.lastName || next.lastName,
        }
      }

      return next
    })
  }, [profile, isLoaded, user?.id, isEditing])

  // Validate required fields and ensure data logic is correct
  const validate = () => {
    const next: Partial<Record<RequiredFields, string>> = {}

    if (!formData.firstName?.trim()) next.firstName = 'First name is required.'
    if (!formData.lastName?.trim()) next.lastName = 'Last name is required.'
    if (!formData.email?.trim()) next.email = 'Email is required.'
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) next.email = 'Enter a valid email address.'
    }

    return next
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsEditing(true)

    if (field === 'firstName' || field === 'lastName' || field === 'email') {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Profile picture must be an image.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Profile picture must be less than 5MB' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profilePicture: reader.result as string }))
      setIsEditing(true)
      toast.success('Profile picture uploaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedExtensions = ['.pdf']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!allowedExtensions.includes(ext)) {
      toast.error('Invalid file type', { description: 'Resume must be a PDF.' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', { description: 'Resume must be less than 10MB' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        resumeFile: reader.result as string,
        resumeFileName: file.name,
      }))
      setIsEditing(true)
      toast.success('Resume uploaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const scrollToJobHistoryForm = () => {
    const yOffset = -120
    const element = jobHistorySectionRef.current

    if (!element) return

    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({
      top: y,
      behavior: 'smooth',
    })
  }

  // Parse the uploaded resume via the API and append all detected jobs to Firestore.
  const handleImportJobHistoryFromResume = async () => {
    if (!formData.resumeFile) {
      toast.error('Resume not found', {
        description: 'Upload a PDF resume to auto-fill your job history.',
      })
      return
    }

    setResumeParseLoading(true)

    try {
      const resumeBlob = await fetch(formData.resumeFile).then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to read resume file')
        }
        return response.blob()
      })

      const resumeFileName = formData.resumeFileName || 'resume.pdf'
      const resumeFile = new File([resumeBlob], resumeFileName, {
        type: resumeBlob.type || 'application/pdf',
      })

      const requestBody = new FormData()
      requestBody.append('resume', resumeFile)
      requestBody.append('resumeFileName', resumeFileName)

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: requestBody,
      })

      const payload = (await response.json()) as {
        jobHistory?: JobHistoryDraft[]
        error?: string
      }

      if (!response.ok) {
        toast.error('Resume parsing failed', {
          description: payload.error || 'Please try again.',
        })
        return
      }

      const parsedJobs = Array.isArray(payload.jobHistory) ? payload.jobHistory : []

      if (parsedJobs.length === 0) {
        toast.error('No job history found', {
          description: 'We could not find experience entries in your resume.',
        })
        return
      }

      // Skip duplicates already present in saved job history.
      const seenKeys = new Set(
        jobHistory.map((existing) =>
          buildJobHistoryKey({
            company: existing.company,
            location: existing.location,
            title: existing.title,
            roleDescription: existing.roleDescription,
            startDate: existing.startDate,
            endDate: existing.endDate,
            isCurrent: existing.isCurrent,
          })
        )
      )

      let addedCount = 0
      let skippedCount = 0

      for (const job of parsedJobs) {
        const normalizedJob: JobHistoryPayload = {
          company: job.company.trim(),
          ...(job.location ? { location: job.location.trim() } : {}),
          title: job.title.trim(),
          roleDescription: job.roleDescription.trim(),
          startDate: job.startDate,
          ...(job.isCurrent ? {} : { endDate: job.endDate || '' }),
          isCurrent: job.isCurrent,
        }

        const jobKey = buildJobHistoryKey(normalizedJob)
        if (seenKeys.has(jobKey)) {
          skippedCount += 1
          continue
        }

        await onAddJobHistory(normalizedJob)
        seenKeys.add(jobKey)
        addedCount += 1
      }

      if (addedCount === 0) {
        toast.error('No new jobs added', {
          description: 'All parsed jobs already exist in your job history.',
        })
        return
      }

      const skippedText =
        skippedCount > 0
          ? ` Skipped ${skippedCount} duplicate job${skippedCount === 1 ? '' : 's'}.`
          : ''
      toast.success('Resume imported', {
        description: `Added ${addedCount} job${addedCount === 1 ? '' : 's'} from your resume.${skippedText}`,
      })
      scrollToJobHistoryForm()
    } catch (error) {
      console.error('Resume parsing error:', error)
      toast.error('Resume parsing failed', { description: 'Please try again.' })
    } finally {
      setResumeParseLoading(false)
    }
  }

  const handleSave = async () => {
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Missing required fields', {
        description: 'Fix the highlighted fields and try again.',
      })
      return
    }

    setIsSaving(true)
    try {
      await onUpdateProfile(formData)
      setIsEditing(false)
      toast.success('Profile updated successfully', {
        description: 'Your changes have been saved.',
      })
    } catch (err) {
      console.error('Save profile error:', err)
      toast.error('Save failed', { description: 'Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  // Scroll to job history section after adding/editing an entry
  const handleAddJobHistorySubmit = async () => {
    if (
      !jobCompany.trim() ||
      !jobTitle.trim() ||
      !jobRoleDescription.trim() ||
      !jobStartDate ||
      (!jobIsCurrent && !jobEndDate)
    ) {
      toast.error('Missing job history fields', {
        description: 'Please fill in company, title, role description, start date, and end date.',
      })
      return
    }

    // Ensure location is trimmed but allow empty (optional field)
    const trimmedLocation = jobLocation.trim()

    // Ensure start date is not after end date when job is not current
    if (!jobIsCurrent && jobStartDate && jobEndDate && jobStartDate > jobEndDate) {
      toast.error('Invalid job history dates', {
        description: 'Start date cannot be after end date.',
      })
      return
    }

    setJobHistorySaving(true)

    try {
      const payload: JobHistoryPayload = {
        company: jobCompany.trim(),
        ...(trimmedLocation ? { location: trimmedLocation } : {}),
        title: jobTitle.trim(),
        roleDescription: jobRoleDescription.trim(),
        startDate: jobStartDate,
        ...(jobIsCurrent ? {} : { endDate: jobEndDate }),
        isCurrent: jobIsCurrent,
      }

      if (hasDuplicateJob(payload, editingJobHistoryId || undefined)) {
        toast.error('Duplicate job history entry', {
          description: 'This job already exists in your history.',
        })
        return
      }

      // If editing, pass the existing jobHistoryId to update; otherwise, add a new entry
      if (editingJobHistoryId) {
        await onEditJobHistory(editingJobHistoryId, payload)
        toast.success('Job history updated successfully')
      } else {
        await onAddJobHistory(payload)
        toast.success('Job history added successfully')
      }

      setJobCompany('')
      setJobLocation('')
      setJobTitle('')
      setJobRoleDescription('')
      setJobStartDate('')
      setJobEndDate('')
      setJobIsCurrent(false)
      setEditingJobHistoryId(null)
    } catch (err) {
      const isEditingJobHistory = Boolean(editingJobHistoryId)

      console.error(
        isEditingJobHistory ? 'Update job history error:' : 'Add job history error:',
        err
      )

      toast.error(
        isEditingJobHistory ? 'Failed to update job history' : 'Failed to add job history',
        {
          description: 'Please try again.',
        }
      )
    } finally {
      setJobHistorySaving(false)
    }
  }

  const getInitials = () => {
    const first = (formData.firstName || '').trim().charAt(0).toUpperCase()
    const last = (formData.lastName || '').trim().charAt(0).toUpperCase()
    return `${first}${last}`.trim() || 'U'
  }

  const formatMonthYear = (dateString?: string) => {
    if (!dateString) return ''

    const date = new Date(dateString)

    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold mb-1'>My Profile</h2>
        <p className='text-muted-foreground'>
          Manage your personal information and job application preferences
        </p>
      </div>

      {/* Profile Picture & Resume Section */}
      <Card className='p-6'>
        <div className='flex flex-col md:flex-row gap-8'>
          {/* Profile Picture */}
          <div className='flex flex-col items-center gap-4'>
            <Label className='text-center'>Profile Picture</Label>
            <div className='relative'>
              <Avatar className='h-32 w-32'>
                <AvatarImage
                  src={formData.profilePicture || undefined}
                  alt='Profile'
                />
                <AvatarFallback className='text-2xl'>{getInitials()}</AvatarFallback>
              </Avatar>
              <Button
                size='sm'
                variant='secondary'
                className='absolute bottom-0 right-0 rounded-full h-10 w-10 p-0'
                onClick={() => profilePicInputRef.current?.click()}
              >
                <Camera className='h-4 w-4' />
              </Button>
              <input
                ref={profilePicInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleProfilePictureUpload}
              />
            </div>
            <p className='text-xs text-muted-foreground text-center'>PNG, JPG up to 5MB</p>
          </div>

          {/* Resume Upload */}
          <div className='flex-1 space-y-4'>
            <div>
              <Label>Resume</Label>
              <p className='text-sm text-muted-foreground mb-3'>
                Upload your latest resume to streamline job applications
              </p>
            </div>

            {formData.resumeFileName ? (
              <div className='flex items-center gap-3 p-4 border rounded-lg bg-muted/50'>
                <FileText className='h-8 w-8 text-primary' />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>{formData.resumeFileName}</p>
                  <p className='text-sm text-muted-foreground'>Resume uploaded</p>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => resumeInputRef.current?.click()}
                >
                  <Upload className='h-4 w-4 mr-2' />
                  Replace
                </Button>
              </div>
            ) : (
              <Button
                variant='outline'
                className='w-full h-24 border-dashed'
                onClick={() => resumeInputRef.current?.click()}
              >
                <div className='flex flex-col items-center gap-2'>
                  <Upload className='h-6 w-6 text-muted-foreground' />
                  <span>Click to upload resume</span>
                  <span className='text-xs text-muted-foreground'>PDF up to 10MB</span>
                </div>
              </Button>
            )}
            <input
              ref={resumeInputRef}
              type='file'
              accept='.pdf'
              className='hidden'
              onChange={handleResumeUpload}
            />
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card className='p-6'>
        <h2 className='mb-6'>Basic Information</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='firstName'>
              First Name <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <User className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='firstName'
                placeholder='John'
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`pl-9 ${errors.firstName ? 'border border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.firstName && <p className='text-sm text-red-600 mt-1'>{errors.firstName}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='lastName'>
              Last Name <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <User className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='lastName'
                placeholder='John'
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`pl-9 ${errors.lastName ? 'border border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.lastName && <p className='text-sm text-red-600 mt-1'>{errors.lastName}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>
              Email Address <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                type='email'
                placeholder='john.doe@example.com'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-9 ${errors.email ? 'border border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.email && <p className='text-sm text-red-600 mt-1'>{errors.email}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone Number</Label>
            <div className='relative'>
              <Phone className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='phone'
                type='tel'
                placeholder='+1 (555) 123-4567'
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='location'>Location</Label>
            <div className='relative'>
              <MapPin className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='location'
                placeholder='San Francisco, CA'
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Professional Information */}
      <Card className='p-6'>
        <h2 className='mb-6'>Professional Information</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='currentTitle'>Current Job Title</Label>
            <div className='relative'>
              <Briefcase className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='currentTitle'
                placeholder='Software Engineer'
                value={formData.currentTitle}
                onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='yearsOfExperience'>Years of Experience</Label>
            <div className='relative'>
              <Calendar className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='yearsOfExperience'
                placeholder='5'
                value={formData.yearsOfExperience}
                onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='availability'>Availability</Label>
            <Select
              value={formData.availability}
              onValueChange={(value: string) => handleInputChange('availability', value)}
            >
              <SelectTrigger id='availability'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Immediately'>Immediately</SelectItem>
                <SelectItem value='2 weeks'>2 weeks</SelectItem>
                <SelectItem value='1 month'>1 month</SelectItem>
                <SelectItem value='2-3 months'>2-3 months</SelectItem>
                <SelectItem value='Not available'>Not available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Professional Links */}
      <Card className='p-6'>
        <h2 className='mb-6'>Professional Links</h2>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='linkedinUrl'>LinkedIn Profile</Label>
            <div className='relative'>
              <Linkedin className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='linkedinUrl'
                type='url'
                placeholder='https://linkedin.com/in/johndoe'
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='portfolioUrl'>Portfolio Website</Label>
            <div className='relative'>
              <Globe className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='portfolioUrl'
                type='url'
                placeholder='https://johndoe.com'
                value={formData.portfolioUrl}
                onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='githubUrl'>GitHub Profile</Label>
            <div className='relative'>
              <Github className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='githubUrl'
                type='url'
                placeholder='https://github.com/johndoe'
                value={formData.githubUrl}
                onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bio */}
      <Card className='p-6'>
        <h2 className='mb-6'>Professional Bio</h2>
        <div className='space-y-2'>
          <Label htmlFor='bio'>About Me</Label>
          <Textarea
            id='bio'
            placeholder="Write a brief description about yourself, your skills, and what you're looking for..."
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={6}
            className='resize-none'
          />
          <p className='text-sm text-muted-foreground'>{formData.bio.length} / 1000 characters</p>
        </div>
      </Card>

      {/* Job History */}
      <div ref={jobHistorySectionRef}>
        <Card className='p-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-1'>
              <h2 className='text-lg font-semibold'>Job History</h2>
              <p className='text-sm text-muted-foreground'>
                Add one past job at a time, or import them from your resume. After saving, the form
                will reset so you can add another.
              </p>
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={handleImportJobHistoryFromResume}
              disabled={resumeParseLoading}
              className='gap-2'
            >
              <FileText className='h-4 w-4' />
              {resumeParseLoading ? 'Importing jobs...' : 'Add jobs from resume'}
            </Button>
          </div>

          <div className='space-y-6'>
            <div className='grid md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='jobCompany'>Company</Label>
                <Input
                  id='jobCompany'
                  placeholder='Hirelytics'
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='jobTitle'>Title</Label>
                <Input
                  id='jobTitle'
                  placeholder='Software Engineer Intern'
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='jobLocation'>Location</Label>
                <Input
                  id='jobLocation'
                  placeholder='Mount Pleasant, Michigan'
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='jobRoleDescription'>Role Description</Label>
                <Textarea
                  id='jobRoleDescription'
                  placeholder='Describe what you did in this role...'
                  value={jobRoleDescription}
                  onChange={(e) => setJobRoleDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='jobStartDate'>Start Date</Label>
                <Input
                  id='jobStartDate'
                  type='date'
                  value={jobStartDate}
                  onChange={(e) => setJobStartDate(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='jobEndDate'>End Date</Label>
                <Input
                  id='jobEndDate'
                  type='date'
                  value={jobEndDate}
                  disabled={jobIsCurrent}
                  onChange={(e) => setJobEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={jobIsCurrent}
                  onChange={(e) => {
                    setJobIsCurrent(e.target.checked)

                    if (e.target.checked) {
                      setJobEndDate('')
                    }
                  }}
                />
                I currently work here
              </Label>
            </div>

            <Button
              type='button'
              onClick={handleAddJobHistorySubmit}
              disabled={jobHistorySaving}
            >
              {jobHistorySaving
                ? 'Saving...'
                : editingJobHistoryId
                  ? 'Update Job History'
                  : 'Save and Add Another'}
            </Button>

            <div className='space-y-4'>
              {jobHistoryLoading && jobHistory.length === 0 ? (
                <p className='text-sm text-muted-foreground'>Loading job history...</p>
              ) : jobHistory.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No job history added yet.</p>
              ) : (
                jobHistory.map((item) => (
                  <div
                    key={item.id}
                    className='rounded-lg border p-4 flex flex-col gap-3'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <h3 className='font-semibold'>{item.title}</h3>
                        <p className='text-sm text-muted-foreground'>
                          {item.company}
                          {item.location && ` | ${item.location}`}
                        </p>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setEditingJobHistoryId(item.id)
                            setJobCompany(item.company)
                            setJobLocation(item.location || '')
                            setJobTitle(item.title)
                            setJobRoleDescription(item.roleDescription)
                            setJobStartDate(item.startDate)
                            setJobEndDate(item.endDate || '')
                            setJobIsCurrent(item.isCurrent)
                            scrollToJobHistoryForm()
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={async () => {
                            try {
                              await onDeleteJobHistory(item.id)
                              toast.success('Job history deleted successfully')
                            } catch (error) {
                              toast.error('Failed to delete job history. Please try again.')
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <p className='text-sm whitespace-pre-wrap'>{item.roleDescription}</p>

                    <p className='text-sm text-muted-foreground'>
                      {formatMonthYear(item.startDate)} -{' '}
                      {item.isCurrent ? 'Current' : formatMonthYear(item.endDate)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <Button
        size='lg'
        onClick={handleSave}
        disabled={isSaving}
        className='gap-2'
      >
        <Save className='h-4 w-4' />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
})
