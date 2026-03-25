'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User, Menu, X } from 'lucide-react'

type Role = 'applicant' | 'recruiter' | undefined

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  match: (pathname: string) => boolean
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Lock body scroll when menu is open (overlay)
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const metaRole = (user?.publicMetadata?.role as Role) ?? undefined
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

  const navItems: NavItem[] =
    role === 'recruiter'
      ? recruiterNav
      : role === 'applicant'
      ? applicantNav
      : [{ label: 'Home', href: '/', icon: Home, match: (p) => p === '/' }]

  const profileHref =
    role === 'recruiter' ? '/recruiter/profile' : role === 'applicant' ? '/applicant/profile' : '/'

  return (
    <>
      <nav className="relative flex items-center justify-between px-4 md:px-6 h-20 bg-background border-b sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="inline-block">
            <img
              src="/Hirelytics_Logo.png"
              alt="Hirelytics Logo"
              className="h-8 md:h-10 w-auto"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 lg:gap-12">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 text-base lg:text-xl ${
                  isActive
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Right side: User button + Hamburger */}
        <div className="flex items-center gap-2 md:gap-3">
          <UserButton afterSignOutUrl="/">
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Profile"
                labelIcon={<User className="h-4 w-4" />}
                onClick={() => router.push(profileHref)} // #5: router.push
              />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>

          {/* Hamburger button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground focus:outline-none"
            aria-expanded={isMenuOpen} // #1: aria-expanded
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu with CSS transition */}
      <div
        className={`
          md:hidden fixed inset-x-0 top-20 z-40 bg-background border-b shadow-lg
          transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
      >
        <div className="flex flex-col py-4 px-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 py-3 px-2 rounded-md text-base ${
                  isActive
                    ? 'bg-muted font-bold text-foreground'
                    : 'font-medium text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}