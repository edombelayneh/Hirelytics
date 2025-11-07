import { HeroPanel } from '../components/HeroPanel'
import { SummaryCards } from '../components/SummaryCards'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { Button } from '../components/ui/button'
import { Plus, Download, Settings } from 'lucide-react'

function jobs() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b'>
        <div className='container mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>Job Application Tracker</h1>
              <p className='text-muted-foreground'>Manage and track your job search progress</p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
              >
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
              <Button
                variant='outline'
                size='sm'
              >
                <Settings className='h-4 w-4 mr-2' />
                Settings
              </Button>
              <Button size='sm'>
                <Plus className='h-4 w-4 mr-2' />
                Add Application
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-6 py-8 space-y-8'>
        {/* Hero Panel */}
        <section>
          <h2 className='text-xl font-semibold mb-4'>Dashboard Overview</h2>
          <HeroPanel applications={[]} />
        </section>

        {/* Summary Cards */}
        <section>
          <h2 className='text-xl font-semibold mb-4'>Key Metrics</h2>
          <SummaryCards applications={[]} />
        </section>

        {/* Applications Table */}
        <section>
          <ApplicationsTable applications={[]} />
        </section>
      </main>
    </div>
  )
}

export default jobs
