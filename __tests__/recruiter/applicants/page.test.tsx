import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RecruiterApplicantProfilePage from '../../../app/recruiter/applicants/[applicantId]/page'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ applicantId: 'test-applicant-id' }),
}))

// Mock firebase client - MUST be before importing the page component
vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {},
  firebaseAuth: {},
}))

const mockGetDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockDoc = vi.fn()
const mockCollection = vi.fn()

// Mock firestore
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}))

// Mock profile data
vi.mock('../../../app/data/profileData', () => ({
  defaultProfile: {
    firstName: '',
    lastName: '',
    profilePicture: '',
    currentTitle: '',
    email: '',
    phone: '',
    location: '',
    availability: '',
    bio: '',
    yearsOfExperience: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    resumeFile: '',
    resumeFileName: '',
  },
}))

// Mock UI components
vi.mock('../../../app/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../../app/components/ui/button', () => ({
  Button: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
}))

vi.mock('../../../app/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => (
    <img
      src={src}
      alt={alt}
    />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock icons
vi.mock('lucide-react', () => ({
  Mail: () => <span>MailIcon</span>,
  Phone: () => <span>PhoneIcon</span>,
  MapPin: () => <span>MapPinIcon</span>,
  Globe: () => <span>GlobeIcon</span>,
  Linkedin: () => <span>LinkedinIcon</span>,
  Github: () => <span>GithubIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
}))

describe('RecruiterApplicantProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.mockReturnValue({ id: 'mock-user-ref' })
    mockCollection.mockReturnValue({ id: 'mock-history-ref' })
  })

  it('shows loading state initially', () => {
    mockGetDoc.mockReturnValue(new Promise(() => {}))
    mockGetDocs.mockReturnValue(new Promise(() => {}))

    render(<RecruiterApplicantProfilePage />)

    expect(screen.queryByText('Loading applicant profile...')).not.toBeNull()
  })

  it('shows not found when applicant does not exist', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    })

    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    const message = await screen.findByText('Applicant profile not found.')
    expect(message).not.toBeNull()
  })

  it('renders applicant profile info when data loads successfully', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
          currentTitle: 'Software Developer',
          email: 'emma@example.com',
          phone: '555-555-5555',
          location: 'Mount Pleasant, MI',
          availability: 'Open to internships',
          bio: 'Computer Science student interested in full-stack development.',
          yearsOfExperience: '2 years',
          linkedinUrl: 'https://linkedin.com/in/emma',
          portfolioUrl: 'https://emma.dev',
          githubUrl: 'https://github.com/emma',
          resumeFile: '/resume.pdf',
          resumeFileName: 'Emma_Resume.pdf',
          profilePicture: '',
        },
      }),
    })

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'job-1',
          data: () => ({
            title: 'IT Intern',
            company: 'Comerica',
            startDate: 'May 2023',
            endDate: 'Aug 2023',
            isCurrent: false,
            roleDescription: 'Supported technical projects and data tasks.',
          }),
        },
      ],
    })

    render(<RecruiterApplicantProfilePage />)

    const nameElements = await screen.findAllByText('Emma Storm')
    expect(nameElements.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Software Developer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('emma@example.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('555-555-5555').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mount Pleasant, MI').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Open to internships').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Computer Science student interested in full-stack development.').length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('2 years').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Emma_Resume.pdf').length).toBeGreaterThan(0)
  })

  it('renders employment history entries', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
        },
      }),
    })

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'job-1',
          data: () => ({
            title: 'Media Services Technician',
            company: 'CMU',
            startDate: 'Nov 2022',
            endDate: 'Present',
            isCurrent: true,
            roleDescription: 'Provided classroom and media support.',
          }),
        },
        {
          id: 'job-2',
          data: () => ({
            title: 'IT Applications Intern',
            company: 'General Dynamics',
            startDate: 'May 2024',
            endDate: 'Aug 2024',
            isCurrent: false,
            roleDescription: 'Worked on internal systems and data validation.',
          }),
        },
      ],
    })

    render(<RecruiterApplicantProfilePage />)

    expect(await screen.findByText('Employment history')).not.toBeNull()
    expect(screen.queryByText('Media Services Technician')).not.toBeNull()
    expect(screen.queryByText('CMU')).not.toBeNull()
    expect(screen.queryByText('Provided classroom and media support.')).not.toBeNull()
    expect(screen.queryByText('IT Applications Intern')).not.toBeNull()
    expect(screen.queryByText('General Dynamics')).not.toBeNull()
    expect(screen.queryByText('Worked on internal systems and data validation.')).not.toBeNull()
  })

  it('shows message when no job history exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
        },
      }),
    })

    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    expect(await screen.findByText('No job history entries available.')).not.toBeNull()
  })

  it('shows fallback text when optional profile fields are missing', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
        },
      }),
    })

    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    await waitFor(() => {
      expect(screen.getAllByText('No email saved').length).toBeGreaterThan(0)
      expect(screen.getAllByText('No phone saved').length).toBeGreaterThan(0)
      expect(screen.getAllByText('No location saved').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Availability not set').length).toBeGreaterThan(0)
      expect(screen.getAllByText('No bio available for this applicant.').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Resume not available').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0)
  })

  it('renders back link to recruiter jobs page', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
        },
      }),
    })

    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    const backLinks = await screen.findAllByText('Back to my jobs')
    expect(backLinks.length).toBeGreaterThan(0)
    expect(backLinks[0].getAttribute('href')).toBe('/recruiter/myJobs')
  })

  it('renders social and portfolio links when provided', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
          linkedinUrl: 'https://linkedin.com/in/emma',
          portfolioUrl: 'https://emma.dev',
          githubUrl: 'https://github.com/emma',
        },
      }),
    })

    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    const linkedinElements = await screen.findAllByText('LinkedIn')
    const portfolioElements = screen.getAllByText('Portfolio')
    const githubElements = screen.getAllByText('GitHub')

    expect(linkedinElements.length).toBeGreaterThan(0)
    expect(portfolioElements.length).toBeGreaterThan(0)
    expect(githubElements.length).toBeGreaterThan(0)
  })
})
