'use client';

import { UserButton } from '@clerk/nextjs';
import { Home, Briefcase, BarChart3 } from 'lucide-react';

export function Navbar({
  currentPage,
  applicationCount,
}: {
  currentPage: string;
  applicationCount: number;
}) {
  const navItems = [
    { label: 'Home', hash: '#/', icon: Home },
    { label: 'Available Jobs', hash: '#/jobs', icon: Briefcase },
    { label: 'My Applications', hash: '#/applications', icon: BarChart3 },
  ];

  return (
    <nav className='relative flex items-center justify-center border-b px-6 h-20 bg-background sticky top-0 z-50'>
      {/* Left - Logo Section */}
      <div className='absolute left-6 flex flex-col'>
        <a href='#/' className='inline-block'>
          <img src='../Hirelytics_Logo.png' alt='Hirelytics Logo' className='h-10 w-auto' />
        </a>
      </div>

      {/* Center - Navigation Links */}
      <div className='flex gap-12'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.hash.slice(2);

          return (
            <a
              key={item.label}
              href={item.hash}
              className={`flex items-center gap-3 text-xl font-bold ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Nav Item Icon */}
              <Icon className='h-6 w-6' />

              {/* Nav Item Text */}
              {item.label}

              {/* ----------------------------------------------------- */}
              {/* Notification badge (TEMPORARILY DISABLED)            */}
              {/* This used to show applicationCount next to the text */}
              {/* Uncomment when ready to display notification bubble */}
              {/* ----------------------------------------------------- */}
              {/*
              {item.label === 'My Applications' && (
                <span className="ml-1 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                  {applicationCount}
                </span>
              )}
              */}
            </a>
          );
        })}
      </div>

      {/* Right Side - User Account Button */}
      <div className='absolute right-6 flex items-center gap-3'>
        <UserButton afterSignOutUrl='/' />
      </div>
    </nav>
  );
}
