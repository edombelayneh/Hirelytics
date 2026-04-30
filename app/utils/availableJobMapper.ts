import { AvailableJob } from '../data/availableJobs'

type SnapshotLikeDoc = {
  id?: unknown
  data?: unknown
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function extractDocData(doc: SnapshotLikeDoc): Record<string, unknown> {
  if (typeof doc.data === 'function') {
    const fromFn = asRecord((doc.data as () => unknown)())
    if (fromFn) return fromFn
  }

  const fromProperty = asRecord(doc.data)
  if (fromProperty) return fromProperty

  const fromDocItself = asRecord(doc)
  return fromDocItself ?? {}
}

export function toAvailableJobFromSnapshotDoc(doc: unknown): AvailableJob | null {
  const docRecord = asRecord(doc)
  if (!docRecord) return null

  const snapshotDoc = docRecord as SnapshotLikeDoc
  const data = extractDocData(snapshotDoc)

  const id = asString(snapshotDoc.id, asString(data.id))
  const title = asString(data.title)
  const company = asString(data.company)
  const description = asString(data.description)
  const postedDate = asString(data.postedDate)

  // Keep essential requirements strict to avoid rendering unusable cards.
  if (!id || !title || !company || !description || !postedDate) {
    return null
  }

  return {
    id,
    title,
    company,
    location: asString(data.location, 'Unspecified'),
    type: asString(data.type, 'Unknown'),
    postedDate,
    salary: asString(data.salary, 'Not specified'),
    description,
    requirements: asStringArray(data.requirements),
    status: asString(data.status, 'Open'),
    applyLink: asString(data.applyLink, '#'),
    recruiterId: asString(data.recruiterId),
    applicantsId: asStringArray(data.applicantsId),
  }
}
