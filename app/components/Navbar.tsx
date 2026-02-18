'use client'

import { UserButton } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User } from 'lucide-react'

// FIXME: Navbar currenly has pages dedicated only to applicants
// Make sure to add recruiter-specific pages and links later after we finish adding firebase listeners to our pages

export function Navbar({ currentPage }: { currentPage: string }) {
  const navItems = [
    { label: 'Home', hash: '#/', icon: Home, page: 'home' },
    { label: 'Available Jobs', hash: '#/jobs', icon: Briefcase, page: 'available' },
    { label: 'My Applications', hash: '#/applications', icon: BarChart3, page: 'applications' },
  ]

  return (
    <nav className='relative flex items-center justify-center border-b px-6 h-20 bg-background sticky top-0 z-50'>
      {/* Left - Logo Section */}
      <div className='absolute left-6 flex flex-col'>
        <a
          href='#/'
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
      <div className='flex gap-12'>
        {navItems.map((item) => {
          const Icon = item.icon

          const isActive = currentPage === item.page

          return (
            <a
              key={item.label}
              href={item.hash}
              className={`flex items-center gap-3 text-xl ${
                isActive
                  ? 'font-bold text-foreground'
                  : 'font-medium text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className='h-6 w-6' />
              {item.label}

              {/* Notification badge (TEMPORARILY DISABLED)
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
      <div className='absolute right-6 flex items-center gap-3'>
        {/* Right Side - User Account Button */}
        <UserButton afterSignOutUrl='/'>
          <UserButton.MenuItems>
            <UserButton.Action
              label='My Profile'
              labelIcon={<User className='h-4 w-4' />}
              onClick={() => {
                window.location.hash = '#/profile'
              }}
            />
            <UserButton.Action label='manageAccount' />
            <UserButton.Action label='signOut' />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </nav>
  )
}
