import 'server-only'

import pdfParse from 'pdf-parse'
import type { ResumeParseResult, ResumeParserOptions } from './resumeParser'
import { parseResumeTextToExperiences } from './resumeParser'

export type ResumeFileFormat = 'pdf' | 'unknown'

export type ResumeTextExtractionWarning = 'unsupported-file-type' | 'empty-text' | 'ocr-failed'

export type ResumeFileInput = {
  data: Buffer | ArrayBuffer | Uint8Array
  fileName?: string
  contentType?: string
}

export type ResumeTextExtractionResult = {
  text: string
  warnings: ResumeTextExtractionWarning[]
  format: ResumeFileFormat
}

const OCR_MIN_TEXT_LENGTH = 80
const OCR_MIN_ALPHA_CHARS = 20
const OCR_SCALE = 2
const OCR_MAX_PAGES = 3
const OCR_LANGUAGE = 'eng'

export type ResumeFileParseResult = ResumeParseResult & {
  text: string
  format: ResumeFileFormat
  extractionWarnings: ResumeTextExtractionWarning[]
}

function toBuffer(data: ResumeFileInput['data']): Buffer {
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) return Buffer.from(data)
  return Buffer.from(new Uint8Array(data))
}

// Normalize common extraction artifacts (null bytes, non-breaking spaces, excessive newlines).
function normalizeExtractedText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function shouldRunOcr(text: string): boolean {
  if (!text) return true
  if (text.length < OCR_MIN_TEXT_LENGTH) return true
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length
  return alphaCount < OCR_MIN_ALPHA_CHARS
}

type OcrWorker = {
  load?: () => Promise<void>
  loadLanguage?: (lang: string) => Promise<void>
  initialize?: (lang: string) => Promise<void>
  recognize: (image: Buffer) => Promise<{ data?: { text?: string } }>
  terminate: () => Promise<void>
}

type PdfJsViewport = { width: number; height: number }

type PdfJsPage = {
  getViewport: (options: { scale: number }) => PdfJsViewport
  render: (options: { canvasContext: unknown; viewport: PdfJsViewport }) => {
    promise: Promise<void>
  }
  cleanup?: () => void
}

type PdfJsDocument = {
  numPages: number
  getPage: (pageNumber: number) => Promise<PdfJsPage>
}

async function extractPdfTextWithOcr(buffer: Buffer): Promise<string> {
  const [{ createWorker }, pdfjs, canvasModule] = await Promise.all([
    import('tesseract.js'),
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('@napi-rs/canvas'),
  ])

  const { createCanvas } = canvasModule as typeof import('@napi-rs/canvas')
  const { getDocument } = pdfjs as unknown as {
    getDocument: (src: { data: Uint8Array; disableWorker?: boolean }) => {
      promise: Promise<PdfJsDocument>
    }
  }

  const worker = (await createWorker()) as OcrWorker
  try {
    if (worker.load) await worker.load()
    if (worker.loadLanguage) await worker.loadLanguage(OCR_LANGUAGE)
    if (worker.initialize) await worker.initialize(OCR_LANGUAGE)

    const loadingTask = getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    const pdf = await loadingTask.promise
    const pageCount = Math.min(pdf.numPages || 1, OCR_MAX_PAGES)
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: OCR_SCALE })
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      const context = canvas.getContext('2d')

      await page.render({ canvasContext: context, viewport }).promise

      const image = canvas.toBuffer('image/png')
      const result = await worker.recognize(image)
      const text = result.data?.text || ''
      if (text) pages.push(text)

      if (page.cleanup) page.cleanup()
    }

    return pages.join('\n')
  } finally {
    await worker.terminate()
  }
}

function detectFormatFromContentType(contentType?: string): ResumeFileFormat {
  if (!contentType) return 'unknown'
  const lower = contentType.toLowerCase()
  if (lower.includes('pdf')) return 'pdf'
  return 'unknown'
}

function detectFormatFromFileName(fileName?: string): ResumeFileFormat {
  if (!fileName) return 'unknown'
  const lower = fileName.toLowerCase().trim()
  if (lower.endsWith('.pdf')) return 'pdf'
  return 'unknown'
}

export function detectResumeFormat(input: Pick<ResumeFileInput, 'fileName' | 'contentType'>) {
  const fromType = detectFormatFromContentType(input.contentType)
  if (fromType !== 'unknown') return fromType
  return detectFormatFromFileName(input.fileName)
}

export async function extractResumeText(
  input: ResumeFileInput
): Promise<ResumeTextExtractionResult> {
  const format = detectResumeFormat(input)
  const warnings: ResumeTextExtractionWarning[] = []
  const buffer = toBuffer(input.data)
  let rawText = ''

  switch (format) {
    case 'pdf': {
      const parsed = await pdfParse(buffer)
      rawText = parsed.text || ''
      break
    }
    default:
      warnings.push('unsupported-file-type')
  }

  let text = normalizeExtractedText(rawText)

  const shouldOcrFallback = format === 'pdf' && shouldRunOcr(text)

  // Only run OCR when standard extraction is likely incomplete.
  if (shouldOcrFallback) {
    try {
      const ocrText = await extractPdfTextWithOcr(buffer)
      const normalizedOcr = normalizeExtractedText(ocrText)
      if (normalizedOcr) {
        text = normalizedOcr
      } else {
        warnings.push('ocr-failed')
      }
    } catch {
      warnings.push('ocr-failed')
    }
  }

  if (!text && warnings.length === 0) {
    warnings.push('empty-text')
  }

  return { text, warnings, format }
}

export async function parseResumeFile(
  input: ResumeFileInput,
  options: ResumeParserOptions = {}
): Promise<ResumeFileParseResult> {
  const extraction = await extractResumeText(input)
  const parsed = parseResumeTextToExperiences(extraction.text, options)

  return {
    ...parsed,
    text: extraction.text,
    format: extraction.format,
    extractionWarnings: extraction.warnings,
  }
}
