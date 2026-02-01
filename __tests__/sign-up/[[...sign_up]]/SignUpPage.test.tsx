import { render, screen } from '@testing-library/react'
import Page from '@/app/sign-up/[[...sign_up]]/page'
import { describe, it, expect, vi } from 'vitest'

/**
 * --- Mock Clerk ---
 * We replace the real Clerk SignUp component with a simple mock.
 * This keeps the test focused on whether the page renders it,
 * not on Clerk’s internal behavior.
 */
vi.mock('@clerk/nextjs', () => ({
  SignUp: () => <div data-testid='clerk-sign-up' />,
}))

describe('SignUp Page', () => {
  // --- Test: SignUp page renders Clerk SignUp component ---
  it('renders the Clerk SignUp component', () => {
    // Render the SignUp page
    render(<Page />)

    const signUp = screen.getByTestId('clerk-sign-up')
    // Ensure it exists in the document
    expect(signUp).toBeTruthy()
  })
})
