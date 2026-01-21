import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const ORIGINAL_ENV = process.env

// Mocks/spies we assert against
const initializeAppMock = vi.fn()
const getAppMock = vi.fn()
let getAppsMock: ReturnType<typeof vi.fn>

const getAuthMock = vi.fn()
const getFirestoreMock = vi.fn()

// We’ll use sentinel objects to ensure exports are wired correctly
const mockFirebaseApp = { __app: true }
const mockAuth = { __auth: true }
const mockDb = { __firestore: true }

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: (cfg: any) => initializeAppMock(cfg),
  getApps: () => getAppsMock(),
  getApp: () => getAppMock(),
}))

// Mock firebase/auth + firestore
vi.mock('firebase/auth', () => ({
  getAuth: (app: any) => getAuthMock(app),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: (app: any) => getFirestoreMock(app),
}))

describe('app/lib/firebaseClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    process.env = { ...ORIGINAL_ENV }

    // set NEXT_PUBLIC env vars before importing module
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'api-key'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'auth-domain'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'project-id'
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'bucket'
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'sender-id'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'app-id'

    // default: no apps exist
    getAppsMock = vi.fn(() => [])

    // default mock returns
    initializeAppMock.mockReturnValue(mockFirebaseApp)
    getAppMock.mockReturnValue(mockFirebaseApp)

    getAuthMock.mockReturnValue(mockAuth)
    getFirestoreMock.mockReturnValue(mockDb)
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('initializes a new Firebase app when none exists', async () => {
    await import('@/app/lib/firebaseClient') // <-- ensure path matches your file

    expect(getAppsMock).toHaveBeenCalledTimes(1)
    expect(initializeAppMock).toHaveBeenCalledTimes(1)
    expect(getAppMock).not.toHaveBeenCalled()

    // Verify config came from env vars
    expect(initializeAppMock).toHaveBeenCalledWith({
      apiKey: 'api-key',
      authDomain: 'auth-domain',
      projectId: 'project-id',
      storageBucket: 'bucket',
      messagingSenderId: 'sender-id',
      appId: 'app-id',
    })

    // Verify services initialized with the app
    expect(getAuthMock).toHaveBeenCalledWith(mockFirebaseApp)
    expect(getFirestoreMock).toHaveBeenCalledWith(mockFirebaseApp)
  })

  it('reuses an existing Firebase app when one already exists', async () => {
    getAppsMock = vi.fn(() => [mockFirebaseApp]) // simulate existing app

    await import('@/app/lib/firebaseClient')

    expect(getAppsMock).toHaveBeenCalledTimes(1)
    expect(getAppMock).toHaveBeenCalledTimes(1)
    expect(initializeAppMock).not.toHaveBeenCalled()

    expect(getAuthMock).toHaveBeenCalledWith(mockFirebaseApp)
    expect(getFirestoreMock).toHaveBeenCalledWith(mockFirebaseApp)
  })

  it('exports firebaseAuth and firestore services', async () => {
    const mod = await import('@/app/lib/firebaseClient')

    expect(mod.firebaseAuth).toBe(mockAuth)
    expect(mod.firestore).toBe(mockDb)
  })
})
