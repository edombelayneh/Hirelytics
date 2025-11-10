import { memo } from 'react'
import { HeroPanel } from '../components/HeroPanel'
import { SummaryCards } from '../components/SummaryCards'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { JobApplication } from '../data/mockData'

import { firestore } from '../lib/firebaseClient'
import { doc, setDoc } from 'firebase/firestore'
import { useAuth } from '@clerk/nextjs'

function FirestoreTest() {
  const { userId } = useAuth()

  async function testWrite() {
    const ref = doc(firestore, 'users', userId!, 'applications', 'hello')
    await setDoc(ref, { test: true, createdAt: new Date() })
    alert('Wrote test doc!')
  }

  return (
    <button
      onClick={testWrite}
      className='bg-blue-500 text-white p-2 rounded'
    >
      Test Firestore Write
    </button>
  )
}
'use client'

import { memo } from 'react'
import { HeroPanel } from '../components/HeroPanel'
import { SummaryCards } from '../components/SummaryCards'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { JobApplication } from '../data/mockData'

interface MyApplicationsPageProps {
  applications: JobApplication[]
	onStatusChange?: (id: string, status: JobApplication['status']) => void;
	onNotesChange?: (id: string, notes: string) => void;
}

const MyApplicationsPage = memo(function MyApplicationsPage({
  applications,
	onStatusChange,
	onNotesChange,
}: MyApplicationsPageProps) {
  return (
    <div className='space-y-8'>
      {/* Hero Panel */}
      <section>
        <h2 className='text-xl font-semibold mb-4'>Dashboard Overview</h2>
        <HeroPanel applications={applications} />
      </section>

      {/* Testing Firebase Storage FIXME: DELETE LATER */}
      <FirestoreTest />

      {/* Summary Cards */}
      <section>
        <h2 className='text-xl font-semibold mb-4'>Key Metrics</h2>
        <SummaryCards applications={applications} />
      </section>

      {/* Applications Table */}
      <section>
        <ApplicationsTable
					applications={applications}
					onStatusChange={onStatusChange}
					onNotesChange={onNotesChange}
				/>
      </section>
    </div>
  )
})

export default MyApplicationsPage
