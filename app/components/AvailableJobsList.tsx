'use client'

import { useState, memo, useEffect } from 'react'
import { JobCard } from './JobCard'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Search, Filter } from 'lucide-react'
import { AvailableJob, availableJobs } from '../data/availableJobs'
import type { Role } from '../utils/userRole'
// Import functions to fetch real recruiter UIDs from Firebase
import { fetchAllRecruiters, getAllRecruiterUids } from '../utils/recruiterCache'

interface AvailableJobsListProps {
  onApply: (job: AvailableJob) => void
  appliedJobIds: Set<number>
  role?: Role | null
}

export const AvailableJobsList = memo(function AvailableJobsList({
  onApply,
  appliedJobIds,
  role,
}: AvailableJobsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  // State for jobs with real recruiter UIDs from Firebase
  const [jobs, setJobs] = useState<AvailableJob[]>(availableJobs)

  // On component load: fetch recruiters from Firebase and assign them to mock jobs
  useEffect(() => {
    const loadJobsWithRecruiters = async () => {
      // Fetch all registered recruiters from Firestore
      await fetchAllRecruiters()
      // Get the cached list of recruiter UIDs
      const recruiterUids = getAllRecruiterUids()

      if (recruiterUids.length > 0) {
        // Cycle through recruiter UIDs and assign each one to a job
        // Example: if 2 recruiters exist, job 1 gets recruiter 1, job 2 gets recruiter 2, job 3 gets recruiter 1 again, etc.
        const jobsWithRecruiters = availableJobs.map((job, index) => ({
          ...job,
          // Replace placeholder recruiter UID with real one from Firebase
          recruiterId: recruiterUids[index % recruiterUids.length],
        }))
        // Update state with jobs that now have real recruiter UIDs
        setJobs(jobsWithRecruiters)
      }
    }

    loadJobsWithRecruiters()
  }, [])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || job.type === typeFilter
    const matchesLocation =
      locationFilter === 'all' ||
      (locationFilter === 'remote' ? job.location === 'Remote' : job.location !== 'Remote')

    return matchesSearch && matchesType && matchesLocation
  })

  const uniqueTypes = Array.from(new Set(jobs.map((job) => job.type)))

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='text-2xl font-bold mb-1'>Available Jobs</h2>
          <p className='text-muted-foreground'>
            Browse and apply to {jobs.length} open positions
          </p>
        </div>

        {role === 'recruiter' && (
          <a
            href='#/addNewJob'
            className='inline-flex items-center gap-2 rounded bg-black text-white px-4 py-2 text-sm font-medium'
          >
            <span className='text-lg'>+</span>
            Add Job
          </a>
        )}
      </div>

      {/* Filters */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search jobs, companies, or keywords...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-muted-foreground' />
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Job Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={locationFilter}
            onValueChange={setLocationFilter}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Location' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Locations</SelectItem>
              <SelectItem value='remote'>Remote</SelectItem>
              <SelectItem value='onsite'>On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className='text-sm text-muted-foreground'>
        Showing {filteredJobs.length} of {availableJobs.length} jobs
      </div>

      {/* Job Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onApply={onApply}
            isApplied={appliedJobIds.has(job.id)}
          />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  )
})
