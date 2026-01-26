
// Import React memo for performance optimization
import { memo } from 'react'
// Import UI components and icons
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Briefcase, MapPin, Clock, DollarSign, CheckCircle2 } from 'lucide-react'
import { AvailableJob } from '../data/availableJobs'


// Props for JobCard: job data, apply handler, and applied state
interface JobCardProps {
  job: AvailableJob
  onApply: (job: AvailableJob) => void
  isApplied: boolean
}


// Memoized JobCard component for rendering job info and apply button
export const JobCard = memo(function JobCard({ job, onApply, isApplied }: JobCardProps) {
  // Calculate how many days since the job was posted
  const daysSincePosted = Math.floor(
    (new Date().getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card
      data-testid={`job-card-${job.id}`}
      className='h-full flex flex-col'
    >
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1'>
            <CardTitle className='text-xl mb-1'>{job.title}</CardTitle>
            <CardDescription className='flex items-center gap-1'>
              <Briefcase className='h-4 w-4' />
              {job.company}
            </CardDescription>
          </div>
          {/* Show badge for job type (Full-time, Part-time, etc.) */}
          <Badge variant={job.type === 'Full-time' ? 'default' : 'secondary'}>{job.type}</Badge>
        </div>
      </CardHeader>

      {/* Main content: location, salary, posted date, description, requirements */}
      <CardContent className='flex-1 space-y-4'>
        <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
          {/* Location info */}
          <div className='flex items-center gap-1'>
            <MapPin className='h-4 w-4' />
            {job.location}
          </div>
          {/* Salary info */}
          <div className='flex items-center gap-1'>
            <DollarSign className='h-4 w-4' />
            {job.salary}
          </div>
          {/* Days since posted */}
          <div className='flex items-center gap-1'>
            <Clock className='h-4 w-4' />
            {daysSincePosted === 0 ? 'Today' : `${daysSincePosted}d ago`}
          </div>
        </div>

        {/* Job description */}
        <p className='text-sm'>{job.description}</p>

        {/* Requirements list (show up to 3) */}
        <div>
          <p className='text-sm font-medium mb-2'>Requirements:</p>
          <ul className='text-sm text-muted-foreground space-y-1'>
            {job.requirements.slice(0, 3).map((req, index) => (
              <li
                key={index}
                className='flex items-start gap-2'
              >
                <span className='text-primary mt-1'>•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      {/* Footer: Apply button (disabled if already applied) */}
      <CardFooter>
        <Button
          className='w-full'
          onClick={() => onApply(job)}
          disabled={isApplied}
          variant={isApplied ? 'secondary' : 'default'}
        >
          {isApplied ? (
            // Show check icon and 'Applied' if already applied
            <>
              <CheckCircle2 className='h-4 w-4 mr-2' />
              Applied
            </>
          ) : (
            // Otherwise show 'Apply Now' button
            'Apply Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
})
