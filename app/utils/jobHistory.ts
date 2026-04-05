import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

export interface JobHistoryItem {
  id: string
  company: string
  title: string
  roleDescription: string
  startDate: string
  endDate: string
  createdAt?: unknown
}

interface AddJobHistoryInput {
  company: string
  title: string
  roleDescription: string
  startDate: string
  endDate: string
}

export async function getJobHistory(uid: string): Promise<JobHistoryItem[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'JobHistory'))

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<JobHistoryItem, 'id'>),
  }))
}

export async function addJobHistory(uid: string, item: AddJobHistoryInput) {
  const docRef = await addDoc(collection(db, 'users', uid, 'JobHistory'), {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function updateJobHistory(
  uid: string,
  jobHistoryId: string,
  item: {
    company: string
    title: string
    roleDescription: string
    startDate: string
    endDate: string
  }
) {
  await updateDoc(doc(db, 'users', uid, 'JobHistory', jobHistoryId), {
    ...item,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteJobHistory(uid: string, jobHistoryId: string) {
  await deleteDoc(doc(db, 'users', uid, 'JobHistory', jobHistoryId))
}
