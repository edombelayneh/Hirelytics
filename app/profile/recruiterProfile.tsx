'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  CheckCircle2,
  Briefcase,
} from 'lucide-react'
import { toast } from '../components/ui/sonner'
import type { RecruiterProfile } from '../utils/userProfiles'

interface RecruiterProfilePageProps {
  recruiterProfile: RecruiterProfile
  onSave: (profile: RecruiterProfile) => Promise<void>
}

export const RecruiterProfilePage = memo(function RecruiterProfilePage({
  recruiterProfile,
  onSave,
}: RecruiterProfilePageProps) {
  const [formData, setFormData] = useState<RecruiterProfile>(recruiterProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // disables save while writing

  const logoInputRef = useRef<HTMLInputElement>(null)

  const { user, isLoaded } = useUser()

  // When parent loads recruiter profile from Firestore, update the form fields
  // + auto-fill recruiter name/email from Clerk if Firestore fields are missing
  useEffect(() => {
    if (!isLoaded) return

    const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? ''
    const clerkFirst = user?.firstName ?? ''
    const clerkLast = user?.lastName ?? ''
    const clerkFullName = `${clerkFirst} ${clerkLast}`.trim()

    setFormData((prev) => {
      const next: RecruiterProfile = { ...recruiterProfile }

      // Only fill missing values
      next.recruiterEmail = next.recruiterEmail || clerkEmail
      next.recruiterName = next.recruiterName || clerkFullName

      // If user is editing, don’t overwrite what they typed
      if (isEditing) {
        return {
          ...prev,
          recruiterEmail: prev.recruiterEmail || next.recruiterEmail,
          recruiterName: prev.recruiterName || next.recruiterName,
        }
      }

      return next
    })
  }, [recruiterProfile, isLoaded, user?.id, isEditing])

  // -------------
  // handle input changes
  // -------------
  const handleInputChange = (field: keyof RecruiterProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsEditing(true)
  }

  // -------------
  // handle company logo upload (image)
  // -------------
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Logo must be an image.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Logo must be less than 5MB.' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, companyLogo: reader.result as string }))
      setIsEditing(true)
      toast.success('Company logo uploaded')
    }
    reader.readAsDataURL(file)
  }

  // -------------
  // save recruiter profile
  // -------------
  const handleSave = async () => {
    // required fields
    if (!formData.companyName || !formData.recruiterEmail) {
      toast.error('Missing required fields', {
        description: 'Please fill in company name and recruiter email.',
      })
      return
    }

    // validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.recruiterEmail)) {
      toast.error('Invalid email format', {
        description: 'Please enter a valid recruiter email address.',
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData)
      setIsEditing(false)
      toast.success('Recruiter profile saved', { description: 'Your changes have been saved.' })
    } catch (err) {
      console.error('Save recruiter profile error:', err)
      toast.error('Save failed', { description: 'Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const getCompanyInitials = () => {
    const name = (formData.companyName || '').trim()
    if (!name) return 'C'
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.charAt(0)?.toUpperCase() || 'C'
    const second = parts.length > 1 ? parts[1].charAt(0).toUpperCase() : ''
    return `${first}${second}`.trim()
  }

  return (
    <div className='space-y-6 max-w-5xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col gap-2'>
        <h1>Recruiter Profile</h1>
        <p className='text-muted-foreground'>
          Manage your company details and recruiter contact info for job postings.
        </p>
      </div>

      {/* Company Logo + Website */}
      <Card className='p-6'>
        <div className='flex flex-col md:flex-row gap-8'>
          {/* Company Logo */}
          <div className='flex flex-col items-center gap-4'>
            <Label className='text-center'>Company Logo</Label>
            <div className='relative'>
              <Avatar className='h-32 w-32'>
                <AvatarImage
                  src={formData.companyLogo || ''}
                  alt='Company logo'
                />
                <AvatarFallback className='text-2xl'>{getCompanyInitials()}</AvatarFallback>
              </Avatar>

              <Button
                size='sm'
                variant='secondary'
                className='absolute bottom-0 right-0 rounded-full h-10 w-10 p-0'
                onClick={() => logoInputRef.current?.click()}
                type='button'
              >
                <Camera className='h-4 w-4' />
              </Button>

              <input
                ref={logoInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleLogoUpload}
              />
            </div>
            <p className='text-xs text-muted-foreground text-center'>PNG, JPG up to 5MB</p>
          </div>

          {/* Company Website */}
          <div className='flex-1 space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='companyName'>
                Company Name <span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <Building2 className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
                <Input
                  id='companyName'
                  placeholder='Hirelytics Inc.'
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className='pl-9'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='companyWebsite'>Company Website</Label>
              <div className='relative'>
                <Globe className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
                <Input
                  id='companyWebsite'
                  placeholder='https://hirelytics.com'
                  value={formData.companyWebsite || ''}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  className='pl-9'
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recruiter Contact */}
      <Card className='p-6'>
        <h2 className='mb-6'>Recruiter Contact</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='recruiterName'>Your Name</Label>
            <Input
              id='recruiterName'
              placeholder='Jane Recruiter'
              value={formData.recruiterName || ''}
              onChange={(e) => handleInputChange('recruiterName', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='recruiterTitle'>Your Title</Label>
            <div className='relative'>
              <Briefcase className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='recruiterTitle'
                placeholder='Talent Acquisition'
                value={formData.recruiterTitle || ''}
                onChange={(e) => handleInputChange('recruiterTitle', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='recruiterEmail'>
              Recruiter Email <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='recruiterEmail'
                type='email'
                placeholder='recruiting@hirelytics.com'
                value={formData.recruiterEmail || ''}
                onChange={(e) => handleInputChange('recruiterEmail', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='recruiterPhone'>Recruiter Phone</Label>
            <div className='relative'>
              <Phone className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='recruiterPhone'
                type='tel'
                placeholder='+1 (555) 987-6543'
                value={formData.recruiterPhone || ''}
                onChange={(e) => handleInputChange('recruiterPhone', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Company Details */}
      <Card className='p-6'>
        <h2 className='mb-6'>Company Details</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='companyLocation'>Company Location</Label>
            <div className='relative'>
              <MapPin className='absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground' />
              <Input
                id='companyLocation'
                placeholder='Detroit, MI'
                value={formData.companyLocation || ''}
                onChange={(e) => handleInputChange('companyLocation', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='companyDescription'>Company Description</Label>
            <Textarea
              id='companyDescription'
              placeholder='Short overview shown to candidates...'
              value={formData.companyDescription || ''}
              onChange={(e) => handleInputChange('companyDescription', e.target.value)}
              rows={6}
              className='resize-none'
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end gap-3 pb-8'>
        <Button
          size='lg'
          onClick={handleSave}
          disabled={!isEditing || isSaving}
          className='gap-2'
          type='button'
        >
          {isEditing ? (
            <>
              <Save className='h-4 w-4' />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </>
          ) : (
            <>
              <CheckCircle2 className='h-4 w-4' />
              Saved
            </>
          )}
        </Button>
      </div>
    </div>
  )
})
