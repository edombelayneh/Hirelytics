// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import HomePage from './home/page';
// import AvailableJobsPage from './jobs/page';
// import MyApplicationsPage from './applications/page';
// import { Navbar } from './components/Navbar';
// import { Toaster, toast } from './components/ui/sonner';
// import { JobApplication } from './data/mockData';
// import { AvailableJob } from './data/availableJobs';
// import { parseLocation } from './utils/locationParser';
// import { getCurrentDateString } from './utils/dateFormatter';
// import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';


// type Page = 'home' | 'available' | 'applications';

// function LandingPage() {
// 	const [currentPage, setCurrentPage] = useState<Page>('home');
// 	const [applications, setApplications] = useState<JobApplication[]>([]);
// 	const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

// 	// Handle hash-based routing
// 	useEffect(() => {
// 		const handleHashChange = () => {
// 			const hash = window.location.hash.slice(1); // Remove the '#'
// 			if (hash === '/applications') {
// 				setCurrentPage('applications');
// 			} else if (hash === '/jobs') {
// 				setCurrentPage('available');
// 			} else {
// 				setCurrentPage('home');
// 			}
// 		};

// 		// Set initial page based on hash
// 		handleHashChange();

// 		// Listen for hash changes
// 		window.addEventListener('hashchange', handleHashChange);

// 		return () => {
// 			window.removeEventListener('hashchange', handleHashChange);
// 		};
// 	}, []);

// 	const handleApply = (job: AvailableJob) => {
// 		const { city, country } = parseLocation(job.location);

// 		// Create new application
// 		const newApplication: JobApplication = {
// 			id: `app-${Date.now()}`,
// 			company: job.company,
// 			country,
// 			city,
// 			jobLink: job.applyLink,
// 			position: job.title,
// 			applicationDate: getCurrentDateString(),
// 			status: 'Applied',
// 			contactPerson: '',
// 			notes: `Applied via job board. ${job.type} position.`,
// 			jobSource: 'Other',
// 			outcome: 'Pending',
// 		};

// 		setApplications((prev) => [newApplication, ...prev]);
// 		setAppliedJobIds((prev) => new Set(prev).add(job.id));

// 		toast.success(
// 			`Successfully applied to ${job.title} at ${job.company}!`,
// 			{
// 				description: 'Your application has been added to the tracker.',
// 			}
// 		);
// 	};

// 	return (
// 		<div className='min-h-screen bg-background'>
// 			<Toaster />

// 			{/* Header - Show on all pages */}
// 			<Navbar
// 				currentPage={currentPage}
// 				applicationCount={applications.length}
// 			/>

// 			{/* Main Content */}
// 			<main
// 				className={
// 					currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''
// 				}
// 			>
// 				{currentPage === 'home' && <HomePage />}

// 				{currentPage === 'available' && (
// 					<AvailableJobsPage
// 					//onApply={handleApply}
// 					//appliedJobIds={appliedJobIds}
// 					/>
// 				)}

// 				{currentPage === 'applications' && (
// 					<MyApplicationsPage applications={applications} />
// 				)}
// 			</main>
// 		</div>
// 	);
// }

// export default LandingPage;
// app/page.tsx (your LandingPage file)
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import HomePage from './home/page';
import AvailableJobsPage from './jobs/page';
import MyApplicationsPage from './applications/page';
import { Navbar } from './components/Navbar';
import { Toaster, toast } from './components/ui/sonner';
import { SignInButtonBridge, protectedAction } from './utils/protectedAction';

type Page = 'home' | 'available' | 'applications';

function LandingPage() {
  const { isSignedIn } = useAuth(); // Clerk status
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // ROUTER GUARD: signed-out users cannot navigate to protected hashes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // '/jobs', '/applications', or ''
      const next: Page =
        hash === '/applications' ? 'applications' : hash === '/jobs' ? 'available' : 'home';

      // if trying to access protected pages while signed out => bounce to 'home' + sign-in
      const isProtected = next === 'available' || next === 'applications';
      if (isProtected && !isSignedIn) {
        setCurrentPage('home');
        // show toast + open sign-in
        toast('Please sign in to continue', { description: 'This area is for members only.' });
        // open Clerk modal
        const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null;
        btn?.click();
      } else {
        setCurrentPage(next);
      }
    };

    // initial and subsequent
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* bridge to open Clerk modal programmatically */}
      <SignInButtonBridge />

      {/* Show app navbar ONLY for signed-in users */}
      {isSignedIn ? (
        <Navbar currentPage={currentPage} applicationCount={0 /* wire when ready */} />
      ) : null}

      {/* Main */}
      <main className={currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'available' && <AvailableJobsPage />}
        {currentPage === 'applications' && <MyApplicationsPage applications={[]} />}
      </main>
    </div>
  );
}

export default LandingPage;
