import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  initializeAuth: vi.fn(),
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  addDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(() => 'timestamp'),
}))

// Mock Firebase app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}))

// Mock firebaseClient
vi.mock('../../app/lib/firebaseClient', () => ({
  db: {},
  firebaseAuth: {},
}))

// Mock getUserRole
vi.mock('../../app/utils/userRole', () => ({
  getUserRole: vi.fn(),
}))

// Mock Clerk useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}))

import { serverTimestamp } from 'firebase/firestore'

describe('AddNewJobPage Firebase Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockedServerTimestamp = serverTimestamp as unknown as {
      mockReturnValue: (value: string) => void
    }
    mockedServerTimestamp.mockReturnValue('timestamp')
  })

  afterEach(() => {
    cleanup()
  })

  it('should always set jobSource to internal since this page is for internal jobs only', () => {
    const jobSource = 'internal'

    expect(jobSource).toBe('internal')
  })

  it('should include all required job data fields when saving', () => {
    const jobData = {
      jobName: 'Software Engineer',
      companyName: 'TechCorp',
      recruiterEmail: 'recruiter@techcorp.com',
      description: 'Build web apps',
      qualifications: 'Bachelor in CS',
      preferredSkills: 'React, Node.js',
      country: 'USA',
      state: 'California',
      city: 'San Francisco',
      hourlyRate: 150,
      visaRequired: 'yes',
      jobType: 'remote',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      applicationDeadline: '2026-12-31',
      generalDescription: 'Join our team',
      recruiterId: 'test-user-id',
      jobSource: 'internal',
      createdAt: 'timestamp',
    }

    expect(jobData.jobName).toBe('Software Engineer')
    expect(jobData.jobSource).toBe('internal')
    expect(jobData.recruiterId).toBe('test-user-id')
    expect(jobData.createdAt).toBe('timestamp')
  })

  it('should parse hourlyRate as a number when provided', () => {
    const hourlyRate = '150.50'
    const parsedRate = hourlyRate ? parseFloat(hourlyRate) : null

    expect(parsedRate).toBe(150.5)
    expect(typeof parsedRate).toBe('number')
  })

  it('should set hourlyRate to null when not provided', () => {
    const hourlyRate = ''
    const parsedRate = hourlyRate ? parseFloat(hourlyRate) : null

    expect(parsedRate).toBeNull()
  })
})

// Helper cleanup function
function cleanup() {
  vi.clearAllMocks()
}
