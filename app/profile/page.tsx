import { memo, useEffect, useState, useRef } from 'react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
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
  CheckCircle2,
} from 'lucide-react'
import { UserProfile } from '../data/profileData'
import { toast } from '../components/ui/sonner'

interface ProfilePageProps {
  profile: UserProfile
  onUpdateProfile: (profile: UserProfile) => Promise<void> // async for firebase - basically waits for firebase now
}

export const ProfilePage = memo(function ProfilePage({
  profile,
  onUpdateProfile,
}: ProfilePageProps) {
  const [formData, setFormData] = useState<UserProfile>(profile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // disables save while writing

  const profilePicInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsEditing(true)
  }

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Profile picture must be less than 5MB',
        })
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
  }

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Resume must be less than 10MB',
        })
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
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Missing required fields', {
        description: 'Please fill in your name and email',
      })
      return
    }

    setIsSaving(true)

    try {
      // Save to Firebase (async) and wait on firebase until that finishes
      await onUpdateProfile(formData)

      setIsEditing(false)
      toast.success('Profile updated successfully', {
        description: 'Your changes have been saved',
      })
    } catch (err) {
      console.error('Save profile error:', err)
      toast.error('Save failed', {
        description: 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = () => {
    const first = formData.firstName.charAt(0).toUpperCase()
    const last = formData.lastName.charAt(0).toUpperCase()
    return `${first}${last}` || 'U'
  }

  useEffect(() => {
    // When parent loads profile from Firestore, update the form fields
    setFormData(profile)
  }, [profile])

  return (
    <div className='space-y-6 max-w-5xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col gap-2'>
        <h1>My Profile</h1>
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
                  src={formData.profilePicture || ''}
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
                  <span className='text-xs text-muted-foreground'>PDF, DOC, DOCX up to 10MB</span>
                </div>
              </Button>
            )}
            <input
              ref={resumeInputRef}
              type='file'
              accept='.pdf,.doc,.docx'
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
                className='pl-9'
              />
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
                placeholder='Doe'
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className='pl-9'
              />
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
                className='pl-9'
              />
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

      {/* Save Button */}
      <div className='flex justify-end gap-3 pb-8'>
        <Button
          size='lg'
          onClick={handleSave}
          disabled={!isEditing || isSaving} // disable while saving
          className='gap-2'
        >
          {isEditing ? (
            <>
              <Save className='h-4 w-4' />
              Save Changes
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
