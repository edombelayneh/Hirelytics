import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isApplicantRoute = createRouteMatcher(['/applicant(.*)'])
const isRecruiterRoute = createRouteMatcher(['/recruiter(.*)'])

// Optional: allow these public routes without auth
const isPublicRoute = createRouteMatcher(['/', '/home', '/api/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Public pages can be visited by anyone
  if (isPublicRoute(req)) return NextResponse.next()

  // Protect applicant + recruiter route groups
  if (isApplicantRoute(req) || isRecruiterRoute(req)) {
    await auth.protect()
  }

  // Role gating (only after we know they’re signed in)
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.next()

  // IMPORTANT:
  // This reads the role from Clerk publicMetadata included in JWT claims.
  // Make sure you actually set publicMetadata.role like you’re doing.
  const role = (sessionClaims?.publicMetadata as any)?.role as 'applicant' | 'recruiter' | undefined

  // If they have no role yet, force them to role picker (or /home)
  if ((isApplicantRoute(req) || isRecruiterRoute(req)) && !role) {
    return NextResponse.redirect(new URL('/role', req.url))
  }

  // Enforce correct role per route group
  if (isApplicantRoute(req) && role !== 'applicant') {
    return NextResponse.redirect(new URL('/recruiter/myJobs', req.url))
  }

  if (isRecruiterRoute(req) && role !== 'recruiter') {
    return NextResponse.redirect(new URL('/applicant/applications', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Run middleware on all app routes except Next internals + static files
    '/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|map)$).*)',
  ],
}
