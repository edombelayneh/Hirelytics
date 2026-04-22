/// <reference types="vite/client" />

import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'mock-app' })),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: unknown) => void) => {
    callback(null)
    return () => {}
  }),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}))

type PageModule = { default?: unknown }

type PageImport = () => Promise<PageModule>

const pageModules = import.meta.glob('/app/**/page.tsx') as Record<string, PageImport>
const pageEntries = Object.entries(pageModules).sort(([a], [b]) => a.localeCompare(b))
const pageImportTimeoutMs = 15000

describe('page module compilation', () => {
  it('discovers page modules', () => {
    expect(pageEntries.length).toBeGreaterThan(0)
  })

  for (const [path, loadPage] of pageEntries) {
    it(
      `compiles ${path}`,
      async () => {
        const mod = await loadPage()
        expect(mod).toBeTruthy()
        expect('default' in mod).toBe(true)
      },
      pageImportTimeoutMs
    )
  }
})
