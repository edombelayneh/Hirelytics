import { NextRequest, NextResponse } from 'next/server'

export interface ParsedJobData {
  jobName: string
  companyName: string
  description: string
  qualifications: string
  preferredSkills: string
  location: string
  employmentType: string
  workArrangement: string
  country: string
  city: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 400 }
      )
    }

    const html = await response.text()
    const parsed = parseJobFromHtml(html, url)

    const wafHeader = (response.headers.get('x-amzn-waf-action') || '').toLowerCase()
    const loweredHtml = html.toLowerCase()
    const blockedByChallenge =
      wafHeader.includes('challenge') ||
      (loweredHtml.includes('javascript is disabled') &&
        loweredHtml.includes("verify that you're not a robot"))

    if (blockedByChallenge) {
      return NextResponse.json({
        ...parsed,
        blocked: true,
        blockedReason:
          'This job site is protected by a JavaScript/bot challenge. Auto-fill is limited for this link.',
      })
    }

    return NextResponse.json({ ...parsed, blocked: false })
  } catch (error) {
    console.error('Parse URL error:', error)
    return NextResponse.json({ error: 'Failed to parse job information from URL' }, { status: 500 })
  }
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
}

function cleanText(text: string) {
  const withoutTags = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')

  return decodeHtmlEntities(withoutTags)
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\t]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/[ ]*\n[ ]*/g, '\n')
    .trim()
}

function firstMeaningful(...values: Array<unknown>) {
  const blockedPlaceholders = new Set([
    'javascript is disabled',
    'in order to continue, we need to verify that you are not a robot',
  ])

  for (const value of values) {
    if (typeof value !== 'string') continue
    const cleaned = cleanText(value)
    if (!cleaned) continue
    const lowered = cleaned.toLowerCase()
    if (lowered === 'unknown position') continue
    if (lowered === 'unknown company') continue
    if (blockedPlaceholders.has(lowered)) continue
    return cleaned
  }
  return ''
}

function normalizeCountry(country: string) {
  const c = cleanText(country)
  if (!c) return 'USA'
  if (c === 'United States of America' || c === 'United States' || c === 'US') return 'USA'
  return c
}

function normalizeEmploymentType(value: string) {
  const v = value.toLowerCase()
  if (v.includes('full')) return 'full-time'
  if (v.includes('part')) return 'part-time'
  if (v.includes('contract')) return 'contract'
  if (v.includes('intern')) return 'internship'
  return ''
}

function normalizeWorkArrangement(value: string) {
  const v = value.toLowerCase()
  if (v.includes('hybrid')) return 'hybrid'
  if (v.includes('remote')) return 'remote'
  if (v.includes('on-site') || v.includes('on site') || v.includes('onsite')) return 'onsite'
  return ''
}

function extractMetaContent(html: string, key: string) {
  const byProperty = html.match(
    new RegExp(
      `<meta[^>]*property=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${key}["'][^>]*>`,
      'i'
    )
  )
  const propertyValue = byProperty?.[1] || byProperty?.[2]
  if (propertyValue) return cleanText(propertyValue)

  const byName = html.match(
    new RegExp(
      `<meta[^>]*name=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${key}["'][^>]*>`,
      'i'
    )
  )
  const nameValue = byName?.[1] || byName?.[2]
  return nameValue ? cleanText(nameValue) : ''
}

function inferFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const slug = parsed.pathname.split('/').filter(Boolean).pop() || ''
    const parts = slug.split('--').filter(Boolean)
    const titlePart = parts[0] || ''
    const cityPart = parts[1] || ''
    const hostParts = parsed.hostname.replace('www.', '').split('.')
    const genericHostLabels = new Set(['careers', 'jobs', 'job', 'apply'])
    const rawCompanyPart = hostParts[0] || ''
    const companyPart =
      genericHostLabels.has(rawCompanyPart.toLowerCase()) && hostParts[1]
        ? hostParts[1]
        : rawCompanyPart

    const toTitleCase = (value: string) =>
      value
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

    const humanizeCompanyToken = (token: string) =>
      token
        .replace(/health$/i, '-health')
        .replace(/group$/i, '-group')
        .replace(/systems$/i, '-systems')
        .replace(/technologies$/i, '-technologies')

    const companyName = companyPart ? toTitleCase(humanizeCompanyToken(companyPart)) : ''

    return {
      jobName: titlePart ? toTitleCase(titlePart) : '',
      city: cityPart ? toTitleCase(cityPart) : '',
      companyName,
    }
  } catch {
    return { jobName: '', city: '', companyName: '' }
  }
}

function flattenJsonLd(value: unknown): Array<Record<string, unknown>> {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => flattenJsonLd(item))
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj['@graph'])) {
      return (obj['@graph'] as unknown[]).flatMap((item) => flattenJsonLd(item))
    }
    return [obj]
  }
  return []
}

function extractBulletsUnderHeading(html: string, headingPattern: RegExp) {
  const section = html.match(
    new RegExp(`${headingPattern.source}[\\s\\S]{0,2400}?<ul[^>]*>([\\s\\S]*?)<\\/ul>`, 'i')
  )
  if (!section?.[1]) return ''

  const bullets = Array.from(section[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => cleanText(match[1]))
    .filter((line) => line.length > 3)

  if (!bullets.length) return ''
  return bullets.map((line) => `• ${line}`).join('\n')
}

function parseJobFromHtml(html: string, url: string): ParsedJobData {
  const inferred = inferFromUrl(url)

  const result: ParsedJobData = {
    jobName: 'Unknown Position',
    companyName: inferred.companyName || 'Unknown Company',
    description: '',
    qualifications: '',
    preferredSkills: '',
    location: '',
    employmentType: '',
    workArrangement: '',
    country: 'USA',
    city: inferred.city,
  }

  const jsonLdBlocks = Array.from(
    html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  )

  for (const block of jsonLdBlocks) {
    const payload = block[1]?.trim()
    if (!payload) continue

    try {
      const parsed = JSON.parse(payload)
      const nodes = flattenJsonLd(parsed)
      for (const node of nodes) {
        const type = String(node['@type'] || '').toLowerCase()
        if (!type.includes('job')) continue

        result.jobName = firstMeaningful(
          result.jobName,
          node.title,
          node.name,
          node.headline,
          inferred.jobName
        )
        result.companyName = firstMeaningful(
          result.companyName,
          (node.hiringOrganization as Record<string, unknown>)?.name,
          (node.sourceOrganization as Record<string, unknown>)?.name,
          (node.organization as Record<string, unknown>)?.name,
          inferred.companyName
        )
        result.description = firstMeaningful(
          result.description,
          node.description,
          node.jobDescription
        )
        result.qualifications = firstMeaningful(
          result.qualifications,
          node.qualifications,
          node.experienceRequirements,
          node.skills,
          node.responsibilities
        )

        const employment = firstMeaningful(String(node.employmentType || ''))
        result.employmentType = firstMeaningful(
          result.employmentType,
          normalizeEmploymentType(employment)
        )

        const workHint = firstMeaningful(
          String(node.jobLocationType || ''),
          String(node.workHours || '')
        )
        result.workArrangement = firstMeaningful(
          result.workArrangement,
          normalizeWorkArrangement(workHint)
        )

        const locationNode = node.jobLocation as Record<string, unknown> | undefined
        const address = locationNode?.address as Record<string, unknown> | undefined
        if (address) {
          result.city = firstMeaningful(
            result.city,
            String(address.addressLocality || ''),
            inferred.city
          )
          result.country = normalizeCountry(
            firstMeaningful(String(address.addressCountry || ''), result.country)
          )
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ''
  const ogTitle = extractMetaContent(html, 'og:title')
  const ogDescription = extractMetaContent(html, 'og:description')
  const ogSiteName = extractMetaContent(html, 'og:site_name')
  const metaDescription = extractMetaContent(html, 'description')

  const titleCandidate = firstMeaningful(h1, ogTitle, titleTag)
  if (titleCandidate) {
    const simplified = titleCandidate.split('|')[0].split(' - ')[0].trim()
    result.jobName = firstMeaningful(result.jobName, simplified, inferred.jobName)
  }

  result.companyName = firstMeaningful(result.companyName, ogSiteName, inferred.companyName)
  result.description = firstMeaningful(result.description, ogDescription, metaDescription)

  result.qualifications = firstMeaningful(
    result.qualifications,
    extractBulletsUnderHeading(
      html,
      /(Qualifications|Requirements|Minimum\s+Qualifications|Basic\s+Qualifications|What\s+you\s+bring)/i
    )
  )

  result.preferredSkills = firstMeaningful(
    result.preferredSkills,
    extractBulletsUnderHeading(html, /(Preferred\s+Skills|Skills|Nice\s+to\s+have)/i)
  )

  if (!result.description) {
    result.description = firstMeaningful(
      extractBulletsUnderHeading(
        html,
        /(Responsibilities|Key\s+Responsibilities|Duties|What\s+you\s+will\s+do)/i
      )
    )
  }

  const plain = cleanText(html)

  if (!result.description || result.description.length < 120) {
    const summaryMatch = plain.match(
      /Job\s*Summary\s*([\s\S]{40,1400}?)(?=Qualifications|Requirements|Responsibilities|Skills|Education|$)/i
    )
    if (summaryMatch?.[1]) {
      result.description = firstMeaningful(result.description, summaryMatch[1])
    }
  }

  if (!result.qualifications) {
    const qualificationsMatch = plain.match(
      /Qualifications\s*([\s\S]{30,1400}?)(?=Responsibilities|Skills|Education|Physical\s*Demands|$)/i
    )
    if (qualificationsMatch?.[1]) {
      const lines = qualificationsMatch[1]
        .split(/\n|•/)
        .map((line) => cleanText(line))
        .filter((line) => line.length > 8)
      if (lines.length > 0) {
        result.qualifications = lines.map((line) => `• ${line}`).join('\n')
      }
    }
  }

  if (!result.city) {
    const cityStateParen = plain.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([A-Z]{2})\)\b/)
    if (cityStateParen?.[1]) {
      result.city = cityStateParen[1]
      result.country = 'USA'
    }
  }

  if (!result.employmentType) {
    const typeText = plain.match(/(Full\s*time|Part\s*time|Contract|Internship)/i)?.[1] || ''
    result.employmentType = normalizeEmploymentType(typeText)
  }

  if (!result.workArrangement) {
    const arrangementText = plain.match(/(Remote|Hybrid|On-site|Onsite|On site)/i)?.[1] || ''
    result.workArrangement = normalizeWorkArrangement(arrangementText)
  }

  result.jobName = firstMeaningful(result.jobName, inferred.jobName) || 'Unknown Position'
  result.companyName =
    firstMeaningful(result.companyName, inferred.companyName) || 'Unknown Company'
  result.description = firstMeaningful(result.description).substring(0, 2000)
  result.qualifications = firstMeaningful(result.qualifications).substring(0, 2000)
  result.preferredSkills = firstMeaningful(result.preferredSkills).substring(0, 1200)
  result.city = firstMeaningful(result.city, inferred.city)
  result.country = normalizeCountry(firstMeaningful(result.country, 'USA'))

  if (!result.location && result.city) {
    result.location = `${result.city}, ${result.country}`
  }

  return result
}
