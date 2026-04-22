import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RecruiterApplicantProfilePage from '../../../app/recruiter/applicants/[applicantId]/page'

// Mock next/link - Replace Link component with simple anchor tag for testing
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next/navigation - Provide test applicant ID from URL parameters
vi.mock('next/navigation', () => ({
  useParams: () => ({ applicantId: 'test-applicant-id' }),
}))

// Mock firebase client - MUST be before importing the page component
// Provides empty db and firebaseAuth objects for testing
vi.mock('../../../app/lib/firebaseClient', () => ({
  db: {},
  firebaseAuth: {},
}))

// Define mock functions for Firebase Firestore operations
const mockGetDoc = vi.fn() // Mock for fetching single document (user profile)
const mockGetDocs = vi.fn() // Mock for fetching document collection (job history)
const mockDoc = vi.fn() // Mock for creating document reference
const mockCollection = vi.fn() // Mock for creating collection reference

// Mock firebase/firestore - Replace Firebase functions with test mocks
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}))

// Mock profile data - Provide default profile structure for tests
// All fields initialized as empty strings for default profile testing
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

// Mock Card components - Render as simple divs for testing
vi.mock('../../../app/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Button component - Render as button element, pass through children if asChild prop
vi.mock('../../../app/components/ui/button', () => ({
  Button: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
}))

// Mock Avatar components - Render as divs with image support
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

// Mock Lucide React icons - Replace with simple span elements for testing
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
  // Reset all mocks before each test to ensure test isolation
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default return values for mock functions
    mockDoc.mockReturnValue({ id: 'mock-user-ref' })
    mockCollection.mockReturnValue({ id: 'mock-history-ref' })
  })

  // TEST: Verify that loading state is shown while data is being fetched
  it('shows loading state initially', () => {
    // Mock Firebase calls to never resolve (simulates loading state)
    mockGetDoc.mockReturnValue(new Promise(() => {}))
    mockGetDocs.mockReturnValue(new Promise(() => {}))

    render(<RecruiterApplicantProfilePage />)

    // Verify loading message is displayed
    expect(screen.queryByText('Loading applicant profile...')).not.toBeNull()
  })

  // TEST: Verify error message when applicant profile doesn't exist
  it('shows not found when applicant does not exist', async () => {
    // Mock Firebase to return that document doesn't exist
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    })

    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    // Verify not found message is displayed
    const message = await screen.findByText('Applicant profile not found.')
    expect(message).not.toBeNull()
  })

  // TEST: Verify complete profile data is rendered correctly
  it('renders applicant profile info when data loads successfully', async () => {
    // Mock successful Firebase response with complete profile data
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

    // Mock job history data
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

    // Verify all profile data is rendered on the page
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

  // TEST: Verify job history entries are displayed correctly
  it('renders employment history entries', async () => {
    // Mock basic profile data
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
        },
      }),
    })

    // Mock multiple job history entries
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

    // Verify job history section title and all job entries are visible
    expect(await screen.findByText('Job History')).not.toBeNull()
    expect(screen.queryByText('Media Services Technician')).not.toBeNull()
    expect(screen.queryByText('CMU')).not.toBeNull()
    expect(screen.queryByText('Provided classroom and media support.')).not.toBeNull()
    expect(screen.queryByText('IT Applications Intern')).not.toBeNull()
    expect(screen.queryByText('General Dynamics')).not.toBeNull()
    expect(screen.queryByText('Worked on internal systems and data validation.')).not.toBeNull()
  })

  // TEST: Verify empty state message when no job history exists
  it('shows message when no job history exists', async () => {
    // Mock profile without job history
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        profile: {
          firstName: 'Emma',
          lastName: 'Storm',
        },
      }),
    })

    // Mock empty job history collection
    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    render(<RecruiterApplicantProfilePage />)

    // Verify empty state message is displayed
    expect(await screen.findByText('No job history added yet.')).not.toBeNull()
  })

  // TEST: Verify fallback text appears for missing optional profile fields
  it('shows fallback text when optional profile fields are missing', async () => {
    // Mock profile with only required fields
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

    // Verify all fallback messages for empty fields are displayed
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

  // TEST: Verify navigation back link to recruiter jobs page works
  it('renders back link to recruiter jobs page', async () => {
    // Mock profile data
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

    // Verify back button is rendered with correct href
    const backLinks = await screen.findAllByText('Back to my jobs')
    expect(backLinks.length).toBeGreaterThan(0)
    expect(backLinks[0].getAttribute('href')).toBe('/recruiter/myJobs')
  })

  // TEST: Verify social and portfolio links are rendered when available
  it('renders social and portfolio links when provided', async () => {
    // Mock profile with social links
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

    // Verify all social links are rendered
    const linkedinElements = await screen.findAllByText('LinkedIn')
    const portfolioElements = screen.getAllByText('Portfolio')
    const githubElements = screen.getAllByText('GitHub')

    expect(linkedinElements.length).toBeGreaterThan(0)
    expect(portfolioElements.length).toBeGreaterThan(0)
    expect(githubElements.length).toBeGreaterThan(0)
  })
})
