'use client'

import { useState, memo } from 'react'
import { JobCard } from './JobCard'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Search, Filter } from 'lucide-react'
import { AvailableJob } from '../data/availableJobs'
import type { Role } from '../utils/userRole'

interface AvailableJobsListProps {
  // Jobs fetched from Firestore
  jobs: AvailableJob[]
  // Called when a user clicks Apply on a job
  onApply: (job: AvailableJob) => void
  // Set of job IDs already applied to (controls disabled state)
  appliedJobIds: Set<string>
  // Optional role used for conditional UI (e.g., recruiter-only actions)
  role?: Role | null
}

// Memoized to prevent unnecessary re-renders when props don’t change
export const AvailableJobsList = memo(function AvailableJobsList({
  jobs,
  onApply,
  appliedJobIds,
  role,
}: AvailableJobsListProps) {
  const [searchTerm, setSearchTerm] = useState('') // Search input state
  const [typeFilter, setTypeFilter] = useState<string>('all') // Job type filter (Full-time, Part-time, etc.)
  const [locationFilter, setLocationFilter] = useState<string>('all') // Location filter (Remote vs On-site)

  // Derived list: filters jobs based on search + type + location
  const filteredJobs = jobs.filter((job) => {
    const normalizedSearchTerm = searchTerm.toLowerCase()
    const title = String(job.title ?? '').toLowerCase()
    const company = String(job.company ?? '').toLowerCase()
    const location = String(job.location ?? '').toLowerCase()
    const description = String(job.description ?? '').toLowerCase()

    // Search matches title, company, location, or description
    const matchesSearch =
      title.includes(normalizedSearchTerm) ||
      company.includes(normalizedSearchTerm) ||
      location.includes(normalizedSearchTerm) ||
      description.includes(normalizedSearchTerm)

    // Type filter match
    const matchesType = typeFilter === 'all' || job.type === typeFilter
    // Location filter logic (special handling for “remote”)
    const matchesLocation =
      locationFilter === 'all' ||
      (locationFilter === 'remote' ? job.location === 'Remote' : job.location !== 'Remote')

    return matchesSearch && matchesType && matchesLocation
  })

  // Extract unique job types dynamically for dropdown options
  const uniqueTypes = Array.from(new Set(jobs.map((job) => job.type))).filter(Boolean)

  return (
    <div className='space-y-6'>
      {/* Header section: title + job count + optional recruiter action */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='text-2xl font-bold mb-1'>Available Jobs</h2>
          <p className='text-muted-foreground'>Browse and apply to {jobs.length} open positions</p>
        </div>
        {/* Recruiter-only: Add Job button */}
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

        {/* Dropdown filters */}
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-muted-foreground' />
          {/* Job type dropdown */}
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
          {/* Location dropdown */}
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
        Showing {filteredJobs.length} of {jobs.length} jobs
      </div>

      {/* Job Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredJobs.map((job, index) => (
          <JobCard
            key={`${job.id}-${index}`}
            job={job}
            onApply={onApply}
            isApplied={appliedJobIds.has(job.id)}
            showApplyButton={role !== 'recruiter'}
            role={role === 'recruiter' ? 'recruiter' : 'applicant'}
          />
        ))}
      </div>
      {/* Empty state */}
      {filteredJobs.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  )
})
