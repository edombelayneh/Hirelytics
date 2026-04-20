import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

import { ApplicantsTable } from './ApplicantsTable'
import type { Applicant, ApplicationStatus } from '../../types/job'

// Use plain anchors in tests so href assertions are straightforward.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      {...rest}
    >
      {children}
    </a>
  ),
}))

// Replace Radix Select with a native select to avoid portal/popover complexity in jsdom.
vi.mock('../ui/select', () => {
  function Select({
    value,
    disabled,
    onValueChange,
    children,
  }: {
    value?: string
    disabled?: boolean
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }) {
    return (
      <select
        role='combobox'
        value={value ?? ''}
        disabled={Boolean(disabled)}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    )
  }

  function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return <option value={value}>{children}</option>
  }

  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const SelectValue = (_: { placeholder?: string }) => null
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

  return { Select, SelectItem, SelectTrigger, SelectValue, SelectContent }
})

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: 'a1',
    firstName: 'Jane',
    lastName: 'Doe',
    applicationStatus: 'APPLIED',
    ...overrides,
  }
}

describe('ApplicantsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders default title and empty state', () => {
    render(<ApplicantsTable applicants={[]} />)

    expect(screen.getByText('Applicants')).toBeTruthy()
    expect(screen.getByText('No applicants yet.')).toBeTruthy()
  })

  it('renders a custom title when provided', () => {
    render(
      <ApplicantsTable
        title='Top Candidates'
        applicants={[]}
      />
    )

    expect(screen.getByText('Top Candidates')).toBeTruthy()
  })

  it('renders applicant name and links to the default profile route', () => {
    render(<ApplicantsTable applicants={[makeApplicant()]} />)

    const nameLink = screen.getByRole('link', { name: 'Jane Doe' })
    expect(nameLink.getAttribute('href')).toBe('/recruiter/applicants/a1')
  })

  it('uses custom profileHref builder when supplied', () => {
    render(
      <ApplicantsTable
        applicants={[makeApplicant()]}
        profileHref={(id) => `/custom/profile/${id}`}
      />
    )

    const nameLink = screen.getByRole('link', { name: 'Jane Doe' })
    expect(nameLink.getAttribute('href')).toBe('/custom/profile/a1')
  })

  it('falls back to Unnamed when first and last name are empty', () => {
    render(
      <ApplicantsTable
        applicants={[
          makeApplicant({
            firstName: '',
            lastName: '',
          }),
        ]}
      />
    )

    expect(screen.getByRole('link', { name: 'Unnamed' })).toBeTruthy()
  })

  it('disables status dropdown when onStatusChange is not provided', () => {
    render(<ApplicantsTable applicants={[makeApplicant()]} />)

    const statusSelect = screen.getByRole('combobox') as HTMLSelectElement
    expect(statusSelect.disabled).toBe(true)
    expect(statusSelect.value).toBe('APPLIED')
  })

  it('uses APPLIED as status fallback when applicationStatus is missing', () => {
    render(
      <ApplicantsTable
        applicants={[makeApplicant({ applicationStatus: undefined })]}
        onStatusChange={vi.fn()}
      />
    )

    const statusSelect = screen.getByRole('combobox') as HTMLSelectElement
    expect(statusSelect.value).toBe('APPLIED')
  })

  it('calls onStatusChange with applicant id and selected status', () => {
    const onStatusChange = vi.fn((_: string, __: ApplicationStatus) => undefined)

    render(
      <ApplicantsTable
        applicants={[makeApplicant()]}
        onStatusChange={onStatusChange}
      />
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'INTERVIEWS' } })

    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(onStatusChange).toHaveBeenCalledWith('a1', 'INTERVIEWS')
  })

  it('renders resume download link when resume exists', () => {
    render(
      <ApplicantsTable
        applicants={[
          makeApplicant({
            resumeUrl: 'https://example.com/resume.pdf',
            resumeFileName: 'jane-doe.pdf',
          }),
        ]}
      />
    )

    const resumeLink = screen.getByRole('link', { name: 'jane-doe.pdf' })
    expect(resumeLink.getAttribute('href')).toBe('https://example.com/resume.pdf')
    expect(resumeLink.getAttribute('download')).toBe('jane-doe.pdf')
  })

  it('renders fallback text when resume is missing', () => {
    render(<ApplicantsTable applicants={[makeApplicant({ resumeUrl: undefined })]} />)

    expect(screen.getByText('No resume uploaded')).toBeTruthy()
  })

  it('normalizes external links and labels for fully-qualified linkedin/portfolio URLs', () => {
    render(
      <ApplicantsTable
        applicants={[
          makeApplicant({
            linkedinUrl: 'https://www.linkedin.com/in/jane-doe',
            portfolioUrl: 'https://www.janedoe.dev/work',
          }),
        ]}
      />
    )

    const linkedinLink = screen.getByRole('link', { name: 'linkedin.com' })
    const portfolioLink = screen.getByRole('link', { name: 'janedoe.dev' })

    expect(linkedinLink.getAttribute('href')).toBe('https://www.linkedin.com/in/jane-doe')
    expect(portfolioLink.getAttribute('href')).toBe('https://www.janedoe.dev/work')
  })

  it('adds https:// to non-qualified URLs and preserves raw label when URL parsing fails', () => {
    render(
      <ApplicantsTable
        applicants={[
          makeApplicant({
            linkedinUrl: 'linkedin.com/in/jane-doe',
            portfolioUrl: 'portfolio.janedoe.dev',
          }),
        ]}
      />
    )

    const row = screen.getByRole('link', { name: 'Jane Doe' }).closest('tr')
    expect(row).toBeTruthy()

    const rowScope = within(row as HTMLElement)
    const linkedinLink = rowScope.getByRole('link', { name: 'linkedin.com/in/jane-doe' })
    const portfolioLink = rowScope.getByRole('link', { name: 'portfolio.janedoe.dev' })

    expect(linkedinLink.getAttribute('href')).toBe('https://linkedin.com/in/jane-doe')
    expect(portfolioLink.getAttribute('href')).toBe('https://portfolio.janedoe.dev')
  })

  it('shows dash placeholders when linkedin and portfolio are absent', () => {
    render(
      <ApplicantsTable
        applicants={[
          makeApplicant({
            linkedinUrl: undefined,
            portfolioUrl: undefined,
          }),
        ]}
      />
    )

    expect(screen.getAllByText('—').length).toBe(2)
  })
})
