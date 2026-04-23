import type { JobHistoryItem as AppJobHistoryItem } from '../jobHistory'

// Parsing warnings are surfaced to callers to explain partial matches.
type ParseWarning =
  | 'experience-section-not-found'
  | 'experience-section-empty'
  | 'no-experience-blocks'

export type ParsedDate = {
  year: number
  month?: number
  day?: number
  raw: string
  isCurrent?: boolean
}

export type ParsedDateRange = {
  start: ParsedDate | null
  end: ParsedDate | null
  raw: string
}

export type ParsedExperience = {
  company: string
  location?: string
  title: string
  roleDescription: string
  dateRange?: ParsedDateRange
  rawLines: string[]
}

// High-level parse result with the detected experience section and warnings.
export type ResumeParseResult = {
  experiences: ParsedExperience[]
  experienceSection: string
  warnings: ParseWarning[]
}

export type ResumeParserOptions = {
  sectionHeadings?: string[]
  stopHeadings?: string[]
  maxExperienceItems?: number
}

export type JobHistoryItem = AppJobHistoryItem

export type JobHistoryMapOptions = {
  dateFormat?: 'yyyy-mm' | 'yyyy-mm-dd' | 'raw'
  currentLabel?: string
  idFactory?: () => string
  mapExperience?: (
    experience: ParsedExperience,
    helpers: DateFormatHelpers
  ) => JobHistoryItem | null
}

export type JobHistoryMergeOptions = {
  strategy?: 'fill-empty' | 'replace'
  matchBy?: 'id' | 'company-title-date'
}

type DateFormatHelpers = {
  formatDateRange: (range?: ParsedDateRange) => { startDate: string; endDate: string }
  formatDate: (date: ParsedDate | null | undefined) => string
}

// Headings used to locate the experience section in free-form resume text.
const DEFAULT_EXPERIENCE_HEADINGS = [
  'experience',
  'work experience',
  'professional experience',
  'employment',
  'career history',
  'work history',
]

// Headings that typically end the experience section.
const DEFAULT_STOP_HEADINGS = [
  'education',
  'skills',
  'projects',
  'certifications',
  'summary',
  'objective',
  'awards',
  'publications',
  'volunteer',
  'interests',
]

const NOISE_HEADING_VALUES = [
  ...DEFAULT_EXPERIENCE_HEADINGS,
  ...DEFAULT_STOP_HEADINGS,
  'technical',
  'technical skills',
  'core competencies',
  'competencies',
  'qualifications',
  'highlights',
  'profile',
  'summary',
]

// Heuristic keywords to distinguish titles and companies in mixed header lines.
const TITLE_KEYWORDS = [
  'engineer',
  'developer',
  'designer',
  'manager',
  'lead',
  'director',
  'analyst',
  'consultant',
  'specialist',
  'architect',
  'scientist',
  'coordinator',
  'technician',
  'administrator',
  'associate',
  'principal',
  'product',
  'program',
  'marketing',
  'sales',
  'operations',
  'finance',
  'hr',
  'recruiter',
  'intern',
  'officer',
]

const COMPANY_KEYWORDS = [
  'inc',
  'llc',
  'ltd',
  'corp',
  'company',
  'co',
  'plc',
  'gmbh',
  'university',
  'college',
  'school',
  'labs',
  'technologies',
  'technology',
  'systems',
  'group',
  'agency',
  'studios',
]

// Date parsing supports month names, numeric dates, year-only, and "Present".
const MONTH_PATTERN =
  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'

const MONTH_YEAR_TOKEN = `(?:${MONTH_PATTERN})\\s+\\d{4}`
const NUMERIC_MONTH_YEAR_TOKEN = '\\b(?:0?[1-9]|1[0-2])[\\/.-]\\d{4}\\b'
const YEAR_TOKEN = '\\b(?:19|20)\\d{2}\\b'
const CURRENT_TOKEN = '\\b(?:present|current)\\b'

// Accepts "Jan 2020 - Present", "01/2020 - 12/2021", or "2020 - 2021".
const DATE_RANGE_REGEX = new RegExp(
  `(${MONTH_YEAR_TOKEN}|${NUMERIC_MONTH_YEAR_TOKEN}|${YEAR_TOKEN})\\s*(?:-|to|through|until|\\u2013|\\u2014)\\s*(${MONTH_YEAR_TOKEN}|${NUMERIC_MONTH_YEAR_TOKEN}|${YEAR_TOKEN}|${CURRENT_TOKEN})`,
  'i'
)

// Token scan used when a full range pattern is not present.
const DATE_TOKEN_REGEX = new RegExp(
  `(${MONTH_YEAR_TOKEN}|${NUMERIC_MONTH_YEAR_TOKEN}|${YEAR_TOKEN}|${CURRENT_TOKEN})`,
  'gi'
)

const DATE_TOKEN_TEST_REGEX = new RegExp(
  `(${MONTH_YEAR_TOKEN}|${NUMERIC_MONTH_YEAR_TOKEN}|${YEAR_TOKEN}|${CURRENT_TOKEN})`,
  'i'
)

const MONTH_NAME_REGEX = new RegExp(`\\b(${MONTH_PATTERN})\\b`, 'i')

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

// Normalize newlines and whitespace to stabilize parsing.
function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Normalize headings for case and punctuation-insensitive matching.
function normalizeHeading(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '')
}

const NOISE_HEADING_SET = new Set(NOISE_HEADING_VALUES.map((value) => normalizeHeading(value)))

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findInlineHeadingMatch(line: string, headings: string[]): { remainder: string } | null {
  const lower = line.toLowerCase()

  for (const heading of headings) {
    const pattern = new RegExp(`\\b${escapeRegex(heading).replace(/\\s+/g, '\\s*')}\\b`, 'i')
    if (pattern.test(lower)) {
      const remainder = line.replace(pattern, '').trim()
      return { remainder }
    }
  }

  return null
}

function toHeadingSet(values: string[]): Set<string> {
  return new Set(values.map((item) => normalizeHeading(item)))
}

function isNoiseHeadingLine(line: string): boolean {
  const normalized = normalizeHeading(line)
  if (!normalized) return false
  return NOISE_HEADING_SET.has(normalized)
}

function isHeadingLine(line: string, headingSet: Set<string>): boolean {
  // Uses a short-line heuristic to avoid treating sentences as headings.
  const normalized = normalizeHeading(line)
  if (!normalized) return false
  if (headingSet.has(normalized)) return true

  const shortLine = line.trim().length <= 40
  const wordCount = line.trim().split(/\s+/).length
  if (!shortLine || wordCount > 4) return false

  for (const heading of headingSet) {
    if (normalized === heading) return true
  }

  return false
}

function isInlineHeadingLine(line: string, headings: string[]): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  const wordCount = trimmed.split(/\s+/).length
  if (trimmed.length > 200 || wordCount > 12) return false

  const normalizedLine = normalizeHeading(trimmed)
  for (const heading of headings) {
    const normalizedHeading = normalizeHeading(heading)
    if (!normalizedHeading) continue
    if (normalizedLine.includes(normalizedHeading)) return true
  }

  return Boolean(findInlineHeadingMatch(trimmed, headings))
}

// Returns the lines of the experience section based on heading boundaries.
function extractExperienceSection(
  text: string,
  headings: string[],
  stopHeadings: string[]
): { lines: string[]; warnings: ParseWarning[] } {
  // Locate the experience block using heading boundaries.
  const warnings: ParseWarning[] = []
  const cleaned = normalizeText(text)
  const lines = cleaned.split('\n')
  const headingSet = toHeadingSet(headings)
  const stopSet = toHeadingSet(stopHeadings)

  let startIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (isHeadingLine(lines[i], headingSet)) {
      startIndex = i + 1
      break
    }

    const wordCount = lines[i].trim().split(/\s+/).length
    if (lines[i].length <= 60 && wordCount <= 6) {
      const inlineHeading = findInlineHeadingMatch(lines[i], headings)
      if (inlineHeading) {
        lines[i] = inlineHeading.remainder
        startIndex = inlineHeading.remainder ? i : i + 1
        break
      }
    }
  }

  if (startIndex === -1) {
    warnings.push('experience-section-not-found')

    for (let i = 0; i < lines.length; i += 1) {
      if (isExperienceHeaderLine(lines[i])) {
        startIndex = i
        break
      }
    }

    if (startIndex === -1) {
      return { lines, warnings }
    }
  }

  let endIndex = lines.length
  for (let i = startIndex; i < lines.length; i += 1) {
    if (isHeadingLine(lines[i], stopSet) || isInlineHeadingLine(lines[i], stopHeadings)) {
      endIndex = i
      break
    }
  }

  const sectionLines = lines.slice(startIndex, endIndex)
  if (sectionLines.every((line) => !line.trim())) {
    warnings.push('experience-section-empty')
  }

  return { lines: sectionLines, warnings }
}

// Paragraphs are separated by blank lines in most resume extracts.
function splitIntoParagraphs(lines: string[]): string[][] {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (current.length) {
        blocks.push(current)
        current = []
      }
      continue
    }
    current.push(trimmed)
  }

  if (current.length) {
    blocks.push(current)
  }

  return blocks
}

// Detect header lines that likely represent a job entry (title/company + dates).
function isExperienceHeaderLine(line: string): boolean {
  if (!hasDateTokens(line)) return false

  const cleaned = normalizeToken(removeDateTokens(line))
  if (!cleaned) return false

  if (looksLikeTitle(cleaned) || looksLikeCompany(cleaned)) return true

  const wordCount = cleaned.split(/\s+/).length
  const reasonableLength = cleaned.length <= 120 && wordCount <= 12
  const hasDivider = /(\s-\s|\s\u2013\s|\s\u2014\s|\||@)/.test(cleaned)
  const hasComma = cleaned.includes(',')

  return reasonableLength && (hasDivider || hasComma)
}

// Split the section into job blocks when each entry starts with a header line.
function splitByExperienceHeaders(lines: string[], stopHeadings: string[] = []): string[][] {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (stopHeadings.length > 0 && isInlineHeadingLine(trimmed, stopHeadings)) {
      if (current.length) blocks.push(current)
      break
    }

    if (isExperienceHeaderLine(trimmed) && current.length) {
      const currentHasDate = current.some((line) => hasDateTokens(line))
      const currentIsShort = current.length <= 2 && !currentHasDate

      if (!currentIsShort) {
        blocks.push(current)
        current = []
      }
    }

    current.push(trimmed)
  }

  if (current.length) {
    blocks.push(current)
  }

  return blocks
}

function stripBullet(line: string): string {
  return line.replace(/^[\s\u2022\u00b7\-*]+/, '').trim()
}

function looksLikeExperienceBlock(lines: string[]): boolean {
  // Use date tokens as the strongest signal of a job entry.
  const text = lines.join(' ')
  if (DATE_RANGE_REGEX.test(text)) return true
  const tokens = text.match(DATE_TOKEN_REGEX) || []
  return tokens.length >= 2
}

// Accepts month names like "Jan" or "January" and returns a month index.
function parseMonth(token: string): number | undefined {
  const match = token.toLowerCase().match(MONTH_NAME_REGEX)
  if (!match) return undefined
  return MONTH_INDEX[match[1]]
}

// Supports month+year, numeric month/year, year-only, and "Present" tokens.
function parseDateToken(token: string): ParsedDate | null {
  const trimmed = token.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (/(present|current)/i.test(lower)) {
    return { year: new Date().getFullYear(), raw: trimmed, isCurrent: true }
  }

  const numeric = trimmed.match(/(0?[1-9]|1[0-2])[\/.\-](\d{4})/)
  if (numeric) {
    return {
      year: Number(numeric[2]),
      month: Number(numeric[1]),
      raw: trimmed,
    }
  }

  const month = parseMonth(trimmed)
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/)
  if (month && yearMatch) {
    return {
      year: Number(yearMatch[0]),
      month,
      raw: trimmed,
    }
  }

  if (yearMatch) {
    return {
      year: Number(yearMatch[0]),
      raw: trimmed,
    }
  }

  return null
}

// Prefer explicit ranges, fall back to first/last date tokens.
function extractDateRange(text: string): ParsedDateRange | null {
  const match = text.match(DATE_RANGE_REGEX)
  if (match) {
    const start = parseDateToken(match[1])
    const end = parseDateToken(match[2])
    return {
      start,
      end,
      raw: match[0],
    }
  }

  const tokens = Array.from(text.matchAll(DATE_TOKEN_REGEX)).map((item) => item[0])
  if (tokens.length >= 2) {
    const start = parseDateToken(tokens[0])
    const end = parseDateToken(tokens[tokens.length - 1])
    return {
      start,
      end,
      raw: `${tokens[0]} - ${tokens[tokens.length - 1]}`,
    }
  }

  return null
}

function removeDateTokens(value: string): string {
  return value.replace(DATE_RANGE_REGEX, '').replace(DATE_TOKEN_TEST_REGEX, '').trim()
}

// True when the line is mostly dates or date ranges.
function isDateLine(line: string): boolean {
  if (!DATE_TOKEN_TEST_REGEX.test(line)) return false
  const cleaned = removeDateTokens(line)
    .replace(/[^a-z0-9]/gi, '')
    .trim()
  return cleaned.length === 0
}

function hasDateTokens(line: string): boolean {
  return DATE_TOKEN_TEST_REGEX.test(line)
}

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function looksLikeTitle(value: string): boolean {
  const lower = value.toLowerCase()
  return TITLE_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function looksLikeCompany(value: string): boolean {
  const lower = value.toLowerCase()
  return COMPANY_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function looksLikeLocation(value: string): boolean {
  const cleaned = normalizeToken(removeDateTokens(value))
  if (!cleaned) return false
  if (/\bremote\b/i.test(cleaned)) return true
  return /,\s*[A-Z]{2}\b/.test(cleaned)
}

// Handles headers like "Title | Company" or "Company - Title".
// Extract company and location from a single line if they're separated by comma or pipe
// e.g., "Acme Corp, San Francisco, CA" or "Acme Corp | San Francisco, CA"
// -> { company: "Acme Corp", location: "San Francisco, CA" }
function extractCompanyAndLocation(text: string): {
  company: string
  location?: string
} {
  const text_trimmed = text.trim()
  if (!text_trimmed) return { company: '' }

  // First try to split by pipe (|) delimiter
  const pipeIndex = text_trimmed.indexOf('|')
  if (pipeIndex !== -1) {
    const beforePipe = text_trimmed.substring(0, pipeIndex).trim()
    const afterPipe = text_trimmed.substring(pipeIndex + 1).trim()

    // Check if the part after the pipe looks like a location
    if (looksLikeLocation(afterPipe)) {
      return {
        company: beforePipe,
        location: afterPipe,
      }
    }
  }

  // For comma-separated format: look for a comma where the remaining part looks like a location
  // e.g., "Company Name, City, State" should split to "Company Name" | "City, State"
  const commas = []
  let idx = 0
  while ((idx = text_trimmed.indexOf(',', idx)) !== -1) {
    commas.push(idx)
    idx++
  }

  // Try each comma from right to left (prefer rightmost valid split)
  for (let i = commas.length - 2; i >= 0; i--) {
    const commaIdx = commas[i]
    const beforeComma = text_trimmed.substring(0, commaIdx).trim()
    const afterComma = text_trimmed.substring(commaIdx + 1).trim()

    // Check if the part after this comma looks like a location
    if (looksLikeLocation(afterComma)) {
      return {
        company: beforeComma,
        location: afterComma,
      }
    }
  }

  // If neither delimiter found or part after delimiter doesn't look like location, return whole thing as company
  return { company: text_trimmed }
}

// Parse "Title | Company" or "Company - Title" headers into structured fields.
function parseHeaderLine(
  line: string
): { company: string; location?: string; title: string } | null {
  const cleaned = removeDateTokens(line)
  if (!cleaned) return null

  const parts = cleaned
    .split(/\s*(?:\||@|\s-\s|\s\u2013\s|\s\u2014\s)\s*/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) return null

  const left = parts[0]
  const right = parts[1]
  const third = parts[2]

  const leftTitle = looksLikeTitle(left)
  const rightTitle = looksLikeTitle(right)
  const leftCompany = looksLikeCompany(left)
  const rightCompany = looksLikeCompany(right)
  const leftLocation = looksLikeLocation(left)
  const rightLocation = looksLikeLocation(right)
  const thirdLocation = third ? looksLikeLocation(third) : false

  // Handle case with all three parts: Title | Company | Location
  if (parts.length >= 3 && thirdLocation) {
    if (leftTitle && rightCompany) {
      return { title: left, company: right, location: third }
    }
    if (rightTitle && leftCompany) {
      return { title: right, company: left, location: third }
    }
  }

  if (leftTitle && !rightTitle) {
    if (!rightCompany && !rightLocation && !leftCompany) return null
    const companyLocation = extractCompanyAndLocation(right)
    return { title: left, ...companyLocation }
  }

  if (rightTitle && !leftTitle) {
    if (!leftCompany && !leftLocation && !rightCompany) return null
    const companyLocation = extractCompanyAndLocation(left)
    return { title: right, ...companyLocation }
  }

  if (rightCompany && !leftCompany) {
    const companyLocation = extractCompanyAndLocation(right)
    return { title: left, ...companyLocation }
  }

  if (leftCompany && !rightCompany) {
    const companyLocation = extractCompanyAndLocation(left)
    return { title: right, ...companyLocation }
  }

  const companyLocation = extractCompanyAndLocation(right)
  return { title: left, ...companyLocation }
}

// Uses the header line first, otherwise treats the first two lines as company/title.
// Extract company, location, and title, prioritizing header lines and fallback heuristics.
function extractCompanyTitle(lines: string[]): {
  company: string
  location?: string
  title: string
  consumedLines: number
} {
  const indexedLines = lines.map((line, index) => ({
    line,
    index,
    cleaned: normalizeToken(removeDateTokens(line)),
  }))
  const usableLines = indexedLines.filter(
    ({ line }) => !isDateLine(line) && !isNoiseHeadingLine(line)
  )
  const line1 = usableLines[0]
  const line2 = usableLines[1]
  const line3 = usableLines[2]
  const cleanedLine1 = line1?.cleaned || ''
  const cleanedLine2 = line2?.cleaned || ''
  const cleanedLine3 = line3?.cleaned || ''

  const consumedCount = (...used: Array<typeof line1 | undefined>): number => {
    const indices = used
      .filter((item): item is NonNullable<typeof line1> => Boolean(item))
      .map((item) => item.index)

    return indices.length ? Math.max(...indices) + 1 : 0
  }

  const parsed = line1?.line ? parseHeaderLine(line1.line) : null
  if (parsed) {
    return { ...parsed, consumedLines: consumedCount(line1) }
  }

  if (line1 && line2 && line3 && looksLikeLocation(line2.line) && looksLikeTitle(cleanedLine3)) {
    return {
      company: cleanedLine1 || line1.line,
      location: cleanedLine2 || line2.line,
      title: cleanedLine3 || line3.line,
      consumedLines: consumedCount(line1, line2, line3),
    }
  }

  if (line1 && line2) {
    const line1IsTitle =
      Boolean(cleanedLine1) && (looksLikeTitle(cleanedLine1) || hasDateTokens(line1.line))
    const line2IsTitle = Boolean(cleanedLine2) && looksLikeTitle(cleanedLine2)
    const line3IsLocation = Boolean(line3?.line) && looksLikeLocation(line3.line)
    const line1IsCompany =
      Boolean(cleanedLine1) && (looksLikeCompany(cleanedLine1) || looksLikeLocation(cleanedLine1))
    const line2IsCompany =
      Boolean(cleanedLine2) && (looksLikeCompany(cleanedLine2) || looksLikeLocation(cleanedLine2))

    if (line1IsTitle && !line2IsTitle && (!line1IsCompany || line2IsCompany)) {
      const companyText = removeDateTokens(line2.line)
      const companyLocation = extractCompanyAndLocation(companyText)
      return {
        ...companyLocation,
        location: line3IsLocation ? removeDateTokens(line3.line) : companyLocation.location,
        title: cleanedLine1 || line1.line,
        consumedLines: consumedCount(line1, line2, line3IsLocation ? line3 : undefined),
      }
    }

    if (line2IsTitle && !line1IsTitle && (!line2IsCompany || line1IsCompany)) {
      const companyText = removeDateTokens(line1.line)
      const companyLocation = extractCompanyAndLocation(companyText)
      return {
        ...companyLocation,
        title: cleanedLine2 || line2.line,
        consumedLines: consumedCount(line1, line2),
      }
    }

    const companyText = removeDateTokens(line1.line)
    const companyLocation = extractCompanyAndLocation(companyText)
    return {
      ...companyLocation,
      title: cleanedLine2 || line2.line,
      consumedLines: consumedCount(line1, line2),
    }
  }

  const companyText = removeDateTokens(line1?.line || '')
  const companyLocation = extractCompanyAndLocation(companyText)
  return {
    ...companyLocation,
    title: '',
    consumedLines: consumedCount(line1),
  }
}

// Drop header/date lines and join the remaining bullet-like content.
// Join bullet-like lines into a normalized role description.
function buildRoleDescription(lines: string[], consumedLines: number): string {
  const remaining = lines
    .slice(consumedLines)
    .filter((line) => !isDateLine(line) && !isNoiseHeadingLine(line))
  const sanitized = remaining
    .map((line) => stripBullet(line))
    .map((line) => normalizeToken(line))
    .filter(Boolean)

  return sanitized.join('\n')
}

// Default ID generator for mapped job history entries.
function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `resume-${Math.random().toString(36).slice(2, 10)}`
}

function formatDateWithOptions(
  date: ParsedDate | null | undefined,
  options: Required<Pick<JobHistoryMapOptions, 'dateFormat' | 'currentLabel'>>
): string {
  // Date formatting is intentionally conservative for downstream schema flexibility.
  if (!date) return ''
  if (date.isCurrent) return options.currentLabel

  const { dateFormat } = options
  const year = String(date.year)

  if (dateFormat === 'raw') return date.raw
  if (dateFormat === 'yyyy-mm') {
    if (!date.month) return year
    return `${year}-${String(date.month).padStart(2, '0')}`
  }

  if (!date.month) return `${year}-01-01`
  return `${year}-${String(date.month).padStart(2, '0')}-01`
}

function buildDateHelpers(options: JobHistoryMapOptions): DateFormatHelpers {
  const normalized: Required<Pick<JobHistoryMapOptions, 'dateFormat' | 'currentLabel'>> = {
    dateFormat: options.dateFormat || 'yyyy-mm',
    currentLabel: options.currentLabel || 'Present',
  }

  return {
    formatDate: (date) => formatDateWithOptions(date, normalized),
    formatDateRange: (range) => {
      if (!range) return { startDate: '', endDate: '' }
      return {
        startDate: formatDateWithOptions(range.start, normalized),
        endDate: formatDateWithOptions(range.end, normalized),
      }
    },
  }
}

// Main parser: locate experience section -> split into jobs -> map into structured entries.
export function parseResumeTextToExperiences(
  text: string,
  options: ResumeParserOptions = {}
): ResumeParseResult {
  // Main pipeline: section -> paragraphs -> experience blocks.
  const headings = options.sectionHeadings || DEFAULT_EXPERIENCE_HEADINGS
  const stopHeadings = options.stopHeadings || DEFAULT_STOP_HEADINGS
  const { lines, warnings } = extractExperienceSection(text, headings, stopHeadings)

  const paragraphs = splitIntoParagraphs(lines)
  let experienceBlocks = paragraphs.filter((block) => looksLikeExperienceBlock(block))

  const headerLineCount = lines.filter((line) => isExperienceHeaderLine(line)).length

  const hasMisalignedBlocks = experienceBlocks.some(
    (block) => block.length > 1 && !isExperienceHeaderLine(block[0])
  )
  const shouldUseHeaderBlocks =
    headerLineCount > 1 ||
    experienceBlocks.length === 0 ||
    experienceBlocks.every((block) => block.length <= 2) ||
    hasMisalignedBlocks

  if (shouldUseHeaderBlocks) {
    experienceBlocks = splitByExperienceHeaders(lines, stopHeadings)
  }

  if (experienceBlocks.length === 0) {
    warnings.push('no-experience-blocks')
  } else {
    const warningIndex = warnings.indexOf('experience-section-not-found')
    if (warningIndex !== -1) warnings.splice(warningIndex, 1)
  }

  const maxItems = options.maxExperienceItems || experienceBlocks.length
  const experiences = experienceBlocks.slice(0, maxItems).map((block) => {
    const dateRange = extractDateRange(block.join(' ')) || undefined
    const { company, location, title, consumedLines } = extractCompanyTitle(block)
    const roleDescription = buildRoleDescription(block, consumedLines)

    return {
      company,
      ...(location ? { location } : {}),
      title,
      roleDescription,
      dateRange,
      rawLines: block,
    }
  })

  return {
    experiences,
    experienceSection: lines.join('\n'),
    warnings,
  }
}

export function mapExperiencesToJobHistory(
  experiences: ParsedExperience[],
  options: JobHistoryMapOptions = {}
): JobHistoryItem[] {
  // Allows custom mapping for schema changes.
  const helpers = buildDateHelpers(options)

  if (options.mapExperience) {
    return experiences
      .map((experience) => options.mapExperience?.(experience, helpers))
      .filter((item): item is JobHistoryItem => Boolean(item))
  }

  const idFactory = options.idFactory || createId

  return experiences.map((experience) => {
    const dates = helpers.formatDateRange(experience.dateRange)
    const isCurrent = Boolean(experience.dateRange?.end?.isCurrent)
    const endDate = isCurrent ? '' : dates.endDate

    return {
      id: idFactory(),
      company: experience.company,
      title: experience.title,
      roleDescription: experience.roleDescription,
      startDate: dates.startDate,
      endDate,
      isCurrent,
    }
  })
}

export function mergeJobHistoryItems(
  existing: JobHistoryItem[],
  incoming: JobHistoryItem[],
  options: JobHistoryMergeOptions = {}
): JobHistoryItem[] {
  // Fill empty fields by default to preserve manual edits.
  const strategy = options.strategy || 'fill-empty'
  if (strategy === 'replace') {
    return incoming.slice()
  }

  const matchBy = options.matchBy || 'company-title-date'
  const buildKey = (item: JobHistoryItem) => {
    // Use a normalized composite key when IDs are missing.
    if (matchBy === 'id') return item.id
    return [item.company, item.title, item.startDate]
      .map((value) => value.toLowerCase().trim())
      .join('|')
  }

  const merged = existing.map((item) => ({ ...item }))
  const existingMap = new Map(merged.map((item) => [buildKey(item), item]))

  for (const incomingItem of incoming) {
    const key = buildKey(incomingItem)
    const match = existingMap.get(key)

    if (!match) {
      merged.push({ ...incomingItem })
      existingMap.set(key, merged[merged.length - 1])
      continue
    }

    if (!match.company) match.company = incomingItem.company
    if (!match.title) match.title = incomingItem.title
    if (!match.roleDescription) match.roleDescription = incomingItem.roleDescription
    if (!match.startDate) match.startDate = incomingItem.startDate
    if (!match.endDate) match.endDate = incomingItem.endDate
  }

  return merged
}
