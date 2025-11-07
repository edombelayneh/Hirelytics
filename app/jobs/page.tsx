'use client';

import { AvailableJobsList } from '../components/AvailableJobsList';
import { useState } from 'react';
import { AvailableJob } from '../data/availableJobs';
import { JobApplication } from '../data/mockData';
import { parseLocation } from '../utils/locationParser';
import { getCurrentDateString } from '../utils/dateFormatter';

export default function JobsPage() {
	const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

	const handleApply = (job: AvailableJob) => {
		const { city, country } = parseLocation(job.location);
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
		};
		setAppliedJobIds(prev => new Set(prev).add(job.id));
		// TODO: Add global state management for applications
	};

	return (
		<div className='min-h-screen bg-background'>
			<header className='border-b'>
				<div className='container mx-auto px-6 py-4'>
					{/* Header area for future navigation or controls */}
				</div>
			</header>
			<main className='container mx-auto px-6 py-8 space-y-8'>
				<section>
					<AvailableJobsList onApply={handleApply} appliedJobIds={appliedJobIds} />
				</section>
			</main>
		</div>
	);
}
