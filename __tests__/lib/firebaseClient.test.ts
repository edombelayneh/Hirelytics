import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FirebaseApp, FirebaseOptions } from 'firebase/app'

/**
 * Save the original environment variables
 * so we can restore them after each test
 */
const ORIGINAL_ENV = process.env

// Type helpers for mocked Firebase functions
type InitAppFn = (cfg: FirebaseOptions) => FirebaseApp
type GetAppsFn = () => FirebaseApp[]
type GetAppFn = () => FirebaseApp

type GetAuthFn = (app: FirebaseApp) => unknown
type GetFirestoreFn = (app: FirebaseApp) => unknown

/**
 * --- Hoisted mocks ---
 * These mocks must exist before imports run because
 * firebaseClient.ts initializes Firebase at import-time
 */
const mocks = vi.hoisted(() => {
  const initializeAppMock = vi.fn<InitAppFn>()
  const getAppsMock = vi.fn<GetAppsFn>()
  const getAppMock = vi.fn<GetAppFn>()

  const getAuthMock = vi.fn<GetAuthFn>()
  const getFirestoreMock = vi.fn<GetFirestoreFn>()

  return { initializeAppMock, getAppsMock, getAppMock, getAuthMock, getFirestoreMock }
})

/**
 * --- Fake return objects ---
 * These act as stand-ins for real Firebase services
 */
const mockFirebaseApp = { __app: true } as unknown as FirebaseApp
const mockAuth = { __auth: true }
const mockDb = { __firestore: true }

/**
 * --- Mock firebase/app ---
 * Handles app creation and retrieval
 */
vi.mock('firebase/app', () => ({
  initializeApp: mocks.initializeAppMock,
  getApps: mocks.getAppsMock,
  getApp: mocks.getAppMock,
}))

/**
 * --- Mock firebase/auth ---
 * Handles Firebase authentication
 */
vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuthMock,
}))

/**
 * --- Mock firebase/firestore ---
 * Handles Firestore database access
 */
vi.mock('firebase/firestore', () => ({
  getFirestore: mocks.getFirestoreMock,
}))

describe('app/lib/firebaseClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    // Reset environment variables
    process.env = { ...ORIGINAL_ENV }
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'api-key'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'auth-domain'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'project-id'
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'bucket'
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'sender-id'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'app-id'

    mocks.getAppsMock.mockReturnValue([]) // default: no apps exist

    // Mock return values used by the module
    mocks.initializeAppMock.mockReturnValue(mockFirebaseApp)
    mocks.getAppMock.mockReturnValue(mockFirebaseApp)

    mocks.getAuthMock.mockReturnValue(mockAuth)
    mocks.getFirestoreMock.mockReturnValue(mockDb)
  })

  afterEach(() => {
    // Restore original environment variables
    process.env = ORIGINAL_ENV
  })

  // --- Test: Firebase initializes when no app exists ---
  it('initializes a new Firebase app when none exists', async () => {
    await import('@/app/lib/firebaseClient')

    expect(mocks.getAppsMock).toHaveBeenCalledTimes(1)
    expect(mocks.initializeAppMock).toHaveBeenCalledTimes(1)
    expect(mocks.getAppMock).not.toHaveBeenCalled()

    // Ensure Firebase is initialized with correct config
    expect(mocks.initializeAppMock).toHaveBeenCalledWith({
      apiKey: 'api-key',
      authDomain: 'auth-domain',
      projectId: 'project-id',
      storageBucket: 'bucket',
      messagingSenderId: 'sender-id',
      appId: 'app-id',
    })

    // Auth and Firestore should be created using the app
    expect(mocks.getAuthMock).toHaveBeenCalledWith(mockFirebaseApp)
    expect(mocks.getFirestoreMock).toHaveBeenCalledWith(mockFirebaseApp)
  })

  // --- Test: Firebase reuses existing app ---
  it('reuses an existing Firebase app when one already exists', async () => {
    // Simulate an already-initialized Firebase app
    mocks.getAppsMock.mockReturnValue([mockFirebaseApp])

    await import('@/app/lib/firebaseClient')

    expect(mocks.getAppsMock).toHaveBeenCalledTimes(1)
    expect(mocks.getAppMock).toHaveBeenCalledTimes(1)
    expect(mocks.initializeAppMock).not.toHaveBeenCalled()
    // Auth and Firestore should still be retrieved
    expect(mocks.getAuthMock).toHaveBeenCalledWith(mockFirebaseApp)
    expect(mocks.getFirestoreMock).toHaveBeenCalledWith(mockFirebaseApp)
  })

  // --- Test: exported services are correct ---
  it('exports firebaseAuth and db services', async () => {
    const mod = await import('@/app/lib/firebaseClient')

    expect(mod.firebaseAuth).toBe(mockAuth)
    expect(mod.db).toBe(mockDb)
  })
})
