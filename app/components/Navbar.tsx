'use client';

import { UserButton } from '@clerk/nextjs';
import { Home, Briefcase, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';

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
    <nav className="flex justify-between items-center border-b px-6 h-16 bg-background sticky top-0 z-50">
      {/* Left side - logo */}
      <div className="font-bold text-lg text-primary">Hirelytics</div>

      {/* Center - nav links */}
      <div className="flex gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.hash.slice(2);
          return (
            <a
              key={item.label}
              href={item.hash}
              className={`flex items-center gap-2 text-sm font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.label === 'My Applications' && (
                <span className="ml-1 text-xs bg-primary text-white px-1.5 rounded-full">
                  {applicationCount}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Right side - user avatar */}
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  );
}
