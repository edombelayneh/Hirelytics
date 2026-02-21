'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User, PlusCircle } from 'lucide-react'

type Role = 'applicant' | 'recruiter' | undefined

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  match: (pathname: string) => boolean
}

export function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()

  // 1) prefer Clerk metadata
  const metaRole = (user?.publicMetadata?.role as Role) ?? undefined

  // 2) fallback infer role from route prefix (helps before metadata shows up)
  const inferredRole: Role = pathname.startsWith('/recruiter')
    ? 'recruiter'
    : pathname.startsWith('/applicant')
      ? 'applicant'
      : undefined

  const role = metaRole ?? inferredRole

  const applicantNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
      match: (p) => p.startsWith('/applicant/jobs'),
    },
    {
      label: 'My Applications',
      href: '/applicant/applications',
      icon: BarChart3,
      match: (p) => p.startsWith('/applicant/applications'),
    },
  ]

  const recruiterNav: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home, match: (p) => p === '/home' },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
      match: (p) => p.startsWith('/applicant/jobs'),
    },
    {
      label: 'My Jobs',
      href: '/recruiter/myJobs',
      icon: Briefcase,
      match: (p) => p.startsWith('/recruiter/myJobs') || p.startsWith('/recruiter/jobDetails'),
    },
  ]

  // Never render empty nav — show at least Home until role resolves
  const navItems: NavItem[] =
    role === 'recruiter'
      ? recruiterNav
      : role === 'applicant'
        ? applicantNav
        : [{ label: 'Home', href: '/', icon: Home, match: (p) => p === '/' }]

  const profileHref =
    role === 'recruiter' ? '/recruiter/profile' : role === 'applicant' ? '/applicant/profile' : '/' // fallback

  return (
    <nav className='relative flex items-center justify-center border-b px-6 h-20 bg-background sticky top-0 z-50'>
      {/* Left - Logo */}
      <div className='absolute left-6 flex flex-col'>
        <Link
          href='/'
          className='inline-block'
        >
          <img
            src='/Hirelytics_Logo.png'
            alt='Hirelytics Logo'
            className='h-10 w-auto'
          />
        </Link>
      </div>

      {/* Center - Nav Links */}
      <div className='flex gap-12'>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.match(pathname)

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 text-xl ${
                isActive
                  ? 'font-bold text-foreground'
                  : 'font-medium text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className='h-6 w-6' />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Right - User menu */}
      <div className='absolute right-6 flex items-center gap-3'>
        <UserButton afterSignOutUrl='/'>
          <UserButton.MenuItems>
            <UserButton.Action
              label='My Profile'
              labelIcon={<User className='h-4 w-4' />}
              onClick={() => {
                window.location.href = profileHref
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
