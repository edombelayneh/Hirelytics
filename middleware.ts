import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isApplicantRoute = createRouteMatcher(['/applicant(.*)'])
const isRecruiterRoute = createRouteMatcher(['/recruiter(.*)'])
const isPublicRoute = createRouteMatcher(['/', '/home', '/role', '/api/(.*)'])

type Role = 'applicant' | 'recruiter'

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) return NextResponse.next()

  // Require auth for applicant/recruiter routes
  if (isApplicantRoute(req) || isRecruiterRoute(req)) {
    await auth.protect()
  }
  // If we require auth, we can be sure userId exists
  const { userId } = await auth()
  // If for some reason userId is missing, allow them to proceed to auth pages instead of blocking with an error
  if (!userId) return NextResponse.next()

  // Read role from the USER (not sessionClaims)
  const client = await clerkClient() // Get the full user object to access publicMetadata
  const user = await client.users.getUser(userId) // Role is stored in publicMetadata by our /api/user/role route
  const role = user.publicMetadata?.role as Role | undefined

  // If user has no role and is trying to access a protected route, redirect to role selection page
  if ((isApplicantRoute(req) || isRecruiterRoute(req)) && !role) {
    return NextResponse.redirect(new URL('/role', req.url))
  }

  // If user has a role but is trying to access the wrong section, redirect them to the correct section
  if (isApplicantRoute(req) && role !== 'applicant') {
    return NextResponse.redirect(new URL('/recruiter/myJobs', req.url))
  }
  // Note: The recruiter route is currently just the dashboard, but if we add more recruiter-specific routes in the future this will help prevent accidental access
  if (isRecruiterRoute(req) && role !== 'recruiter') {
    return NextResponse.redirect(new URL('/applicant/applications', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|map)$).*)'],
}
