import { render, screen } from '@testing-library/react'
import Page from '@/app/sign-up/[[...sign_up]]/page'
import { describe, it, expect, vi } from 'vitest'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  SignUp: () => <div data-testid='clerk-sign-up' />,
}))

describe('SignUp Page', () => {
  it('renders the Clerk SignUp component', () => {
    render(<Page />)

    expect(screen.getByTestId('clerk-sign-up')).toBeInTheDocument()
  })
})
