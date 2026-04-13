'use client'

import { useState, memo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ExternalLink, Mail, Search, Filter } from 'lucide-react'
import { JobApplication } from '../data/mockData'
import { formatDate } from '../utils/dateFormatter'
import { ApplicationStatusColor } from '../utils/applicationStatusStyles'
import { useRouter } from 'next/navigation'

interface ApplicationsTableProps {
  // Full list of applications to render
  applications: JobApplication[]

  // Optional callbacks for inline edits (parent controls persistence)
  onStatusChange?: (id: string, status: JobApplication['status']) => void
  onNotesChange?: (id: string, notes: string) => void
  onAddApplication?: (add: JobApplication) => void
}

// Memoized to avoid re-rendering when props don’t change
export const ApplicationsTable = memo(function ApplicationsTable({
  applications,
  onStatusChange,
  onNotesChange,
}: ApplicationsTableProps) {
  // UI filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Router used for row-level navigation
  const router = useRouter()
  // Derived list: applies search + status filters to the full dataset
  const filteredApplications = applications.filter((app) => {
    // Matches search across key fields users expect (company, role, and location)
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.city.toLowerCase().includes(searchTerm.toLowerCase())
    // Matches status when a specific filter is selected
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const isRecruiterManaged = (app: JobApplication) => app.jobSource === 'Hirelytics'

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Job Applications</CardTitle>
            <CardDescription>
              Track and manage all your job applications in one place
            </CardDescription>
          </div>
          <button
            className='rounded bg-black text-white px-4 py-1'
            onClick={() => router.push('/applicant/addExternalJob')}
          >
            Add External Job
          </button>
        </div>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Text search input */}
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search companies, positions, or locations...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          {/* Status filter dropdown */}
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='Applied'>Applied</SelectItem>
                <SelectItem value='Interview'>Interview</SelectItem>
                <SelectItem value='Offer'>Offer</SelectItem>
                <SelectItem value='Rejected'>Rejected</SelectItem>
                <SelectItem value='Withdrawn'>Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table container with border + rounded corners */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Country/City</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Application Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Job Source</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Job Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Main rows: render filtered applications */}
              {filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className='font-medium'>{app.company}</TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      <div>{app.country}</div>
                      <div className='text-muted-foreground'>{app.city}</div>
                    </div>
                  </TableCell>
                  <TableCell>{app.position}</TableCell>
                  <TableCell>{formatDate(app.applicationDate)}</TableCell>
                  <TableCell>
                    <Select
                      value={app.status}
                      disabled={isRecruiterManaged(app)}
                      onValueChange={(status) => {
                        if (isRecruiterManaged(app)) return
                        onStatusChange?.(String(app.id), status as JobApplication['status'])
                      }}
                    >
                      <SelectTrigger
                        className={`w-[120px] ${ApplicationStatusColor[app.status] ?? ''}`}
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
                  <TableCell>{app.contactPerson}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{app.jobSource}</Badge>
                  </TableCell>
                  <TableCell className='max-w-[200px]'>
                    <input
                      type='text'
                      value={app.notes}
                      onChange={(e) => onNotesChange?.(String(app.id), e.target.value)}
                      className='border rounded px-2 py-1 w-full text-sm bg-background'
                      placeholder='Add notes...'
                    />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const a = app as unknown as {
                        recruiterFeedback?: string
                        recruiterFeedbackSeen?: boolean
                      }
                      const hasUnread = !!a.recruiterFeedback && !a.recruiterFeedbackSeen
                      return (
                        <Button
                          variant='ghost'
                          size='sm'
                          aria-label={
                            hasUnread ? 'New recruiter feedback' : 'View application details'
                          }
                          onClick={() =>
                            router.push(
                              `/applicant/applications/${String(app.id)}${hasUnread ? '?tab=feedback' : ''}`
                            )
                          }
                        >
                          {hasUnread ? (
                            <Mail className='h-4 w-4 text-pink-500' />
                          ) : (
                            <ExternalLink className='h-4 w-4' />
                          )}
                        </Button>
                      )
                    })()}
                  </TableCell>
                </TableRow>
              ))}
              {/* Empty state when filters return no matches */}
              {filteredApplications.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-center py-8 text-muted-foreground'
                  >
                    No applications found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Footer summary: shows how many results are currently visible */}
        <div className='flex items-center justify-between mt-4'>
          <div className='text-sm text-muted-foreground'>
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
