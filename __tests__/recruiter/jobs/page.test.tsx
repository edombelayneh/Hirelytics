import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Jobs from '../../../app/recruiter/jobs/page'
import type { Role } from '../../../app/utils/userRole'

let capturedRole: Role | null | undefined

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'test-user-id',
    isLoaded: true,
  })),
  useUser: vi.fn(() => ({
    user: {
      publicMetadata: { role: 'recruiter' },
    },
  })),
}))

vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_ref: unknown, callback: (snap: { docs: { id: string }[] }) => void) => {
    callback({ docs: [] })
    return vi.fn()
  }),
}))

vi.mock('../../../app/components/AvailableJobsList', () => ({
  AvailableJobsList: ({ role }: { role?: Role | null }) => {
    capturedRole = role
    return (
      <div>
        <div data-testid='recruiter-jobs-root'>Recruiter jobs UI</div>
      </div>
    )
  },
}))

describe('Recruiter Jobs Page (page.test)', () => {
  beforeEach(() => {
    capturedRole = undefined
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the recruiter jobs page and passes recruiter role', () => {
    render(<Jobs />)
    expect(screen.getByTestId('recruiter-jobs-root')).toBeTruthy()
    expect(capturedRole).toBe('recruiter')
  })
})
