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
import type { Applicant } from '../../types/job'

type ApplicantsTableProps = {
  applicants: Applicant[]
  title?: string

  // Example: (id) => `/recruiter/applicants/${id}`
  profileHref?: (applicantId: string) => string
}

function safeLabelFromUrl(url?: string) {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function ApplicantsTable({
  applicants,
  title = 'Applicants',
  profileHref = (id) => `/recruiter/applicants/${id}`, // default route
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
              <TableHead className='w-[25%]'>Resume</TableHead>
              <TableHead className='w-[22%]'>LinkedIn</TableHead>
              <TableHead className='w-[23%]'>Portfolio</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {applicants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-sm text-muted-foreground'
                >
                  No applicants yet.
                </TableCell>
              </TableRow>
            ) : (
              applicants.map((a) => {
                const fullName = `${a.firstName} ${a.lastName}`.trim() || 'Unnamed'
                const resumeLabel = a.resumeFileName || 'Download resume'

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
                          href={a.linkedinUrl}
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
                          href={a.portfolioUrl}
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
