'use client'

// Job Details page - displays internal jobs posted by recruiters
// Shows confirmation that redirect from Add New Job page was successful

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { getUserRole, type Role } from '../utils/userRole'

interface Job {
  id: string
  jobName: string
  companyName: string
  recruiterEmail: string
  description: string
  qualifications: string
  preferredSkills: string
  country: string
  state: string
  city: string
  hourlyRate: number | null
  visaRequired: string
  jobType: string
  employmentType: string
  experienceLevel: string
  applicationDeadline: string
  generalDescription: string
  recruiterId: string
  jobSource: string
  createdAt: any
}

export default function JobDetailsPage() {
  const { userId } = useAuth()
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])

  // Check user role and fetch jobs
  useEffect(() => {
    const initializePage = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const role = await getUserRole(userId)
        setUserRole(role)

        // Fetch internal jobs from Firebase
        const jobsRef = collection(db, 'jobs')
        const q = query(
          jobsRef,
          where('jobSource', '==', 'internal'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )

        const querySnapshot = await getDocs(q)
        const fetchedJobs: Job[] = []

        querySnapshot.forEach((doc) => {
          fetchedJobs.push({
            id: doc.id,
            ...doc.data(),
          } as Job)
        })

        setJobs(fetchedJobs)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setIsLoading(false)
      }
    }

    initializePage()
  }, [userId])

  if (isLoading) {
    return (
      <main className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg px-6 py-4 shadow-lg text-center'>
          <p className='font-medium'>Loading job details...</p>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto py-10 px-6'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Internal Job Details</h1>
          <p className='text-gray-600'>
            Viewing internal jobs posted by recruiters. Successfully redirected from Add New Job
            page! 🎉
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <p className='text-gray-500 mb-4'>No internal jobs found.</p>
            <p className='text-sm text-gray-400'>
              Add your first job using the &quot;Add New Job&quot; page.
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {jobs.map((job) => (
              <div
                key={job.id}
                className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
              >
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <h2 className='text-2xl font-semibold text-gray-900'>{job.jobName}</h2>
                    <p className='text-lg text-gray-600 mt-1'>{job.companyName}</p>
                  </div>
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
                    Internal
                  </span>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                  {job.jobType && (
                    <div>
                      <p className='text-xs text-gray-500 uppercase tracking-wide'>Job Type</p>
                      <p className='text-sm font-medium capitalize'>{job.jobType}</p>
                    </div>
                  )}
                  {job.employmentType && (
                    <div>
                      <p className='text-xs text-gray-500 uppercase tracking-wide'>Employment</p>
                      <p className='text-sm font-medium capitalize'>{job.employmentType}</p>
                    </div>
                  )}
                  {job.experienceLevel && (
                    <div>
                      <p className='text-xs text-gray-500 uppercase tracking-wide'>Experience</p>
                      <p className='text-sm font-medium capitalize'>{job.experienceLevel}</p>
                    </div>
                  )}
                  {job.hourlyRate && (
                    <div>
                      <p className='text-xs text-gray-500 uppercase tracking-wide'>Hourly Rate</p>
                      <p className='text-sm font-medium'>${job.hourlyRate}/hr</p>
                    </div>
                  )}
                </div>

                {(job.city || job.state || job.country) && (
                  <div className='mb-4'>
                    <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Location</p>
                    <p className='text-sm'>
                      {[job.city, job.state, job.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                <div className='mb-4'>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Description</p>
                  <p className='text-sm text-gray-700'>{job.description}</p>
                </div>

                {job.qualifications && (
                  <div className='mb-4'>
                    <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>
                      Qualifications
                    </p>
                    <p className='text-sm text-gray-700 whitespace-pre-line'>
                      {job.qualifications}
                    </p>
                  </div>
                )}

                {job.preferredSkills && (
                  <div className='mb-4'>
                    <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>
                      Preferred Skills
                    </p>
                    <p className='text-sm text-gray-700 whitespace-pre-line'>
                      {job.preferredSkills}
                    </p>
                  </div>
                )}

                <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                  <div className='flex gap-4 text-xs text-gray-500'>
                    {job.visaRequired && (
                      <span>
                        Visa Sponsorship:{' '}
                        <span className='font-medium'>
                          {job.visaRequired === 'yes' ? 'Available' : 'Not Available'}
                        </span>
                      </span>
                    )}
                    {job.applicationDeadline && (
                      <span>
                        Deadline:{' '}
                        <span className='font-medium'>
                          {new Date(job.applicationDeadline).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-gray-400'>
                    Recruiter: {job.recruiterEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {userRole === 'recruiter' && (
          <div className='mt-8 text-center'>
            <a
              href='#/addNewJob'
              className='inline-flex items-center gap-2 rounded bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors'
            >
              + Add Another Job
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
