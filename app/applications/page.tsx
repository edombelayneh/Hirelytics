'use client'

import { memo } from 'react'
import { HeroPanel } from '../components/HeroPanel'
import { SummaryCards } from '../components/SummaryCards'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { JobApplication } from '../data/mockData'

interface MyApplicationsPageProps {
	applications: JobApplication[];
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
				<h2 className='text-xl font-semibold mb-4'>
					Dashboard Overview
				</h2>
				<HeroPanel applications={applications} />
			</section>

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
	);
});

export default MyApplicationsPage;
