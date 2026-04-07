// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'fs/promises'
import path from 'path'

const mocks = vi.hoisted(() => {
  const pdfParseMock = vi.fn()

  return { pdfParseMock }
})

vi.mock('server-only', () => ({}))

async function loadExtractorWithPdfMock() {
  vi.resetModules()
  vi.doMock('pdf-parse', () => ({
    default: (input: Buffer) => mocks.pdfParseMock(input),
  }))

  return import('@/app/utils/resumeTextExtractor')
}

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

function normalizeResumeLine(value: string): string {
  return normalizeInlineText(value.replace(/^[\s\u2022\u00b7\-*]+/, ''))
}

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

function applyCurrentYear<
  T extends { dateRange?: { end?: { year?: number | null; isCurrent?: boolean } } },
>(experiences: T[], currentYear: number): T[] {
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
    vi.resetModules()
    vi.clearAllMocks()
    vi.doUnmock('pdf-parse')
  })

  it('detectResumeFormat prefers contentType over filename', async () => {
    const { detectResumeFormat } = await import('@/app/utils/resumeTextExtractor')

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

    expect(result.format).toBe('pdf')
    expect(result.warnings).toEqual([])
    expect(result.text).toBe(
      'Hello\n\nWorld\nThis line ensures the text length exceeds the OCR threshold for tests.'
    )
    expect(mocks.pdfParseMock).toHaveBeenCalledTimes(1)
  })

  it('extractResumeText reports unsupported DOCX files', async () => {
    const { extractResumeText } = await import('@/app/utils/resumeTextExtractor')

    const result = await extractResumeText({
      data: Buffer.from('docx-bytes'),
      fileName: 'resume.docx',
    })

    expect(result.format).toBe('unknown')
    expect(result.warnings).toContain('unsupported-file-type')
    expect(result.text).toBe('')
  })

  it('extractResumeText reports unsupported file types', async () => {
    const { extractResumeText } = await import('@/app/utils/resumeTextExtractor')

    const result = await extractResumeText({
      data: Buffer.from('txt-bytes'),
      fileName: 'resume.txt',
    })

    expect(result.format).toBe('unknown')
    expect(result.warnings).toContain('unsupported-file-type')
  })

  it('parses the uploaded sample PDF resume and matches expected text', async () => {
    vi.resetModules()
    vi.doUnmock('pdf-parse')
    const { parseResumeFile } = await import('@/app/utils/resumeTextExtractor')
    const currentYear = new Date().getFullYear()
    const basePath = path.resolve(process.cwd(), '__tests__', 'fixtures')
    // The text fixture validates raw OCR/extraction; the JSON fixture validates parsed experience fields.
    const expectedTextPath = path.join(basePath, 'sample_resume_expected.txt')
    const expectedJsonPath = path.join(basePath, 'sample_resume_expected.json')
    const samplePath = path.resolve(process.cwd(), 'app', 'utils', 'sample_resume.pdf')

    const [expectedText, expectedJson, pdfBuffer] = await Promise.all([
      readFile(expectedTextPath, 'utf8'),
      readFile(expectedJsonPath, 'utf8'),
      readFile(samplePath),
    ])

    const expectedExperiences = applyCurrentYear(
      JSON.parse(expectedJson) as Array<{
        dateRange?: { end?: { year?: number | null; isCurrent?: boolean } }
      }>,
      currentYear
    )

    const result = await parseResumeFile({
      data: pdfBuffer,
      fileName: 'sample_resume.pdf',
      contentType: 'application/pdf',
    })

    expect(result.format).toBe('pdf')
    expect(result.extractionWarnings).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.text.length).toBeGreaterThan(50)
    expect(result.experiences.map(normalizeExperience)).toEqual(
      expectedExperiences.map(normalizeExperience)
    )
    expect(normalizeInlineText(result.text)).toContain(normalizeInlineText(expectedText))
  }, 30000)
})
