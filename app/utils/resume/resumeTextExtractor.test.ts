// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'fs/promises'
import path from 'path'

// Hoist the mock declarations so they are initialized before imports are evaluated.
// We mock pdf-parse to avoid running actual OCR/PDF extraction in isolated unit tests.
const mocks = vi.hoisted(() => {
  const pdfParseMock = vi.fn()

  return { pdfParseMock }
})

// Defines the expected structure of the JSON test fixture.
type ExpectedExperience = {
  company: string
  title: string
  roleDescription: string
  rawLines: string[]
  dateRange?: {
    raw: string
    start: {
      year: number | null
      month?: number
      day?: number
      raw: string
      isCurrent?: boolean
    } | null
    end: {
      year: number | null
      month?: number
      day?: number
      raw: string
      isCurrent?: boolean
    } | null
  }
}

// Mock 'server-only' to allow testing server utilities in the test environment.
vi.mock('server-only', () => ({}))

/**
 * Dynamically loads the resume extractor while injecting the pdf-parse mock.
 * We use dynamic imports to ensure the mock is applied cleanly per-test.
 */
async function loadExtractorWithPdfMock() {
  vi.resetModules()
  vi.doMock('pdf-parse', () => ({
    default: (input: Buffer) => mocks.pdfParseMock(input),
  }))

  return import('@/app/utils/resume/resumeTextExtractor')
}

/**
 * Normalizes large blocks of resume text for assertions.
 * Strips out null bytes, standardizes dashes/quotes, and normalizes line breaks.
 */
function normalizeResumeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .split('\n')
    .map((line) => normalizeResumeLine(line))
    .filter(Boolean)
    .join('\n')
}

/**
 * Normalizes single lines of text (e.g., titles, companies) by condensing whitespace.
 */
function normalizeInlineText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Cleans up individual lines from bullet points and leading artifacts.
 */
function normalizeResumeLine(value: string): string {
  return normalizeInlineText(value.replace(/^[\s\u2022\u00b7\-*]+/, ''))
}

/**
 * Normalizes all string fields within a parsed experience object.
 * This ensures tests don't fail due to minor spacing or encoding differences across platforms.
 */
function normalizeExperience<
  T extends {
    company: string
    title: string
    roleDescription: string
    rawLines: string[]
    dateRange?: {
      raw: string
      start: {
        year: number | null
        month?: number
        day?: number
        raw: string
        isCurrent?: boolean
      } | null
      end: {
        year: number | null
        month?: number
        day?: number
        raw: string
        isCurrent?: boolean
      } | null
    }
  },
>(experience: T) {
  return {
    ...experience,
    company: normalizeInlineText(experience.company),
    title: normalizeInlineText(experience.title),
    roleDescription: normalizeResumeText(experience.roleDescription),
    rawLines: experience.rawLines.map((line) => normalizeResumeLine(line)).filter(Boolean),
    dateRange: experience.dateRange
      ? {
          ...experience.dateRange,
          raw: normalizeInlineText(experience.dateRange.raw),
          start: experience.dateRange.start
            ? {
                ...experience.dateRange.start,
                raw: normalizeInlineText(experience.dateRange.start.raw),
              }
            : null,
          end: experience.dateRange.end
            ? {
                ...experience.dateRange.end,
                raw: normalizeInlineText(experience.dateRange.end.raw),
              }
            : null,
        }
      : undefined,
  }
}

type ExperienceWithCurrentEnd = {
  dateRange?: {
    end?: {
      year?: number | null
      isCurrent?: boolean
    } | null
  } | null
}

/**
 * Injects the dynamic current year into expected JSON fixtures for "Present" jobs.
 * This prevents the fixture tests from failing when the actual calendar year rolls over.
 */
function applyCurrentYear<T extends ExperienceWithCurrentEnd>(
  experiences: T[],
  currentYear: number
): T[] {
  return experiences.map((experience) => {
    const end = experience.dateRange?.end
    if (!end || !end.isCurrent || end.year !== null) return experience

    return {
      ...experience,
      dateRange: {
        ...experience.dateRange,
        end: {
          ...end,
          year: currentYear,
        },
      },
    }
  })
}

describe('app/utils/resumeTextExtractor', () => {
  beforeEach(() => {
    // Reset module cache and clear mocks before each test to ensure isolated state.
    vi.resetModules()
    vi.clearAllMocks()
    vi.doUnmock('pdf-parse')
  })

  it('detectResumeFormat prefers contentType over filename', async () => {
    const { detectResumeFormat } = await import('@/app/utils/resume/resumeTextExtractor')

    // Validates that explicit MIME types override potentially mismatched file extensions.
    expect(detectResumeFormat({ contentType: 'application/pdf', fileName: 'resume.docx' })).toBe(
      'pdf'
    )
    expect(
      detectResumeFormat({
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    ).toBe('unknown')
  })

  it('extractResumeText parses PDF buffers and normalizes text', async () => {
    // Setup mock to return standard text with artifacts to verify normalization.
    mocks.pdfParseMock.mockResolvedValue({
      text: [
        'Hello\u0000',
        '',
        'World',
        'This line ensures the text length exceeds the OCR threshold for tests.',
      ].join('\n'),
    })

    const { extractResumeText } = await loadExtractorWithPdfMock()

    const result = await extractResumeText({
      data: Buffer.from('pdf-bytes'),
      fileName: 'resume.pdf',
      contentType: 'application/pdf',
    })

    // Expect null bytes removed and double line breaks preserved where appropriate.
    expect(result.format).toBe('pdf')
    expect(result.warnings).toEqual([])
    expect(result.text).toBe(
      'Hello\n\nWorld\nThis line ensures the text length exceeds the OCR threshold for tests.'
    )
    expect(mocks.pdfParseMock).toHaveBeenCalledTimes(1)
  })

  it('extractResumeText reports unsupported DOCX files', async () => {
    const { extractResumeText } = await import('@/app/utils/resume/resumeTextExtractor')

    const result = await extractResumeText({
      data: Buffer.from('docx-bytes'),
      fileName: 'resume.docx',
    })

    // Currently only PDF is supported; DOCX should gracefully fallback to 'unknown'.
    expect(result.format).toBe('unknown')
    expect(result.warnings).toContain('unsupported-file-type')
    expect(result.text).toBe('')
  })

  it('extractResumeText reports unsupported file types', async () => {
    const { extractResumeText } = await import('@/app/utils/resume/resumeTextExtractor')

    const result = await extractResumeText({
      data: Buffer.from('txt-bytes'),
      fileName: 'resume.txt',
    })

    expect(result.format).toBe('unknown')
    expect(result.warnings).toContain('unsupported-file-type')
  })

  it('parses the uploaded sample PDF resume and matches expected text', async () => {
    // Unmock to test the actual pdf-parse engine and integration flow against real files.
    vi.resetModules()
    vi.doUnmock('pdf-parse')
    const { parseResumeFile } = await import('@/app/utils/resume/resumeTextExtractor')
    const currentYear = new Date().getFullYear()
    const basePath = path.resolve(process.cwd(), '__tests__', 'fixtures')

    // The text fixture validates raw OCR/extraction; the JSON fixture validates parsed experience fields.
    const expectedTextPath = path.join(basePath, 'sample_resume_expected.txt')
    const expectedJsonPath = path.join(basePath, 'sample_resume_expected.json')
    const samplePath = path.resolve(process.cwd(), '__tests__', 'fixtures', 'sample_resume.pdf')

    const [expectedText, expectedJson, pdfBuffer] = await Promise.all([
      readFile(expectedTextPath, 'utf8'),
      readFile(expectedJsonPath, 'utf8'),
      readFile(samplePath),
    ])

    const expectedExperiences = applyCurrentYear(
      JSON.parse(expectedJson) as ExpectedExperience[],
      currentYear
    )

    const result = await parseResumeFile({
      data: pdfBuffer,
      fileName: 'sample_resume.pdf',
      contentType: 'application/pdf',
    })

    // Validate high-level integration points
    expect(result.format).toBe('pdf')
    expect(result.extractionWarnings).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.text.length).toBeGreaterThan(50)

    // Validate that the extracted fields match our expected snapshot (normalized)
    expect(result.experiences.map(normalizeExperience)).toEqual(
      expectedExperiences.map(normalizeExperience)
    )

    // Validate raw text extraction string matches expected text
    expect(normalizeInlineText(result.text)).toContain(normalizeInlineText(expectedText))
  }, 30000)

  it('correctly parses complex company and location formats', async () => {
    const { parseResumeTextToExperiences } = await import('@/app/utils/resume/resumeParser')

    // Put dates on the same line as the header so the parser's block splitter recognizes them as header boundaries
    // This simulates text extracted from a typical resume format.
    const mockResumeText = `
Experience

Software Engineer | Auto Owners Insurance, Grand Rapids, MI   Jan 2020 - Present
• Did some coding

Frontend Developer | Corewell Health, Grand Rapids, Michigan   Jan 2018 - Jan 2020
• Did some frontend work

Backend Developer | Startup Inc., San Francisco, CA   Jan 2016 - Jan 2018
• Did some backend work

Remote Dev | Global Tech, Remote   Jan 2014 - Jan 2016
• Did remote work
    `

    const result = parseResumeTextToExperiences(mockResumeText)

    // Ensures block splitting correctly identified all 4 roles
    expect(result.experiences).toHaveLength(4)

    // Test 1: Standard 2-letter abbreviation with comma
    expect(result.experiences[0].company).toBe('Auto Owners Insurance')
    expect(result.experiences[0].location).toBe('Grand Rapids, MI')

    // Test 2: Full spelled-out state name
    expect(result.experiences[1].company).toBe('Corewell Health')
    expect(result.experiences[1].location).toBe('Grand Rapids, Michigan')

    // Test 3: Ignores corporate suffixes like 'Inc.' when determining the location string
    expect(result.experiences[2].company).toBe('Startup Inc.')
    expect(result.experiences[2].location).toBe('San Francisco, CA')

    // Test 4: Handles 'Remote' location indicator gracefully
    expect(result.experiences[3].company).toBe('Global Tech')
    expect(result.experiences[3].location).toBe('Remote')
  })
})
