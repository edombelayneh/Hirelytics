'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import HomePage from './home/page';
import AvailableJobsPage from './jobs/page';
import MyApplicationsPage from './applications/page';
import { Navbar } from './components/Navbar';
import { Toaster, toast } from './components/ui/sonner';
import { SignInButtonBridge, protectedAction } from './utils/protectedAction';
import { linkClerkToFirebase } from './utils/linkClerkToFirebase';
import { signOut as fbSignOut } from 'firebase/auth';
import { firebaseAuth } from './lib/firebaseClient';

type Page = 'home' | 'available' | 'applications';

function LandingPage() {
  const { isSignedIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // signed-out users cannot navigate to protected hashes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const next: Page =
        hash === '/applications' ? 'applications' : hash === '/jobs' ? 'available' : 'home';

      // if trying to access protected pages while signed out => bounce to 'home' + sign-in
      const isProtected = next === 'available' || next === 'applications';
      if (isProtected && !isSignedIn) {
        setCurrentPage('home');
        toast('Please sign in to continue', { description: 'This area is for members only.' });
        const btn = document.getElementById('__sign_in_bridge__') as HTMLButtonElement | null;
        btn?.click();
      } else {
        setCurrentPage(next);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSignedIn]);

  // Link Clerk to Firebase when user signs in
  useEffect(() => {
    if (isSignedIn) {
      linkClerkToFirebase()
        .then(() => console.log('Clerk linked to Firebase'))
        .catch((err) => console.error('Firebase link error', err));
    } else {
      // Sign out of Firebase when Clerk signs out
      fbSignOut(firebaseAuth).catch(() => {});
    }
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <SignInButtonBridge />

      {/* Show app navbar ONLY for signed-in users */}
      {isSignedIn ? <Navbar currentPage={currentPage} applicationCount={0} /> : null}

      <main className={currentPage !== 'home' ? 'container mx-auto px-6 py-8' : ''}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'available' && <AvailableJobsPage />}
        {currentPage === 'applications' && <MyApplicationsPage applications={[]} />}
      </main>
    </div>
  );
}

export default LandingPage;
