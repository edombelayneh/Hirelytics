import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FirebaseApp, FirebaseOptions } from 'firebase/app'

const ORIGINAL_ENV = process.env

type InitAppFn = (cfg: FirebaseOptions) => FirebaseApp
type GetAppsFn = () => FirebaseApp[]
type GetAppFn = () => FirebaseApp

type GetAuthFn = (app: FirebaseApp) => unknown
type GetFirestoreFn = (app: FirebaseApp) => unknown

// Hoist-safe mocks (Vitest hoists vi.mock calls)
const mocks = vi.hoisted(() => {
  const initializeAppMock = vi.fn<InitAppFn>()
  const getAppsMock = vi.fn<GetAppsFn>()
  const getAppMock = vi.fn<GetAppFn>()

  const getAuthMock = vi.fn<GetAuthFn>()
  const getFirestoreMock = vi.fn<GetFirestoreFn>()

  return { initializeAppMock, getAppsMock, getAppMock, getAuthMock, getFirestoreMock }
})

// Sentinel objects
const mockFirebaseApp = { __app: true } as unknown as FirebaseApp
const mockAuth = { __auth: true }
const mockDb = { __firestore: true }

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: mocks.initializeAppMock,
  getApps: mocks.getAppsMock,
  getApp: mocks.getAppMock,
}))

// Mock firebase/auth + firestore
vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuthMock,
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: mocks.getFirestoreMock,
}))

describe('app/lib/firebaseClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    process.env = { ...ORIGINAL_ENV }
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'api-key'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'auth-domain'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'project-id'
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'bucket'
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'sender-id'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'app-id'

    mocks.getAppsMock.mockReturnValue([]) // default: no apps exist
    mocks.initializeAppMock.mockReturnValue(mockFirebaseApp)
    mocks.getAppMock.mockReturnValue(mockFirebaseApp)

    mocks.getAuthMock.mockReturnValue(mockAuth)
    mocks.getFirestoreMock.mockReturnValue(mockDb)
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('initializes a new Firebase app when none exists', async () => {
    await import('@/app/lib/firebaseClient')

    expect(mocks.getAppsMock).toHaveBeenCalledTimes(1)
    expect(mocks.initializeAppMock).toHaveBeenCalledTimes(1)
    expect(mocks.getAppMock).not.toHaveBeenCalled()

    expect(mocks.initializeAppMock).toHaveBeenCalledWith({
      apiKey: 'api-key',
      authDomain: 'auth-domain',
      projectId: 'project-id',
      storageBucket: 'bucket',
      messagingSenderId: 'sender-id',
      appId: 'app-id',
    })

    expect(mocks.getAuthMock).toHaveBeenCalledWith(mockFirebaseApp)
    expect(mocks.getFirestoreMock).toHaveBeenCalledWith(mockFirebaseApp)
  })

  it('reuses an existing Firebase app when one already exists', async () => {
    mocks.getAppsMock.mockReturnValue([mockFirebaseApp])

    await import('@/app/lib/firebaseClient')

    expect(mocks.getAppsMock).toHaveBeenCalledTimes(1)
    expect(mocks.getAppMock).toHaveBeenCalledTimes(1)
    expect(mocks.initializeAppMock).not.toHaveBeenCalled()

    expect(mocks.getAuthMock).toHaveBeenCalledWith(mockFirebaseApp)
    expect(mocks.getFirestoreMock).toHaveBeenCalledWith(mockFirebaseApp)
  })

  it('exports firebaseAuth and firestore services', async () => {
    const mod = await import('@/app/lib/firebaseClient')

    expect(mod.firebaseAuth).toBe(mockAuth)
    expect(mod.firestore).toBe(mockDb)
  })
})
