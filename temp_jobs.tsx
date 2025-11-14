'use client'

// import { HeroPanel } from './app/components/HeroPanel'
import { SummaryCards } from './app/components/SummaryCards'
import { AvailableJobsList } from './app/components/AvailableJobsList'
import { Button } from './app/components/ui/button'
import { Plus, Download, Settings } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './app/components/ui/dialog'
import { Input } from './app/components/ui/input'
import { AvailableJob } from './app/data/availableJobs'
import { JobApplication } from './app/data/mockData'
import { parseLocation } from './app/utils/locationParser'
import { getCurrentDateString } from './app/utils/dateFormatter'
import { toast } from './app/components/ui/sonner'

function Jobs({ onAddApplication }: { onAddApplication?: (app: JobApplication) => void }) {
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ company: '', position: '' })

  const handleApply = (job: AvailableJob) => {
    const { city, country } = parseLocation(job.location)
    const newApplication: JobApplication = {
      id: `app-${Date.now()}`,
      company: job.company,
      country,
      city,
      jobLink: job.applyLink,
      position: job.title,
      applicationDate: getCurrentDateString(),
      status: 'Applied',
      contactPerson: '',
      notes: `Applied via job board. ${job.type} position.`,
      jobSource: 'Other',
      outcome: 'Pending',
    }
    if (onAddApplication) onAddApplication(newApplication)
    setAppliedJobIds((prev) => new Set(prev).add(job.id))

    // Show success toast
    toast.success(`Successfully applied to ${job.title} at ${job.company}!`, {
      description: 'Your application has been added to the tracker.',
    })

    // Navigate to applications tab
    window.location.hash = '/applications'
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company || !form.position) return
    const newApp: JobApplication = {
      id: `manual-${Date.now()}`,
      company: form.company,
      position: form.position,
      country: '',
      city: '',
      jobLink: '',
      applicationDate: getCurrentDateString(),
      status: 'Applied',
      contactPerson: '',
      notes: '',
      jobSource: 'Other',
      outcome: 'Pending',
    }
    if (onAddApplication) onAddApplication(newApp)
    setModalOpen(false)
    setForm({ company: '', position: '' })

    // Show success toast
    toast.success(`Successfully added ${form.position} at ${form.company}!`, {
      description: 'Your application has been added to the tracker.',
    })

    // Navigate to applications tab
    window.location.hash = '/applications'
  }

  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b'>
        <div className='container mx-auto px-6 py-4'>
          <div className='flex justify-end'>
            <Dialog
              open={modalOpen}
              onOpenChange={setModalOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size='sm'
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Application</DialogTitle>
                </DialogHeader>
                <form
                  className='space-y-3'
                  onSubmit={handleFormSubmit}
                >
                  <Input
                    name='company'
                    value={form.company}
                    onChange={handleFormChange}
                    placeholder='Company'
                    required
                  />
                  <Input
                    name='position'
                    value={form.position}
                    onChange={handleFormChange}
                    placeholder='Position'
                    required
                  />
                  <Button
                    type='submit'
                    variant='default'
                  >
                    Save
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <main className='container mx-auto px-6 py-8 space-y-8'>
        <section>
          <AvailableJobsList
            onApply={handleApply}
            appliedJobIds={appliedJobIds}
          />
        </section>
      </main>
    </div>
  )
}

export default Jobs
