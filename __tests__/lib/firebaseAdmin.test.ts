import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Because firebaseAdmin.ts runs initialization at import-time,
 * we must set env vars BEFORE importing it, and we must reset modules between tests.
 */

const ORIGINAL_ENV = process.env

// Mocks we want to assert against
const initializeAppMock = vi.fn()
const certMock = vi.fn((arg) => ({ __certArg: arg }))
const authMock = vi.fn(() => ({ __adminAuth: true }))

let getAppsMock: ReturnType<typeof vi.fn>

// Mock firebase-admin (used via `import * as admin from 'firebase-admin'`)
vi.mock('firebase-admin', () => ({
  initializeApp: (args: any) => initializeAppMock(args),
  credential: {
    cert: (arg: any) => certMock(arg),
  },
  auth: () => authMock(),
}))

// Mock firebase-admin/app (used via `import { getApps } from 'firebase-admin/app'`)
vi.mock('firebase-admin/app', () => ({
  getApps: () => getAppsMock(),
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
    getAppsMock = vi.fn(() => [])
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('initializes Firebase Admin when no apps exist', async () => {
    await import('@/app/lib/firebaseAdmin')

    expect(initializeAppMock).toHaveBeenCalledTimes(1)
    expect(certMock).toHaveBeenCalledTimes(1)

    // verifies newline conversion and correct credential fields
    expect(certMock).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@example.com',
      privateKey: 'line1\nline2',
    })
  })

  it('does not initialize Firebase Admin if an app already exists', async () => {
    getAppsMock = vi.fn(() => [{}]) // simulate already initialized

    await import('@/app/lib/firebaseAdmin')

    expect(initializeAppMock).not.toHaveBeenCalled()
    // still exports adminAuth (calls admin.auth())
    expect(authMock).toHaveBeenCalledTimes(1)
  })

  it('exports adminAuth from admin.auth()', async () => {
    const mod = await import('@/app/lib/firebaseAdmin')

    expect(mod.adminAuth).toEqual({ __adminAuth: true })
  })
})
