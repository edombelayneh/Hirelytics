import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AppOptions, ServiceAccount } from 'firebase-admin'
import type { App as AdminApp } from 'firebase-admin/app'

/**
 * Because firebaseAdmin.ts runs initialization at import-time,
 * we must set env vars BEFORE importing it, and we must reset modules between tests.
 */

const ORIGINAL_ENV = process.env

type GetAppsFn = () => AdminApp[]

// Hoist-safe mocks (Vitest hoists vi.mock calls)
const mocks = vi.hoisted(() => {
  const initializeAppMock = vi.fn<(args: AppOptions) => unknown>()
  const certMock = vi.fn<(arg: ServiceAccount) => unknown>()
  const authMock = vi.fn<() => unknown>()
  const getAppsMock = vi.fn<GetAppsFn>()

  return { initializeAppMock, certMock, authMock, getAppsMock }
})

// Mock firebase-admin (used via `import * as admin from 'firebase-admin'`)
vi.mock('firebase-admin', () => ({
  initializeApp: mocks.initializeAppMock,
  credential: {
    cert: mocks.certMock,
  },
  auth: mocks.authMock,
}))

// Mock firebase-admin/app (used via `import { getApps } from 'firebase-admin/app'`)
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

    // default return values for mocks your module uses
    mocks.certMock.mockImplementation((arg) => ({ __certArg: arg }))
    mocks.authMock.mockImplementation(() => ({ __adminAuth: true }))
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

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

  it('does not initialize Firebase Admin if an app already exists', async () => {
    mocks.getAppsMock.mockReturnValue([{} as AdminApp]) // simulate already initialized

    await import('@/app/lib/firebaseAdmin')

    expect(mocks.initializeAppMock).not.toHaveBeenCalled()
    // still exports adminAuth (calls admin.auth())
    expect(mocks.authMock).toHaveBeenCalledTimes(1)
  })

  it('exports adminAuth from admin.auth()', async () => {
    const mod = await import('@/app/lib/firebaseAdmin')

    expect(mod.adminAuth).toEqual({ __adminAuth: true })
  })
})
