import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { parseResumeFile } from '@/app/utils/resume/resumeTextExtractor'
import type { ParsedDate, ParsedExperience } from '@/app/utils/resume/resumeParser'

// Server-only API to parse a resume data URL into job history drafts.
// Node.js runtime is strictly required here because the underlying pdf-parse
// and Tesseract.js libraries rely on native Node APIs (Buffer, fs, etc.) that do not work on the Edge runtime.
export const runtime = 'nodejs'

// Limit resume uploads to 10MB to prevent abuse and excessive processing time.
// Base64-encoded data is ~33% larger than the raw file, so we enforce limits on both.
const MAX_RESUME_BYTES = 10 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil((MAX_RESUME_BYTES * 4) / 3)

type ResumeParseRequest = {
  resumeDataUrl?: string
  resumeFileName?: string
}

type JobHistoryDraft = {
  company: string
  location?: string
  title: string
  roleDescription: string
  startDate: string
  endDate?: string
  isCurrent: boolean
}

/**
 * Accepts a base64 data URL (or raw base64) and returns a Buffer + optional content type.
 * This is crucial for handling payloads sent via JSON rather than standard multipart file uploads.
 */
function decodeResumeData(resumeDataUrl: string): { buffer: Buffer; contentType?: string } {
  const trimmed = resumeDataUrl.trim()
  if (!trimmed) throw new Error('Empty resume data')

  // Extract the MIME type and the actual base64 string from the data URL format (e.g., "data:application/pdf;base64,JVBE...")
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/)

  // If it's a valid data URL, extract the content type and decode the base64 payload into a Node Buffer.
  // Otherwise, fallback to treating the entire string as raw base64.
  if (dataUrlMatch) {
    const [, contentType, base64Data] = dataUrlMatch
    return { buffer: Buffer.from(base64Data, 'base64'), contentType }
  }

  return { buffer: Buffer.from(trimmed, 'base64') }
}

/**
 * Converts parsed resume dates into strict 'yyyy-mm-dd' strings.
 * This specific format is required by HTML5 `<input type="date">` fields on the frontend.
 */
function formatDateForInput(date?: ParsedDate | null): string {
  if (!date) return ''
  // Current jobs don't have an end date, so we return an empty string to keep the input blank.
  if (date.isCurrent) return ''

  const year = String(date.year)
  // Pad single-digit months and days with a leading zero to ensure strict HTML5 compliance (e.g., '05' instead of '5')
  const month = String(date.month ?? 1).padStart(2, '0')
  const day = String(date.day ?? 1).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Maps a raw parsed experience block into a structured job history payload.
 * Trims whitespace, sanitizes empty fields, and formats dates for immediate frontend consumption.
 */
function mapExperienceToJobHistory(experience: ParsedExperience): JobHistoryDraft | null {
  const company = experience.company?.trim() || ''
  const location = experience.location?.trim() || ''
  const title = experience.title?.trim() || ''
  const roleDescription = experience.roleDescription?.trim() || ''

  const startDate = formatDateForInput(experience.dateRange?.start)
  const isCurrent = Boolean(experience.dateRange?.end?.isCurrent)
  const endDate = isCurrent ? '' : formatDateForInput(experience.dateRange?.end)

  // Validate that the block actually contains meaningful data before returning it.
  // If the parser accidentally grabbed an empty section or a header block, this drops it.
  const hasContent = [company, location, title, roleDescription, startDate, endDate].some(Boolean)
  if (!hasContent) return null

  return {
    company,
    ...(location ? { location } : {}),
    title,
    roleDescription,
    startDate,
    endDate: endDate || undefined,
    isCurrent,
  }
}

/**
 * Main POST handler to parse the resume on the server and return job history payloads for the client.
 */
export async function POST(request: Request) {
  // 1. Authenticate the request via Clerk
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Determine the request type (multipart/form-data vs application/json)
  // We support both to accommodate different frontend upload techniques (direct file vs base64).
  const contentTypeHeader = request.headers.get('content-type') || ''
  let buffer: Buffer
  let contentType: string | undefined
  let fileName: string | undefined

  // --- PATH A: Multipart Form Data (Standard File Upload) ---
  if (contentTypeHeader.includes('multipart/form-data')) {
    let formData: FormData

    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
    }

    // Validate the presence of the resume file and enforce size limits before memory-heavy processing.
    const resumeFile = formData.get('resume')
    if (!(resumeFile instanceof File)) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 })
    }

    if (resumeFile.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume exceeds 10MB limit' }, { status: 413 })
    }

    // Extract the file metadata. We use the provided 'resumeFileName' field if available,
    // otherwise we fall back to the uploaded file's native name.
    const resumeFileName = formData.get('resumeFileName')
    fileName =
      typeof resumeFileName === 'string' && resumeFileName.trim()
        ? resumeFileName.trim()
        : resumeFile.name
    contentType = resumeFile.type || undefined

    // Convert the Web File object to a Node Buffer for the PDF parser.
    buffer = Buffer.from(await resumeFile.arrayBuffer())

    // --- PATH B: JSON Data URL (Base64 Upload) ---
  } else {
    let body: ResumeParseRequest

    try {
      body = (await request.json()) as ResumeParseRequest
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!body.resumeDataUrl || typeof body.resumeDataUrl !== 'string') {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 })
    }

    const trimmed = body.resumeDataUrl.trim()
    const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/)
    const base64Payload = dataUrlMatch ? dataUrlMatch[2] : trimmed

    // Base64 payloads are ~33% larger than the raw file, so enforce limits early to prevent memory exhaustion.
    if (base64Payload.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Resume exceeds 10MB limit' }, { status: 413 })
    }

    // Decode the base64 data URL into a Buffer and extract content type metadata.
    try {
      const decoded = decodeResumeData(trimmed)
      buffer = decoded.buffer
      contentType = decoded.contentType
      fileName = body.resumeFileName
    } catch (error) {
      console.error('Resume decode error:', error)
      return NextResponse.json({ error: 'Invalid resume data' }, { status: 400 })
    }

    // Final safety check on the decoded buffer size.
    if (buffer.length > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume exceeds 10MB limit' }, { status: 413 })
    }
  }

  // 3. Prevent processing of completely empty files.
  if (!buffer.length) {
    return NextResponse.json({ error: 'Resume data is empty' }, { status: 400 })
  }

  // 4. Pass the prepared buffer to the extraction pipeline.
  try {
    const result = await parseResumeFile({
      data: buffer,
      fileName,
      contentType,
    })

    // Check for unsupported file types and return a 415 response.
    // This allows the frontend to differentiate between "no jobs found" and "bad file format".
    if (
      result.format === 'unknown' ||
      result.extractionWarnings.includes('unsupported-file-type')
    ) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF.' },
        { status: 415 }
      )
    }

    // 5. Serialize the backend parsed data into the frontend payload structure.
    // We filter out nulls to ensure the frontend only receives clean, non-empty job blocks.
    const jobHistory = result.experiences
      .map(mapExperienceToJobHistory)
      .filter((item): item is JobHistoryDraft => Boolean(item))

    return NextResponse.json({
      jobHistory,
      warnings: result.warnings,
      extractionWarnings: result.extractionWarnings,
      format: result.format,
    })
  } catch (error) {
    console.error('Resume parse error:', error)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
