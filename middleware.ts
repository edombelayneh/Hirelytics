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

  const { userId } = await auth()
  if (!userId) return NextResponse.next()

  // ✅ Read role from the USER (not sessionClaims)
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = user.publicMetadata?.role as Role | undefined

  // No role → force role picker
  if ((isApplicantRoute(req) || isRecruiterRoute(req)) && !role) {
    return NextResponse.redirect(new URL('/role', req.url))
  }

  // Wrong role → redirect
  if (isApplicantRoute(req) && role !== 'applicant') {
    return NextResponse.redirect(new URL('/recruiter/myJobs', req.url))
  }

  if (isRecruiterRoute(req) && role !== 'recruiter') {
    return NextResponse.redirect(new URL('/applicant/applications', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|map)$).*)'],
}
