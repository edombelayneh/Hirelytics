import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

// Type representing a single job history entry from Firestore
export interface JobHistoryItem {
  id: string
  company: string
  title: string
  roleDescription: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

const JOB_HISTORY_COLLECTION = 'jobHistory'

// Input type for creating a new job history item
// (no id because Firestore generates it)
interface AddJobHistoryInput {
  company: string
  title: string
  roleDescription: string
  startDate: string
  endDate?: string
  isCurrent: boolean
}

// Fetch all job history entries for a user
// Ordered by most recent (newest first)
export async function getJobHistory(uid: string): Promise<JobHistoryItem[]> {
  const q = query(collection(db, 'users', uid, JOB_HISTORY_COLLECTION), orderBy('endDate', 'desc'))

  const snap = await getDocs(q)

  // Map Firestore docs into our typed objects
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<JobHistoryItem, 'id'>),
  }))
}

// Add a new job history entry for a user
export async function addJobHistory(uid: string, item: AddJobHistoryInput) {
  const docRef = await addDoc(collection(db, 'users', uid, JOB_HISTORY_COLLECTION), {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

// Update an existing job history entry
export async function updateJobHistory(
  uid: string,
  jobHistoryId: string,
  item: {
    company: string
    title: string
    roleDescription: string
    startDate: string
    endDate?: string
    isCurrent: boolean
  }
) {
  await updateDoc(doc(db, 'users', uid, JOB_HISTORY_COLLECTION, jobHistoryId), {
    ...item,
    updatedAt: serverTimestamp(),
  })
}

// Delete a job history entry
export async function deleteJobHistory(uid: string, jobHistoryId: string) {
  await deleteDoc(doc(db, 'users', uid, JOB_HISTORY_COLLECTION, jobHistoryId))
}
