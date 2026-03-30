import { describe, it, expect, vi, beforeEach } from 'vitest'

type MockRef = { __docPath: unknown[] }

// Firestore call spies used to verify persistence behavior without hitting real Firebase.
const docMock = vi.fn((...args: unknown[]): MockRef => ({ __docPath: args }))
const setDocMock = vi.fn()
const serverTimestampMock = vi.fn(() => 'SERVER_TS')

// Mock app Firebase client so utility functions can import `db` safely in tests.
vi.mock('../../app/lib/firebaseClient', () => ({
  db: {},
}))

// Mock only the Firestore APIs used by `applicationFirebase.ts`.
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}))

describe('app/utils/applicationFirebase', () => {
  beforeEach(() => {
    // Ensure assertions are isolated between tests.
    vi.clearAllMocks()
  })

  it('buildApplicationFromAvailableJob maps list job fields into application payload', async () => {
    // Verifies list-page model mapping into the canonical save payload shape.
    const { buildApplicationFromAvailableJob } = await import('@/app/utils/applicationFirebase')

    const payload = buildApplicationFromAvailableJob({
      userId: 'user-1',
      job: {
        id: 7,
        title: 'Frontend Engineer',
        company: 'Acme',
        location: 'Remote',
        type: 'Full-time',
        postedDate: '2026-02-01',
        salary: '$120,000',
        description: 'Build UI features',
        requirements: ['React'],
        status: 'Open',
        applyLink: 'https://example.com/apply',
        recruiterId: 'recruiter-1',
        applicantsId: [],
      },
    })

    expect(payload).toMatchObject({
      userId: 'user-1',
      jobId: '7',
      company: 'Acme',
      position: 'Frontend Engineer',
      city: 'Remote',
      jobSource: 'Hirelytics',
      jobDetails: {
        title: 'Frontend Engineer',
        postedDate: '2026-02-01',
      },
    })
  })

  it('buildApplication uses merged values and falls back when fields are missing', async () => {
    // Verifies alias/fallback resolution for detail-page merged records.
    const { buildApplication } = await import('@/app/utils/applicationFirebase')

    const payload = buildApplication({
      userId: 'user-2',
      jobId: '44',
      mergedJob: {
        title: 'Platform Engineer',
        companyName: 'Contoso',
        country: 'USA',
        salary: '$130,000',
        generalDescription: 'Platform role',
        status: 'Open',
        applyLink: 'https://example.com/platform/apply',
      },
      fallback: {
        title: 'Fallback Title',
        company: 'Fallback Co',
        location: 'New York, NY',
        description: 'Fallback description',
        requirements: ['TypeScript'],
        postedDate: '2026-02-20',
      },
    })

    expect(payload).toMatchObject({
      userId: 'user-2',
      jobId: '44',
      company: 'Contoso',
      position: 'Platform Engineer',
      country: 'USA',
      city: 'New York, NY',
      jobDetails: {
        title: 'Platform Engineer',
        company: 'Contoso',
        location: 'New York, NY',
        postedDate: '2026-02-20',
        salary: '$130,000',
        description: 'Platform role',
        requirements: ['TypeScript'],
        status: 'Open',
        applyLink: 'https://example.com/platform/apply',
      },
    })
  })

  it('buildApplication preserves merged jobSource before default fallback', async () => {
    const { buildApplication } = await import('@/app/utils/applicationFirebase')

    const payload = buildApplication({
      userId: 'user-4',
      jobId: '88',
      mergedJob: {
        title: 'Data Engineer',
        company: 'Northwind',
        location: 'Austin, TX',
        jobSource: 'LinkedIn',
      },
      fallback: {
        title: 'Fallback Role',
        company: 'Fallback Co',
        location: 'Remote',
        description: 'Fallback description',
        requirements: ['SQL'],
        postedDate: '2026-03-01',
      },
    })

    expect(payload.jobSource).toBe('LinkedIn')
  })

  it('saveUserApplication writes merge setDoc with timestamps', async () => {
    // Verifies Firestore write contract: user-scoped path, merge mode, and timestamp fields.
    const { saveUserApplication } = await import('@/app/utils/applicationFirebase')

    await saveUserApplication({
      userId: 'user-3',
      jobId: '9',
      company: 'Fabrikam',
      position: 'Backend Engineer',
      country: 'Canada',
      city: 'Toronto',
      contactPerson: 'Jane Doe',
      jobSource: 'Hirelytics',
      jobLink: 'https://example.com/jobs/9',
      applicationDate: '2026-02-28',
      status: 'Applied',
      notes: '',
      jobDetails: {
        title: 'Backend Engineer',
        company: 'Fabrikam',
        location: 'Toronto',
        type: 'Full-time',
        postedDate: '2026-02-28',
        salary: '$140,000',
        description: 'Build APIs',
        requirements: ['Node.js'],
        status: 'Open',
        applyLink: 'https://example.com/jobs/9/apply',
      },
    })

    expect(docMock).toHaveBeenCalledWith(expect.any(Object), 'users', 'user-3', 'applications', '9')
    expect(setDocMock).toHaveBeenCalledTimes(1)
    expect(setDocMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        jobId: '9',
        company: 'Fabrikam',
        status: 'Applied',
        createdAt: 'SERVER_TS',
        updatedAt: 'SERVER_TS',
      }),
      { merge: true }
    )
  })
})
