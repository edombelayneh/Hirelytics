'use client'

import { useState, useEffect } from 'react'
import type { ElementType } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Home, Briefcase, BarChart3, User, Menu, X } from 'lucide-react'
import { useUnreadFeedbackCount } from '../hooks/useUnreadFeedbackCount'

/**
 * User roles that control which navigation links appear.
 * undefined means the app could not determine the user's role yet.
 */
type Role = 'applicant' | 'recruiter' | undefined

/**
 * One navigation item shown in either the desktop or mobile menu.
 *
 * icon:
 *   The Lucide icon component that should render next to the label.
 *
 * match():
 *   A helper function that decides whether the current pathname should
 *   mark this nav item as active.
 */
type NavItem = {
  label: string
  href: string
  icon: ElementType
  match: (pathname: string) => boolean
  /** Notification count shown as a badge next to the label. Hidden when 0. */
  badge?: number
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  /**
   * Stores the pathname where the mobile menu was opened.
   *
   * Why this is useful:
   * If the route changes, the stored path no longer matches the current path,
   * so the menu automatically counts as closed without needing extra logic.
   */
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null)

  /**
   * The mobile menu is only considered open if it was opened on
   * the same route the user is currently viewing.
   */
  const isMenuOpen = menuOpenPath === pathname

  /**
   * Prevent the page behind the mobile menu from scrolling while the menu is open.
   *
   * Important:
   * We capture the previous overflow value before changing it, then restore it
   * during cleanup. This avoids accidentally wiping out a body overflow style
   * that may already be controlled by another overlay, drawer, or modal.
   */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

  /**
   * Primary role source:
   * Clerk public metadata is the most trustworthy role source when available.
   */
  const metaRole = (user?.publicMetadata?.role as Role) ?? undefined

  /**
   * Fallback role source:
   * If metadata is missing, infer the role from the pathname.
   */
  const inferredRole: Role = pathname.startsWith('/recruiter')
    ? 'recruiter'
    : pathname.startsWith('/applicant')
      ? 'applicant'
      : undefined

  /**
   * Final role resolution:
   * Metadata wins over route inference because it reflects the actual user record.
   */
  const role = metaRole ?? inferredRole

  /** Count of applications with unread recruiter feedback. Only subscribed for applicants. */
  const unreadFeedbackCount = useUnreadFeedbackCount(role === 'applicant')

  /**
   * Navigation shown to applicants.
   */
  const applicantNav: NavItem[] = [
    {
      label: 'Home',
      href: '/home',
      icon: Home,
      match: (currentPath) => currentPath === '/home',
    },
    {
      label: 'Available Jobs',
      href: '/applicant/jobs',
      icon: Briefcase,
      match: (currentPath) => currentPath.startsWith('/applicant/jobs'),
    },
    {
      label: 'My Applications',
      href: '/applicant/applications',
      icon: BarChart3,
      match: (currentPath) => currentPath.startsWith('/applicant/applications'),
      badge: unreadFeedbackCount,
    },
  ]

  /**
   * Navigation shown to recruiters.
   */
  const recruiterNav: NavItem[] = [
    {
      label: 'Home',
      href: '/home',
      icon: Home,
      match: (currentPath) => currentPath === '/home',
    },
    {
      label: 'Available Jobs',
      href: '/recruiter/jobs',
      icon: Briefcase,
      match: (currentPath) => currentPath.startsWith('/recruiter/jobs'),
    },
    {
      label: 'My Jobs',
      href: '/recruiter/myJobs',
      icon: Briefcase,
      /**
       * This covers both the main recruiter jobs page and any related detail page
       * that should still highlight "My Jobs" as the active section.
       */
      match: (currentPath) =>
        currentPath.startsWith('/recruiter/myJobs') ||
        currentPath.startsWith('/recruiter/jobDetails'),
    },
  ]

  /**
   * Choose which nav set to render.
   *
   * If the role is unknown, show a minimal fallback navigation so the user
   * still has a safe route available.
   */
  const navItems: NavItem[] =
    role === 'recruiter'
      ? recruiterNav
      : role === 'applicant'
        ? applicantNav
        : [
            {
              label: 'Home',
              href: '/',
              icon: Home,
              match: (currentPath) => currentPath === '/',
            },
          ]

  /**
   * The profile route depends on the current user role.
   * If no role is known, send the user to the root path instead.
   */
  const profileHref =
    role === 'recruiter' ? '/recruiter/profile' : role === 'applicant' ? '/applicant/profile' : '/'

  /**
   * Toggle the mobile menu.
   *
   * If the menu is already open on this path, close it.
   * Otherwise, open it and remember which path it belongs to.
   */
  const handleMenuToggle = () => {
    setMenuOpenPath((prevPath) => (prevPath === pathname ? null : pathname))
  }

  /**
   * Close the mobile menu after a navigation link is clicked.
   * This keeps the UI clean and avoids leaving the overlay visible.
   */
  const handleMobileNavClick = () => {
    setMenuOpenPath(null)
  }

  /**
   * Handles the custom "My Profile" action inside the Clerk menu.
   *
   * This uses router.push instead of window.location.href so navigation
   * stays consistent with the rest of the app's client-side routing.
   */
  const handleProfileClick = () => {
    router.push(profileHref)
  }

  return (
    <>
      <nav className='relative sticky top-0 z-50 flex h-20 items-center justify-center border-b bg-background px-4 lg:px-6'>
        {/* Logo is pinned to the left side of the navbar on all screen sizes. */}
        <div className='absolute left-4 flex items-center lg:left-6'>
          <Link
            href='/'
            className='inline-block'
          >
            <img
              src='/Hirelytics_Logo.png'
              alt='Hirelytics Logo'
              className='h-8 w-auto lg:h-10'
            />
          </Link>
        </div>

        {/* Desktop navigation is hidden on smaller screens and shown on large screens and up. */}
        <div
          className='hidden gap-6 lg:flex xl:gap-12'
          data-testid='desktop-nav'
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 text-base xl:text-xl ${
                  isActive
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className='h-5 w-5 xl:h-6 xl:w-6' />
                <span className='relative'>
                  {item.label}
                  {!!item.badge && (
                    <span className='absolute -top-3 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold leading-none text-white'>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Right side contains the Clerk user menu and the mobile hamburger button. */}
        <div className='absolute right-4 flex items-center gap-2 lg:right-6 lg:gap-3'>
          <UserButton afterSignOutUrl='/'>
            <UserButton.MenuItems>
              {/* Custom profile shortcut that routes based on the current role. */}
              <UserButton.Action
                label='My Profile'
                labelIcon={<User className='h-4 w-4' />}
                onClick={handleProfileClick}
              />

              {/* Standard Clerk menu actions. */}
              <UserButton.Action label='manageAccount' />
              <UserButton.Action label='signOut' />
            </UserButton.MenuItems>
          </UserButton>

          {/* Hamburger button only appears on smaller screens. */}
          <button
            onClick={handleMenuToggle}
            className='rounded-md p-2 text-foreground lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            type='button'
          >
            {isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
          </button>
        </div>
      </nav>

      {/* Mobile and tablet navigation drawer. */}
      <div
        data-testid='mobile-nav'
        className={`
          fixed inset-x-0 top-20 z-40 border-b bg-background shadow-lg transition-all duration-300 ease-in-out lg:hidden
          ${isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}
        `}
      >
        <div className='flex flex-col gap-2 px-4 py-4'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.match(pathname)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-2 py-3 text-base ${
                  isActive
                    ? 'bg-muted font-bold text-foreground'
                    : 'font-medium text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={handleMobileNavClick}
              >
                <Icon className='h-5 w-5' />
                <span className='relative'>
                  {item.label}
                  {!!item.badge && (
                    <span className='absolute -top-3 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold leading-none text-white'>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
