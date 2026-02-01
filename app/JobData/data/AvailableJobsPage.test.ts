import { describe, it, expect } from 'vitest'
import { availableJobs, AvailableJob } from './availableJobs'

describe('availableJobs data', () => {
  it('should be an array', () => {
    expect(Array.isArray(availableJobs)).toBe(true)
  })

  it('should have 15 jobs', () => {
    expect(availableJobs.length).toBe(15)
  })

  it('each job should match AvailableJob interface', () => {
    availableJobs.forEach((job) => {
      expect(typeof job.id).toBe('number')
      expect(typeof job.title).toBe('string')
      expect(typeof job.company).toBe('string')
      expect(typeof job.location).toBe('string')
      expect(typeof job.type).toBe('string')
      expect(typeof job.postedDate).toBe('string')
      expect(typeof job.salary).toBe('string')
      expect(typeof job.description).toBe('string')
      expect(Array.isArray(job.requirements)).toBe(true)
      expect(typeof job.status).toBe('string')
      expect(typeof job.applyLink).toBe('string')
    })
  })

  it('all jobs should have status "Open"', () => {
    availableJobs.forEach((job) => {
      expect(job.status).toBe('Open')
    })
  })

  it('each job should have non-empty title, company, and applyLink', () => {
    availableJobs.forEach((job) => {
      expect(job.title.length).toBeGreaterThan(0)
      expect(job.company.length).toBeGreaterThan(0)
      expect(job.applyLink.length).toBeGreaterThan(0)
    })
  })
})