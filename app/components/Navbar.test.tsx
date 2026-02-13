// app/components/Navbar.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import { Navbar } from './Navbar'

// Mock Clerk UserButton so tests don’t break
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid='user-button'>UserButton</div>,
}))

describe('Navbar', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  // Logo shows up
  it('renders the logo', () => {
    render(<Navbar currentPage='' />)
    expect(screen.getByAltText('Hirelytics Logo')).toBeTruthy()
  })

  // All nav labels show up
  it('renders all navigation links', () => {
    render(<Navbar currentPage='' />)
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Available Jobs')).toBeTruthy()
    expect(screen.getByText('My Applications')).toBeTruthy()
  })

  // Each link points to the right hash route (no jest-dom needed)
  it('links go to the correct pages', () => {
    render(<Navbar currentPage='' />)

    const home = screen.getByRole('link', { name: /Home/i })
    expect(home.getAttribute('href')).toBe('#/')

    const jobs = screen.getByRole('link', { name: /Available Jobs/i })
    expect(jobs.getAttribute('href')).toBe('#/jobs')

    const apps = screen.getByRole('link', { name: /My Applications/i })
    expect(apps.getAttribute('href')).toBe('#/applications')
  })

  // User button renders
  it('renders the UserButton', () => {
    render(<Navbar currentPage='' />)
    expect(screen.getByTestId('user-button')).toBeTruthy()
  })

  // Active link gets highlighted
  it('applies active class to the current page', () => {
    render(<Navbar currentPage='jobs' />)

    const jobsLink = screen.getByRole('link', { name: /Available Jobs/i })
    expect(jobsLink.className.includes('text-primary')).toBe(true)
  })

  // Icons render (SVGs)
  it('renders icons', () => {
    const { container } = render(<Navbar currentPage='' />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })
})
