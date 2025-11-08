// lib/getUserRole.ts
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { firestore } from './firebaseClient' // your firebase config

const db = firestore

export async function getUserRole(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    return userDoc.exists() ? userDoc.data().role : null
  } catch (err) {
    console.error('Error fetching user role:', err)
    return null
  }
}
