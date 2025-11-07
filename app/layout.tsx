import { type Metadata } from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hirelytics',
  description: 'Where job applications meet analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <head>
          <Script
            src='https://cdn.tailwindcss.com'
            strategy='afterInteractive'
          />
        </head>
        <body className='antialiased'>
          {/* SIGN-IN HEADER (visible only when signed out) */}
          <SignedOut>
            <header className='flex justify-end items-center p-4 gap-4 h-16 border-b'>
              <SignInButton mode='modal' />
              <SignUpButton mode='modal'>
                <button className='bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5'>
                  Sign Up
                </button>
              </SignUpButton>
            </header>
          </SignedOut>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
