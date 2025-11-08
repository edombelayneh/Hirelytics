'use client'
import { Button } from '../components/ui/button'

export default function RoleSelection() {
  function handleRole(role: string) {
    console.log(`Role selected: ${role}`)
    // Redirect or perform actions based on the selected role
    if (role === 'applicant') {
      window.location.href = '/applicant-dashboard'
    } else if (role === 'recruiter') {
      window.location.href = '/recruiter-dashboard'
    }
  }
  return (
    <div className='flex flex-col items-center justify-center h-screen bg-background'>
      <h1 className='text-3xl mb-6'>Welcome to Hirelytics</h1>
      <p className='text-muted-foreground mb-10 text-center max-w-md'>
        Choose your role to get started. We’ll personalize your experience from here.
      </p>
      <div className='flex gap-6'>
        <Button
          size='lg'
          onClick={() => handleRole('applicant')}
        >
          I’m a Job Seeker
        </Button>
        <Button
          size='lg'
          variant='outline'
          onClick={() => handleRole('recruiter')}
        >
          I’m a Recruiter
        </Button>
      </div>
    </div>
  )
}
