import { render, screen } from '@testing-library/react'
import Page from '@/app/sign-in/[[...sign_in]]/page'
import { describe, it, expect, vi } from 'vitest'

/**
 * --- Mock Clerk ---
 * We don’t want to render the real Clerk SignIn UI in tests.
 * Instead, we replace it with a simple placeholder component
 * so we can check that it renders correctly.
 */
vi.mock('@clerk/nextjs', () => ({
  SignIn: () => <div data-testid='clerk-sign-in' />,
}))

describe('SignIn Page', () => {
  // --- Test: SignIn page renders Clerk SignIn component ---
  it('renders the Clerk SignIn component', () => {
    // Render the SignIn page
    render(<Page />)

    const signIn = screen.getByTestId('clerk-sign-in')
    // Ensure it exists in the document
    expect(signIn).toBeTruthy()
  })
})
