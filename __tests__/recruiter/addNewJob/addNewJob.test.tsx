import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import AddNewJobPage from '../../../app/recruiter/addNewJob/page'

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

type CollectionPath = { __collection: unknown[] }
type SavedJobData = { id?: number | string }
type MockQuerySnapshot = {
  forEach: (callback: (doc: { data: () => SavedJobData }) => void) => void
}

const collectionMock = vi.fn((...args: unknown[]): CollectionPath => ({ __collection: args }))
const addDocMock = vi.fn()
const getDocsMock = vi.fn<(...args: unknown[]) => Promise<MockQuerySnapshot>>()
const getRecruiterProfileMock = vi.fn()
const useUserMock = vi.fn()

const createSnapshot = (ids: Array<number | string>): MockQuerySnapshot => ({
  forEach: (callback) => {
    ids.forEach((id) => callback({ data: () => ({ id }) }))
  },
})

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => useUserMock(),
}))

vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {},
  firebaseAuth: {
    currentUser: { uid: 'firebase-user-1' },
  },
}))

vi.mock('../../../app/utils/userProfiles', () => ({
  getRecruiterProfile: (...args: unknown[]) => getRecruiterProfileMock(...args),
}))

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
}))

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText('Software Engineer'), {
    target: { value: 'Software Engineer' },
  })
  fireEvent.change(screen.getByPlaceholderText('Company Name'), {
    target: { value: 'TechCorp' },
  })
  fireEvent.change(screen.getByPlaceholderText('Main role summary and responsibilities'), {
    target: { value: 'Build web apps' },
  })
}

describe('AddNewJobPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    addDocMock.mockResolvedValue(undefined)
    getDocsMock.mockResolvedValue(createSnapshot([]))
    getRecruiterProfileMock.mockResolvedValue({ recruiterEmail: 'profile@techcorp.com' })
    useUserMock.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'clerk@techcorp.com' },
      },
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('renders required form fields', () => {
    render(<AddNewJobPage />)

    expect(screen.getByPlaceholderText('Software Engineer')).toBeTruthy()
    expect(screen.getByPlaceholderText('Company Name')).toBeTruthy()
    expect(screen.getByPlaceholderText('recruiter@company.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('Main role summary and responsibilities')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Add Job/i })).toBeTruthy()
  })

  it('prefills recruiter email from saved profile and still allows editing', async () => {
    render(<AddNewJobPage />)

    await vi.runAllTimersAsync()

    const recruiterEmailInput = screen.getByPlaceholderText('recruiter@company.com')

    expect((recruiterEmailInput as HTMLInputElement).value).toBe('profile@techcorp.com')

    fireEvent.change(recruiterEmailInput, {
      target: { value: 'edited@techcorp.com' },
    })

    expect((recruiterEmailInput as HTMLInputElement).value).toBe('edited@techcorp.com')
  })

  it('shows error message when required fields are missing', () => {
    render(<AddNewJobPage />)

    fireEvent.click(screen.getByRole('button', { name: /Add Job/i }))

    expect(
      screen.getByText(/Please fill in Job Name, Company Name, Description, and Recruiter Email/i)
    ).toBeTruthy()
    expect(screen.queryByText(/Submitting job/i)).toBeNull()
  })

  it('shows unauthorized access message for non-recruiter submit attempt', () => {
    const { container } = render(<AddNewJobPage initialUserRole='applicant' />)

    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form as HTMLFormElement)

    expect(screen.getByText(/Unauthorized access/i)).toBeTruthy()
    expect(screen.queryByText(/Submitting job/i)).toBeNull()
    expect(navigation.replace).toHaveBeenCalledWith('/')
  })

  it('submits and shows redirect overlay, then routes to the created recruiter job details page', async () => {
    render(<AddNewJobPage />)

    await vi.runAllTimersAsync()

    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: /Add Job/i }))

    await vi.advanceTimersByTimeAsync(1400)

    expect(addDocMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Job submitted\. Redirecting to Job Details/i)).toBeTruthy()
    expect(screen.getByText(/Submitting job/i)).toBeTruthy()
    expect(screen.getByText(/Redirecting you to the Job Details page/i)).toBeTruthy()

    await vi.advanceTimersByTimeAsync(2000)
    expect(navigation.push).toHaveBeenCalledWith('/recruiter/JobDetails/16')
  })

  it('generates the next numeric job id before saving', async () => {
    getDocsMock.mockResolvedValue(createSnapshot([16, '22']))

    render(<AddNewJobPage />)

    await vi.runAllTimersAsync()

    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: /Add Job/i }))

    await vi.runAllTimersAsync()

    expect(addDocMock).toHaveBeenCalledTimes(1)
    const savedPayload = addDocMock.mock.calls[0][1] as Record<string, unknown>

    expect(savedPayload.id).toBe(23)
    expect(typeof savedPayload.id).toBe('number')
    expect(savedPayload).toEqual(
      expect.objectContaining({
        title: 'Software Engineer',
        company: 'TechCorp',
        recruiterEmail: 'profile@techcorp.com',
      })
    )
  })

  it('navigates using the generated job id when higher ids already exist', async () => {
    getDocsMock.mockResolvedValue(createSnapshot([16, '22']))

    render(<AddNewJobPage />)

    await vi.runAllTimersAsync()

    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: /Add Job/i }))

    await vi.runAllTimersAsync()

    expect(navigation.push).toHaveBeenCalledWith('/recruiter/JobDetails/23')
  })
})
