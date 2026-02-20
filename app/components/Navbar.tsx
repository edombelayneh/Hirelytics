'use client'

import React from 'react'
import { UserButton } from '@clerk/nextjs'

// Icons used for navbar navigation items
import { Home, Briefcase, BarChart3, User } from 'lucide-react'

// FIXME: Navbar currently has pages dedicated only to applicants
// Recruiter-specific links should be added after Firebase listeners are implemented

export function Navbar({ currentPage }: { currentPage: string }) {
  // Configuration for center navigation links
  // "page" is used to determine which link is active
  const navItems = [
    { label: 'Home', hash: '#/', icon: Home, page: 'home' },
    { label: 'Available Jobs', hash: '#/jobs', icon: Briefcase, page: 'available' },
    { label: 'My Applications', hash: '#/applications', icon: BarChart3, page: 'applications' },
  ]

  return (
    // Main navbar container
    // sticky + top-0 keeps navbar fixed at top when scrolling
    <nav className='relative flex items-center justify-center border-b px-6 h-20 bg-background sticky top-0 z-50'>
      {/* Left - Logo Section */}
      {/* Positioned absolute so center navigation stays centered */}
      <div className='absolute left-6 flex flex-col'>
        <a
          href='#/' // Navigates back to home page
          className='inline-block'
        >
          <img
            src='../Hirelytics_Logo.png'
            alt='Hirelytics Logo'
            className='h-10 w-auto'
          />
        </a>
      </div>

      {/* Center - Navigation Links */}
      {/* Iterates over navItems to render each link */}
      <div className='flex gap-12'>
        {navItems.map((item) => {
          const Icon = item.icon

          // Determines if this link corresponds to the current page
          const isActive = currentPage === item.page

          return (
            <a
              key={item.label}
              href={item.hash} // Hash-based routing
              className={`flex items-center gap-3 text-xl ${
                isActive
                  ? 'font-bold text-foreground' // Active link styling
                  : 'font-medium text-muted-foreground hover:text-foreground' // Default styling
              }`}
            >
              {/* Navigation icon */}
              <Icon className='h-6 w-6' />

              {/* Navigation label */}
              {item.label}

              {/* Notification badge (TEMPORARILY DISABLED)
              Placeholder for showing counts like number of applications
              {item.label === 'My Applications' && (
                <span className="ml-1 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                  {applicationCount}
                </span>
              )} */}
            </a>
          )
        })}
      </div>

      {/* Right Side - User Account Button */}
      {/* Contains Clerk user profile dropdown */}
      <div className='absolute right-6 flex items-center gap-3'>
        {/* Right Side - User Account Button */}
        <UserButton afterSignOutUrl='/'>
          <UserButton.MenuItems>
            {/* Custom menu item to navigate to profile page */}
            <UserButton.Action
              label='My Profile'
              labelIcon={<User className='h-4 w-4' />}
              onClick={() => {
                // Updates URL hash to profile route
                window.location.hash = '#/profile'
              }}
            />

            {/* Clerk built-in account management option */}
            <UserButton.Action label='manageAccount' />

            {/* Clerk built-in sign out option */}
            <UserButton.Action label='signOut' />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </nav>
  )
}
