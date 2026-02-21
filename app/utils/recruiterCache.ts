// Manages fetching and caching recruiter data from Firebase
// Avoids repeated Firestore queries by storing recruiters in memory

import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import type { RecruiterProfile } from './userProfiles'
import type { AvailableJob } from '../data/availableJobs'

export interface RecruiterInfo {
  uid: string
  profile: RecruiterProfile
}

// In-memory cache to store recruiters and avoid repeated Firebase queries
let recruiterCache: RecruiterInfo[] | null = null
let cacheFetched = false

/**
 * Fetch all recruiters from Firebase and cache them
 * Queries the users collection for documents with recruiterProfile field
 * Returns a list of recruiter UIDs and their company info
 */
export async function fetchAllRecruiters(): Promise<RecruiterInfo[]> {
  // Return cached data if already fetched
  if (cacheFetched) {
    return recruiterCache || []
  }

  try {
    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)

    const recruiters: RecruiterInfo[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Check if this user has a recruiter profile
      if (data.recruiterProfile) {
        recruiters.push({
          uid: doc.id,
          profile: data.recruiterProfile,
        })
      }
    })

    recruiterCache = recruiters
    cacheFetched = true
    return recruiters
  } catch (error) {
    console.error('Error fetching recruiters from Firebase:', error)
    cacheFetched = true
    recruiterCache = []
    return []
  }
}

/**
 * Get a random recruiter UID from the cached recruiters
 * Used for randomly assigning jobs to recruiters
 */
export function getRandomRecruiterUid(): string {
  if (!recruiterCache || recruiterCache.length === 0) {
    return 'recruiter-uid-placeholder'
  }
  const randomIndex = Math.floor(Math.random() * recruiterCache.length)
  return recruiterCache[randomIndex].uid
}

/**
 * Get all recruiter UIDs from cache
 */
export function getAllRecruiterUids(): string[] {
  if (!recruiterCache) {
    return []
  }
  return recruiterCache.map((r) => r.uid)
}

/**
 * Assign recruiters to jobs in a stable, deterministic way
 * Ensures every mock job has a recruiter UID attached
 */
export function assignRecruitersToJobs(
  jobs: AvailableJob[],
  recruiterUids: string[]
): AvailableJob[] {
  if (recruiterUids.length === 0) {
    return jobs
  }

  const sortedUids = [...recruiterUids].sort()

  return jobs.map((job, index) => ({
    ...job,
    recruiterId: sortedUids[index % sortedUids.length],
  }))
}

/**
 * Clear the cache (useful for testing or refreshing)
 */
export function clearRecruiterCache(): void {
  recruiterCache = null
  cacheFetched = false
}
