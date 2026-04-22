import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { parseResumeFile } from '@/app/utils/resume/resumeTextExtractor'
import type { ParsedDate, ParsedExperience } from '@/app/utils/resume/resumeParser'

// Server-only API to parse a resume data URL into job history drafts.
export const runtime = 'nodejs'

const MAX_RESUME_BYTES = 10 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil((MAX_RESUME_BYTES * 4) / 3)

type ResumeParseRequest = {
  resumeDataUrl?: string
  resumeFileName?: string
}

type JobHistoryDraft = {
  company: string
  title: string
  roleDescription: string
  startDate: string
  endDate?: string
  isCurrent: boolean
}

// Accepts a base64 data URL (or raw base64) and returns a Buffer + optional content type.
function decodeResumeData(resumeDataUrl: string): { buffer: Buffer; contentType?: string } {
  const trimmed = resumeDataUrl.trim()
  if (!trimmed) throw new Error('Empty resume data')

  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/)
  if (dataUrlMatch) {
    const [, contentType, base64Data] = dataUrlMatch
    return { buffer: Buffer.from(base64Data, 'base64'), contentType }
  }

  return { buffer: Buffer.from(trimmed, 'base64') }
}

// Convert parsed resume dates into yyyy-mm-dd strings for date inputs.
function formatDateForInput(date?: ParsedDate | null): string {
  if (!date) return ''
  if (date.isCurrent) return ''

  const year = String(date.year)
  const month = String(date.month ?? 1).padStart(2, '0')
  const day = String(date.day ?? 1).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Map a parsed experience block into a job history draft entry.
function mapExperienceToJobHistory(experience: ParsedExperience): JobHistoryDraft | null {
  const company = experience.company?.trim() || ''
  const title = experience.title?.trim() || ''
  const roleDescription = experience.roleDescription?.trim() || ''

  const startDate = formatDateForInput(experience.dateRange?.start)
  const isCurrent = Boolean(experience.dateRange?.end?.isCurrent)
  const endDate = isCurrent ? '' : formatDateForInput(experience.dateRange?.end)

  const hasContent = [company, title, roleDescription, startDate, endDate].some(Boolean)
  if (!hasContent) return null

  return {
    company,
    title,
    roleDescription,
    startDate,
    endDate: endDate || undefined,
    isCurrent,
  }
}

// Parse the resume on the server and return job history drafts for the client.
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentTypeHeader = request.headers.get('content-type') || ''
  let buffer: Buffer
  let contentType: string | undefined
  let fileName: string | undefined

  if (contentTypeHeader.includes('multipart/form-data')) {
    let formData: FormData

    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
    }

    const resumeFile = formData.get('resume')
    if (!(resumeFile instanceof File)) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 })
    }

    if (resumeFile.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume exceeds 10MB limit' }, { status: 413 })
    }

    const resumeFileName = formData.get('resumeFileName')
    fileName =
      typeof resumeFileName === 'string' && resumeFileName.trim()
        ? resumeFileName.trim()
        : resumeFile.name
    contentType = resumeFile.type || undefined

    buffer = Buffer.from(await resumeFile.arrayBuffer())
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

    // Base64 payloads are ~33% larger than the raw file, so enforce limits early.
    if (base64Payload.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Resume exceeds 10MB limit' }, { status: 413 })
    }

    try {
      const decoded = decodeResumeData(trimmed)
      buffer = decoded.buffer
      contentType = decoded.contentType
      fileName = body.resumeFileName
    } catch (error) {
      console.error('Resume decode error:', error)
      return NextResponse.json({ error: 'Invalid resume data' }, { status: 400 })
    }

    if (buffer.length > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume exceeds 10MB limit' }, { status: 413 })
    }
  }

  if (!buffer.length) {
    return NextResponse.json({ error: 'Resume data is empty' }, { status: 400 })
  }

  try {
    const result = await parseResumeFile({
      data: buffer,
      fileName,
      contentType,
    })

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
