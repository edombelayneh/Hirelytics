import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { AvailableJob } from '../data/availableJobs'
import { db } from '../lib/firebaseClient'

type DetailRecord = Record<string, unknown>

type ApplicationJobDetails = {
	id: string
	title: string
	company: string
	location: string
	type: string
	postedDate: string
	salary: string
	description: string
	requirements: string[]
	status: string
	applyLink: string
	recruiterId?: string
}

type ApplicationPayload = {
	id: string
	jobId: string
	userId: string
	company: string
	position: string
	country: string
	city: string
	contactPerson: string
	jobSource: string
	jobLink: string
	applicationDate: string
	status: 'Applied'
	outcome: 'Pending'
	notes: string
	recruiterId?: string
	createdAt?: unknown
	updatedAt?: unknown
	jobDetails: ApplicationJobDetails
}

type BuildApplicationFromAvailableJobParams = {
	userId: string
	job: AvailableJob
}

type BuildApplicationParams = {
	userId: string
	jobId: string
	mergedJob: DetailRecord
	fallback: {
		title: string
		company: string
		location: string
		description: string
		requirements: string[]
		postedDate: string
	}
}

function toText(value: unknown): string {
	if (value === null || value === undefined) return ''
	return String(value).trim()
}

function toStringList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => toText(item)).filter(Boolean)
	}

	if (typeof value === 'string') {
		return value
			.split(/\n|,|;/)
			.map((item) => item.trim())
			.filter(Boolean)
	}

	return []
}

function parseLocation(location: string): { city: string; country: string } {
	if (!location) return { city: '', country: '' }
	if (location.toLowerCase() === 'remote') return { city: 'Remote', country: 'Remote' }

	const [first = '', second = ''] = location.split(',').map((part) => part.trim())
	if (!second) return { city: first, country: first }
	return { city: first, country: second }
}

export function buildApplicationFromAvailableJob({
	userId,
	job,
}: BuildApplicationFromAvailableJobParams): ApplicationPayload {
	const { city, country } = parseLocation(job.location)
	const jobId = String(job.id)

	return {
		id: jobId,
		jobId,
		userId,
		company: job.company,
		position: job.title,
		country,
		city,
		contactPerson: '',
		jobSource: 'Hirelytics',
		jobLink: job.applyLink,
		applicationDate: new Date().toISOString().slice(0, 10),
		status: 'Applied',
		outcome: 'Pending',
		notes: '',
		recruiterId: job.recruiterId,
		jobDetails: {
			id: jobId,
			title: job.title,
			company: job.company,
			location: job.location,
			type: job.type,
			postedDate: job.postedDate,
			salary: job.salary,
			description: job.description,
			requirements: job.requirements,
			status: job.status,
			applyLink: job.applyLink,
			recruiterId: job.recruiterId,
		},
	}
}

export function buildApplication({
	userId,
	jobId,
	mergedJob,
	fallback,
}: BuildApplicationParams): ApplicationPayload {
	const title = toText(mergedJob.title) || fallback.title
	const company = toText(mergedJob.company) || toText(mergedJob.companyName) || fallback.company
	const location = toText(mergedJob.location) || fallback.location
	const locationParts = parseLocation(location)
	const city = toText(mergedJob.city) || locationParts.city
	const country = toText(mergedJob.country) || locationParts.country
	const requirements =
		toStringList(mergedJob.requirements).length > 0
			? toStringList(mergedJob.requirements)
			: fallback.requirements

	return {
		id: jobId,
		jobId,
		userId,
		company,
		position: title,
		country,
		city,
		contactPerson: toText(mergedJob.contactPerson),
		jobSource: toText(mergedJob.jobSource) || 'Hirelytics',
		jobLink: toText(mergedJob.applyLink),
		applicationDate: new Date().toISOString().slice(0, 10),
		status: 'Applied',
		outcome: 'Pending',
		notes: '',
		recruiterId: toText(mergedJob.recruiterId) || undefined,
		jobDetails: {
			id: jobId,
			title,
			company,
			location,
			type: toText(mergedJob.type) || toText(mergedJob.employmentType),
			postedDate: toText(mergedJob.postedDate) || fallback.postedDate,
			salary: toText(mergedJob.salary) || toText(mergedJob.paymentAmount),
			description:
				toText(mergedJob.description) || toText(mergedJob.generalDescription) || fallback.description,
			requirements,
			status: toText(mergedJob.status) || 'Open',
			applyLink: toText(mergedJob.applyLink),
			recruiterId: toText(mergedJob.recruiterId) || undefined,
		},
	}
}

export async function saveUserApplication(application: ApplicationPayload): Promise<void> {
	const ref = doc(db, 'users', application.userId, 'applications', application.jobId)

	await setDoc(
		ref,
		{
			...application,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	)
}

export async function applyToAvailableJob({ userId, job }: BuildApplicationFromAvailableJobParams) {
	const payload = buildApplicationFromAvailableJob({ userId, job })
	await saveUserApplication(payload)
}

export async function applyToJobFromDetails({
	userId,
	jobId,
	mergedJob,
	fallback,
}: BuildApplicationParams) {
	const payload = buildApplication({ userId, jobId, mergedJob, fallback })
	await saveUserApplication(payload)
}
