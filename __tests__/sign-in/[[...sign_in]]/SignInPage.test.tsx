import { render, screen } from '@testing-library/react'
import Page from '@/app/sign-in/[[...sign_in]]/page'
import { describe, it, expect, vi } from 'vitest'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  SignIn: () => <div data-testid='clerk-sign-in' />,
}))

describe('SignIn Page', () => {
  it('renders the Clerk SignIn component', () => {
    render(<Page />)

    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument()
  })
})
