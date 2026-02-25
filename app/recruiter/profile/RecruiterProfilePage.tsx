'use client'

// FIXME: Make this a proper page later, add integration with Firestore and also right questions for UI
// TEMP FILE : Recruiter profile page for setting company info

import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { toast } from '../../components/ui/sonner'
import type { RecruiterProfile } from '../../utils/userProfiles'
import { Navbar } from '../../components/Navbar'

export function RecruiterProfilePage({
  recruiterProfile,
  onSave,
}: {
  recruiterProfile: RecruiterProfile
  onSave: (data: RecruiterProfile) => Promise<void>
}) {
  // Start form with data from parent - saved data
  const [form, setForm] = useState<RecruiterProfile>(recruiterProfile)

  // If parent loads saved data later, update the form fields
  useEffect(() => {
    setForm(recruiterProfile)
  }, [recruiterProfile])

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ------------
  // handle change for form fields
  // ------------
  const handleChange = (key: keyof RecruiterProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsEditing(true)
  }

  // ------------
  // handle save for form recruiter profile
  // ------------
  const handleSave = async () => {
    if (!form.companyName) {
      toast.error('Missing required field', { description: 'Company name is required.' })
      return
    }

    setIsSaving(true)
    try {
      await onSave(form)
      setIsEditing(false)
      toast.success('Recruiter profile saved')
    } catch (err) {
      console.error(err)
      toast.error('Save failed', { description: 'Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <div className='space-y-6 max-w-3xl mx-auto'>
        <div>
          <h1>Recruiter Profile</h1>
          <p className='text-muted-foreground'>Company info used for job postings.</p>
        </div>

        <Card className='p-6 space-y-5'>
          <div className='space-y-2'>
            <Label>Company Name *</Label>
            <Input
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder='Hirelytics Inc.'
            />
          </div>

          <div className='space-y-2'>
            <Label>Company Website</Label>
            <Input
              value={form.companyWebsite}
              onChange={(e) => handleChange('companyWebsite', e.target.value)}
              placeholder='https://hirelytics.com'
            />
          </div>

          <div className='space-y-2'>
            <Label>Your Title</Label>
            <Input
              value={form.recruiterTitle}
              onChange={(e) => handleChange('recruiterTitle', e.target.value)}
              placeholder='Talent Acquisition'
            />
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={handleSave}
              disabled={!isEditing || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
