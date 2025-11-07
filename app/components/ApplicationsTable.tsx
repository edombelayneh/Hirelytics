import { useState, memo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ExternalLink, Search, Filter } from 'lucide-react'
import { JobApplication } from '../data/mockData'
import { formatDate } from '../utils/dateFormatter'
import { getStatusColor, getOutcomeColor } from '../utils/badgeColors'

interface ApplicationsTableProps {
  applications: JobApplication[]
}

export const ApplicationsTable = memo(function ApplicationsTable({
  applications,
}: ApplicationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Applications</CardTitle>
        <CardDescription>Track and manage all your job applications in one place</CardDescription>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search companies, positions, or locations...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
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
                <TableHead>Outcome</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                    <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                  </TableCell>
                  <TableCell>{app.contactPerson}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{app.jobSource}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getOutcomeColor(app.outcome)}>{app.outcome}</Badge>
                  </TableCell>
                  <TableCell className='max-w-[200px]'>
                    <div
                      className='truncate text-sm text-muted-foreground'
                      title={app.notes}
                    >
                      {app.notes}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => window.open(app.jobLink, '_blank')}
                    >
                      <ExternalLink className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApplications.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='text-center py-8 text-muted-foreground'
                  >
                    No applications found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex items-center justify-between mt-4'>
          <div className='text-sm text-muted-foreground'>
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
