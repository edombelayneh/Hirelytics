import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024 // 5 MB
const FETCH_TIMEOUT_MS = 15_000 // 15 seconds

function isPrivateHostname(hostname: string): boolean {
  // Strip IPv6 brackets
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()

  if (host === 'localhost' || host === '::1' || host === '0.0.0.0') return true
  if (host === 'metadata.google.internal') return true

  // IPv4 loopback (127.0.0.0/8)
  if (/^127\./.test(host)) return true

  // Link-local / AWS metadata (169.254.0.0/16)
  if (/^169\.254\./.test(host)) return true

  // Private ranges
  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true

  // 172.16.0.0/12
  const parts = host.split('.')
  if (parts.length === 4 && parts[0] === '172') {
    const second = parseInt(parts[1] ?? '', 10)
    if (second >= 16 && second <= 31) return true
  }

  // IPv6 unique-local and link-local
  if (/^fc[0-9a-f]{2}:/.test(host) || /^fd[0-9a-f]{2}:/.test(host)) return true
  if (/^fe80:/.test(host)) return true

  return false
}

async function readBodyWithSizeLimit(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done || !value) break
      totalBytes += value.length
      if (totalBytes > maxBytes) break
      chunks.push(value)
    }
  } finally {
    reader.cancel().catch(() => {})
  }

  const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(combined)
}

type ScrapedJob = {
  title: string
  companyName: string
  description: string
  qualifications: string
  preferredSkills: string
  country: string
  state: string
  city: string
  employmentType: string
  workArrangement: string
  paymentAmount: string
  paymentType: string
}

const PLATFORM_BRANDS = [
  'linkedin',
  'indeed',
  'glassdoor',
  'google jobs',
  'greenhouse',
  'lever',
  'workday',
  'ziprecruiter',
  'monster',
  'dice',
  'builtin',
  'wellfound',
]

function normalizeBrand(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isPlatformBrand(value: string): boolean {
  const normalized = normalizeBrand(value)
  if (!normalized) return false
  return PLATFORM_BRANDS.some((brand) => normalized === brand || normalized.includes(brand))
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .trim()
}

function stripHtml(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  )
}

function extractMetaTag(html: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapedKey}["'][^>]*>`,
    'i'
  )
  const match = html.match(pattern)
  return decodeHtml((match?.[1] || match?.[2] || '').trim())
}

function extractMetaTagCandidates(html: string, keys: string[]): string {
  for (const key of keys) {
    const value = extractMetaTag(html, key)
    if (value) return value
  }
  return ''
}

function extractFromHtmlByRegex(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    const value = cleanText(match?.slice(1).find((part) => part && part.trim()) || '')
    if (value) return value
  }
  return ''
}

function extractTitle(html: string): string {
  const titleFromMeta =
    extractMetaTag(html, 'og:title') || extractMetaTag(html, 'twitter:title') || ''
  if (titleFromMeta) return titleFromMeta

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
  return decodeHtml(titleTag.replace(/\s+/g, ' ').trim())
}

function cleanText(value: string): string {
  return stripHtml(value).replace(/\s+/g, ' ').trim()
}

function extractJsonLdObjects(html: string): Array<Record<string, unknown>> {
  const scripts = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  )

  const objects: Array<Record<string, unknown>> = []

  for (const script of scripts) {
    const raw = script[1]?.trim()
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === 'object') objects.push(item as Record<string, unknown>)
        })
      } else if (parsed && typeof parsed === 'object') {
        objects.push(parsed as Record<string, unknown>)
      }
    } catch {
      // Ignore malformed JSON-LD blocks from third-party scripts.
    }
  }

  return objects
}

function findJobPostingObject(
  objects: Array<Record<string, unknown>>
): Record<string, unknown> | null {
  const queue = [...objects]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const type = current['@type']
    if (typeof type === 'string' && type.toLowerCase() === 'jobposting') return current
    if (Array.isArray(type) && type.some((item) => String(item).toLowerCase() === 'jobposting')) {
      return current
    }

    const graph = current['@graph']
    if (Array.isArray(graph)) {
      graph.forEach((item) => {
        if (item && typeof item === 'object') queue.push(item as Record<string, unknown>)
      })
    }
  }

  return null
}

function coerceText(value: unknown): string {
  if (typeof value === 'string') return cleanText(value)
  if (typeof value === 'number') return String(value)
  return ''
}

function coerceArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => coerceText(item)).filter(Boolean)
  const single = coerceText(value)
  return single ? [single] : []
}

function uniqueJoin(values: string[]): string {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join(', ')
}

function parseCompensation(jobPosting: Record<string, unknown>): {
  paymentAmount: string
  paymentType: string
} {
  const baseSalary =
    jobPosting.baseSalary && typeof jobPosting.baseSalary === 'object'
      ? (jobPosting.baseSalary as Record<string, unknown>)
      : null

  if (!baseSalary) return { paymentAmount: '', paymentType: '' }

  const valueObject =
    baseSalary.value && typeof baseSalary.value === 'object'
      ? (baseSalary.value as Record<string, unknown>)
      : null

  const minValue = coerceText(valueObject?.minValue)
  const maxValue = coerceText(valueObject?.maxValue)
  const exactValue = coerceText(valueObject?.value) || coerceText(baseSalary.value)
  const unitText = (
    coerceText(valueObject?.unitText) || coerceText(baseSalary.unitText)
  ).toLowerCase()

  const paymentAmount =
    minValue && maxValue ? `${minValue}-${maxValue}` : exactValue || minValue || maxValue
  const paymentType = unitText.includes('hour') ? 'hourly' : unitText ? 'salary' : ''

  return { paymentAmount, paymentType }
}

function inferWorkArrangement(jobPosting: Record<string, unknown>, html: string): string {
  const locationType = coerceText(jobPosting.jobLocationType).toLowerCase()
  if (locationType.includes('telecommute') || locationType.includes('remote')) return 'remote'

  const text =
    `${extractTitle(html)} ${extractMetaTagCandidates(html, ['description', 'og:description'])}`
      .toLowerCase()
      .trim()

  if (text.includes('hybrid')) return 'hybrid'
  if (text.includes('remote')) return 'remote'
  if (text.includes('on-site') || text.includes('onsite') || text.includes('in office'))
    return 'onsite'
  return ''
}

function extractSectionContent(html: string, headingPatterns: string[]): string {
  for (const heading of headingPatterns) {
    const pattern = new RegExp(
      `<h[1-6][^>]*>\\s*${heading}\\s*<\\/h[1-6]>([\\s\\S]{0,3500}?)(?=<h[1-6][^>]*>|<\\/main>|<\\/article>|<\\/section>)`,
      'i'
    )

    const match = html.match(pattern)
    if (!match?.[1]) continue

    const block = match[1]
    const listItems = Array.from(block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((item) =>
      cleanText(item[1] || '')
    )

    if (listItems.length > 0) {
      return uniqueJoin(listItems)
    }

    const text = cleanText(block)
    if (text) return text
  }

  return ''
}

function inferCompanyName(html: string, pageUrl: string, title: string): string {
  const metaCompany = extractMetaTagCandidates(html, [
    'og:site_name',
    'application-name',
    'twitter:site',
    'author',
  ])

  if (metaCompany) {
    const cleaned = metaCompany.replace(/^@/, '').trim()
    if (!isPlatformBrand(cleaned)) return cleaned
  }

  const fromScriptRegex = extractFromHtmlByRegex(html, [
    /"hiringOrganization"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]+)"/i,
    /"company(?:Name)?"\s*:\s*"([^"]+)"/i,
    /"organization"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]+)"/i,
  ])

  if (fromScriptRegex && !isPlatformBrand(fromScriptRegex)) return fromScriptRegex

  const titlePieces = title
    .split(/\|| - | — | at /i)
    .map((piece) => piece.trim())
    .filter(Boolean)

  if (titlePieces.length >= 2) {
    // Heuristic: many job pages format as "Role | Company" or "Role - Company".
    const candidate = [...titlePieces]
      .reverse()
      .find((piece) => piece.length <= 80 && !isPlatformBrand(piece))

    if (candidate) return candidate
  }

  try {
    const host = new URL(pageUrl).hostname.replace(/^www\./i, '')
    const base = host.split('.')[0] || ''
    const hostBrand = base ? `${base.charAt(0).toUpperCase()}${base.slice(1)}` : ''
    if (!hostBrand || isPlatformBrand(hostBrand)) return ''
    return hostBrand
  } catch {
    return ''
  }
}

function inferDescription(html: string): string {
  const metaDescription = extractMetaTagCandidates(html, [
    'og:description',
    'twitter:description',
    'description',
  ])

  const sectionDescription =
    extractSectionContent(html, [
      'Job\\s+Description',
      'About\\s+the\\s+Role',
      'About\\s+this\\s+job',
      'Responsibilities?',
      "What\\s+you'?ll\\s+do",
    ]) || ''

  const fromScriptRegex = extractFromHtmlByRegex(html, [
    /"jobDescription"\s*:\s*"([\s\S]*?)"\s*,/i,
    /"description"\s*:\s*"([\s\S]*?)"\s*,\s*"(qualifications|responsibilities|skills)"/i,
    /"description"\s*:\s*"([\s\S]{80,}?)"\s*[,}]/i,
  ])

  // Prefer richer content over short marketing snippets.
  const candidates = [sectionDescription, fromScriptRegex, metaDescription].map((value) =>
    cleanText(value)
  )

  const best = candidates.filter(Boolean).sort((a, b) => b.length - a.length)[0]

  return best || ''
}

function locationFromJsonLd(jobPosting: Record<string, unknown>): {
  city: string
  state: string
  country: string
} {
  const rawJobLocation = jobPosting.jobLocation

  const firstLocation = Array.isArray(rawJobLocation) ? rawJobLocation[0] : rawJobLocation
  if (!firstLocation || typeof firstLocation !== 'object') {
    return { city: '', state: '', country: '' }
  }

  const address =
    'address' in firstLocation && firstLocation.address && typeof firstLocation.address === 'object'
      ? (firstLocation.address as Record<string, unknown>)
      : null

  if (!address) return { city: '', state: '', country: '' }

  return {
    city: coerceText(address.addressLocality),
    state: coerceText(address.addressRegion),
    country: coerceText(address.addressCountry),
  }
}

function scrapeJobFromHtml(html: string, pageUrl: string): ScrapedJob {
  const objects = extractJsonLdObjects(html)
  const jobPosting = findJobPostingObject(objects)
  const extractedTitle = extractTitle(html)

  const title =
    coerceText(jobPosting?.title) || extractedTitle.split('|')[0]?.trim() || 'Unknown Position'

  const companyName =
    coerceText((jobPosting?.hiringOrganization as Record<string, unknown> | undefined)?.name) ||
    inferCompanyName(html, pageUrl, extractedTitle) ||
    'Unknown Company'

  const description = coerceText(jobPosting?.description) || inferDescription(html) || ''

  const qualifications =
    uniqueJoin(coerceArray(jobPosting?.qualifications)) ||
    extractSectionContent(html, ['Qualifications?', 'Requirements?', 'Minimum\\s+Qualifications?'])

  const preferredSkills =
    uniqueJoin(coerceArray(jobPosting?.skills)) ||
    extractSectionContent(html, ['Preferred\\s+Qualifications?', 'Nice\\s+to\\s+Have'])

  const location = locationFromJsonLd(jobPosting ?? {})
  const employmentType = uniqueJoin(coerceArray(jobPosting?.employmentType))
  const workArrangement = inferWorkArrangement(jobPosting ?? {}, html)
  const { paymentAmount, paymentType } = parseCompensation(jobPosting ?? {})

  const fallbackLocation = (() => {
    const titleWithMeta = `${extractTitle(html)} ${extractMetaTagCandidates(html, ['description', 'og:description'])}`

    const cityState =
      titleWithMeta.match(/\b([A-Za-z .'-]+),\s*([A-Z]{2})\b/) ||
      titleWithMeta.match(/\b([A-Za-z .'-]+),\s*([A-Za-z .'-]{3,})\b/)

    if (!cityState) return { city: '', state: '', country: '' }

    const city = cleanText(cityState[1] || '')
    const state = cleanText(cityState[2] || '')
    return { city, state, country: '' }
  })()

  const fallbackHost = (() => {
    try {
      const url = new URL(pageUrl)
      const host = url.hostname.replace(/^www\./i, '')
      const base = host.split('.')[0] || ''
      return base ? `${base.charAt(0).toUpperCase()}${base.slice(1)}` : ''
    } catch {
      return ''
    }
  })()

  return {
    title: title || 'Unknown Position',
    companyName: companyName || fallbackHost,
    description: cleanText(description),
    qualifications,
    preferredSkills,
    country: location.country || fallbackLocation.country,
    state: location.state || fallbackLocation.state,
    city: location.city || fallbackLocation.city,
    employmentType,
    workArrangement,
    paymentAmount,
    paymentType,
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { url?: string }
    const url = body.url?.trim()

    if (!url) {
      return NextResponse.json({ error: 'A job URL is required.' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 })
    }

    if (!/^https?:$/i.test(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP(S) URLs are supported.' }, { status: 400 })
    }

    if (isPrivateHostname(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Requests to private or internal addresses are not allowed.' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        cache: 'no-store',
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch the job page (status ${response.status}).` },
        { status: 400 }
      )
    }

    const contentType = response.headers.get('content-type') ?? ''
    const mimeType = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
    if (mimeType !== 'text/html' && mimeType !== 'application/xhtml+xml') {
      return NextResponse.json({ error: 'URL does not point to an HTML page.' }, { status: 400 })
    }

    const html = await readBodyWithSizeLimit(response, MAX_RESPONSE_BYTES)
    const scraped = scrapeJobFromHtml(html, parsedUrl.toString())

    return NextResponse.json({
      ok: true,
      scraped,
    })
  } catch (error) {
    console.error('Job scrape failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to scrape this job posting. Please fill details manually.',
      },
      { status: 500 }
    )
  }
}
