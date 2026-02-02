import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AppOptions, ServiceAccount } from 'firebase-admin'
import type { App as AdminApp } from 'firebase-admin/app'

/**
 * IMPORTANT NOTE:
 * firebaseAdmin.ts initializes Firebase as soon as it is imported.
 * Because of that:
 * - Environment variables MUST be set before importing the file
 * - We must reset modules between tests so each test starts fresh
 */

// Save the original environment so we can restore it later
const ORIGINAL_ENV = process.env

type GetAppsFn = () => AdminApp[]

/**
 * --- Hoisted mocks ---
 * Vitest hoists `vi.mock()` calls to the top of the file.
 * Using vi.hoisted ensures these mock functions exist before imports run.
 */
const mocks = vi.hoisted(() => {
  const initializeAppMock = vi.fn<(args: AppOptions) => unknown>()
  const certMock = vi.fn<(arg: ServiceAccount) => unknown>()
  const authMock = vi.fn<() => unknown>()
  const getAppsMock = vi.fn<GetAppsFn>()

  return { initializeAppMock, certMock, authMock, getAppsMock }
})

/**
 * --- Mock firebase-admin ---
 * This mocks:
 * - initializeApp (used to initialize Firebase)
 * - credential.cert (used to build credentials)
 * - auth (used to get admin auth)
 */
vi.mock('firebase-admin', () => ({
  initializeApp: mocks.initializeAppMock,
  credential: {
    cert: mocks.certMock,
  },
  auth: mocks.authMock,
}))

/**
 * --- Mock firebase-admin/app ---
 * getApps() tells Firebase whether an app is already initialized
 */
vi.mock('firebase-admin/app', () => ({
  getApps: mocks.getAppsMock,
}))

describe('app/lib/firebaseAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    // reset env
    process.env = { ...ORIGINAL_ENV }

    // set required env vars before importing module
    process.env.FIREBASE_PROJECT_ID = 'test-project'
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com'
    process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2'

    // default: no existing apps
    mocks.getAppsMock.mockReturnValue([])

    // Mock return values used by the module
    mocks.certMock.mockImplementation((arg) => ({ __certArg: arg }))
    mocks.authMock.mockImplementation(() => ({ __adminAuth: true }))
  })

  afterEach(() => {
    // Restore original environment after each test
    process.env = ORIGINAL_ENV
  })

  // --- Test: Firebase initializes when no app exists ---
  it('initializes Firebase Admin when no apps exist', async () => {
    await import('@/app/lib/firebaseAdmin')

    expect(mocks.initializeAppMock).toHaveBeenCalledTimes(1)
    expect(mocks.certMock).toHaveBeenCalledTimes(1)

    // verifies newline conversion and correct credential fields
    expect(mocks.certMock).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@example.com',
      privateKey: 'line1\nline2',
    })
  })

  // --- Test: Firebase does NOT reinitialize if already initialized ---
  it('does not initialize Firebase Admin if an app already exists', async () => {
    mocks.getAppsMock.mockReturnValue([{} as AdminApp]) // simulate already initialized

    await import('@/app/lib/firebaseAdmin')

    // Should NOT initialize again
    expect(mocks.initializeAppMock).not.toHaveBeenCalled()
    // still exports adminAuth (calls admin.auth())
    expect(mocks.authMock).toHaveBeenCalledTimes(1)
  })

  // --- Test: adminAuth export works correctly ---
  it('exports adminAuth from admin.auth()', async () => {
    const mod = await import('@/app/lib/firebaseAdmin')

    expect(mod.adminAuth).toEqual({ __adminAuth: true })
  })
})
