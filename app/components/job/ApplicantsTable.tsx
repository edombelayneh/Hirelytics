'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import type { Applicant, ApplicationStatus } from '../../types/job'
import { ApplicationStatusColor } from '../../utils/applicationStatusStyles'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type ApplicantsTableProps = {
  // List of applicants to display
  applicants: Applicant[]
  title?: string

  // Optional profile route builder
  // Defaults to recruiter applicant details page
  profileHref?: (applicantId: string) => string
  // Status
  onStatusChange?: (applicantId: string, status: ApplicationStatus) => Promise<void> | void
}

// Utility: ensure URL has an absolute protocol so it doesn't resolve as a relative path
function safeHref(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

// Utility: extract clean label from URL
function safeLabelFromUrl(url?: string) {
  if (!url) return '' // No URL provided
  try {
    // Attempt to parse as valid URL
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') // Remove "www." prefix for cleaner display
  } catch {
    return url // If parsing fails, return original string
  }
}

export function ApplicantsTable({
  applicants,
  title = 'Applicants', // Default title
  profileHref = (id) => `/recruiter/applicants/${id}`, // Default route builder
  onStatusChange,
}: ApplicantsTableProps) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>{title}</h2>
      </div>

      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[30%]'>Name</TableHead>
              <TableHead className='w-[20%]'>Status</TableHead>
              <TableHead className='w-[25%]'>Resume</TableHead>
              <TableHead className='w-[22%]'>LinkedIn</TableHead>
              <TableHead className='w-[23%]'>Portfolio</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {applicants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-sm text-muted-foreground'
                >
                  No applicants yet.
                </TableCell>
              </TableRow>
            ) : (
              applicants.map((a) => {
                const fullName = `${a.firstName} ${a.lastName}`.trim() || 'Unnamed'
                const resumeLabel = a.resumeFileName || 'Download resume'
                const status = a.applicationStatus ?? 'Applied'

                return (
                  <TableRow key={a.id}>
                    {/* NAME -> link to profile */}
                    <TableCell className='font-medium'>
                      <Link
                        href={profileHref(a.id)}
                        className='underline underline-offset-4 hover:opacity-80'
                      >
                        {fullName}
                      </Link>
                    </TableCell>
                    {/* STATUS -> dropdown to update */}
                    <TableCell>
                      <Select
                        value={status}
                        disabled={!onStatusChange}
                        onValueChange={(status) =>
                          onStatusChange?.(a.id, status as ApplicationStatus)
                        }
                      >
                        <SelectTrigger
                          className={`w-[130px] ${ApplicationStatusColor[status] ?? ''}`}
                        >
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value='Applied'
                            className={ApplicationStatusColor.Applied}
                          >
                            Applied
                          </SelectItem>
                          <SelectItem
                            value='Interview'
                            className={ApplicationStatusColor.Interview}
                          >
                            Interview
                          </SelectItem>
                          <SelectItem
                            value='Offer'
                            className={ApplicationStatusColor.Offer}
                          >
                            Offer
                          </SelectItem>
                          <SelectItem
                            value='Rejected'
                            className={ApplicationStatusColor.Rejected}
                          >
                            Rejected
                          </SelectItem>
                          <SelectItem
                            value='Withdrawn'
                            className={ApplicationStatusColor.Withdrawn}
                          >
                            Withdrawn
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {/* RESUME -> downloadable */}
                    <TableCell>
                      {a.resumeUrl ? (
                        <a
                          href={a.resumeUrl}
                          download={a.resumeFileName || true}
                          className='inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-accent'
                        >
                          {resumeLabel}
                        </a>
                      ) : (
                        <span className='text-sm text-muted-foreground'>No resume uploaded</span>
                      )}
                    </TableCell>

                    {/* LINKEDIN */}
                    <TableCell>
                      {a.linkedinUrl ? (
                        <a
                          href={safeHref(a.linkedinUrl)}
                          target='_blank'
                          rel='noreferrer'
                          className='underline underline-offset-4 hover:opacity-80 text-sm'
                        >
                          {safeLabelFromUrl(a.linkedinUrl) || 'LinkedIn'}
                        </a>
                      ) : (
                        <span className='text-sm text-muted-foreground'>—</span>
                      )}
                    </TableCell>

                    {/* PORTFOLIO */}
                    <TableCell>
                      {a.portfolioUrl ? (
                        <a
                          href={safeHref(a.portfolioUrl)}
                          target='_blank'
                          rel='noreferrer'
                          className='underline underline-offset-4 hover:opacity-80 text-sm'
                        >
                          {safeLabelFromUrl(a.portfolioUrl) || 'Portfolio'}
                        </a>
                      ) : (
                        <span className='text-sm text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
