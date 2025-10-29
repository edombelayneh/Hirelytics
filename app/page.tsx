'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { HomePage } from './home/page';
import AvailableJobsPage from './jobs/page';
import { MyApplicationsPage } from './applications/page';
import { Navbar } from './components/Navbar';
import { Toaster, toast } from './components/ui/sonner';
import { JobApplication } from './data/mockData';
import { AvailableJob } from './data/availableJobs';
import { parseLocation } from './utils/locationParser';
import { getCurrentDateString } from './utils/dateFormatter';

type Page = 'home' | 'available' | 'applications';

export default function LandingPage() {
	const [currentPage, setCurrentPage] = useState<Page>('home');
	const [applications, setApplications] = useState<JobApplication[]>([]);
	const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

	// Handle hash-based routing
	useEffect(() => {
		const handleHashChange = () => {
			const hash = window.location.hash.slice(1); // Remove the '#'
			if (hash === '/applications') {
				setCurrentPage('applications');
			} else if (hash === '/jobs') {
				setCurrentPage('available');
			} else {
				setCurrentPage('home');
			}
		};

		// Set initial page based on hash
		handleHashChange();

		// Listen for hash changes
		window.addEventListener('hashchange', handleHashChange);

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		};
	}, []);

	const handleApply = (job: AvailableJob) => {
		const { city, country } = parseLocation(job.location);

		// Create new application
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

		setApplications((prev) => [newApplication, ...prev]);
		setAppliedJobIds((prev) => new Set(prev).add(job.id));

		toast.success(
			`Successfully applied to ${job.title} at ${job.company}!`,
			{
				description: 'Your application has been added to the tracker.',
			}
		);
	};

	return (
		<div className='min-h-screen bg-background'>
			<Toaster />

			{/* Header - Show on all pages */}
			<Navbar
				currentPage={currentPage}
				applicationCount={applications.length}
			/>

			{/* Main Content */}
			<main
				className={
					currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''
				}
			>
				{currentPage === 'home' && <HomePage />}

				{currentPage === 'available' && (
					<AvailableJobsPage
					//onApply={handleApply}
					//appliedJobIds={appliedJobIds}
					/>
				)}

				{currentPage === 'applications' && (
					<MyApplicationsPage applications={applications} />
				)}
			</main>
		</div>
	);
}
