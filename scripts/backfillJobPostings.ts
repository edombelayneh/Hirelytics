#!/usr/bin/env node
/*
 Backfill missing fields in the `jobPostings` collection.

 Usage:
  - Set `GOOGLE_APPLICATION_CREDENTIALS` to the service account JSON path.
  - Run: `node ./scripts/backfillJobPostings.ts` (requires ts-node or compile to JS).

 This script uses the Firebase Admin SDK to set sane defaults for missing fields so
 jobs are not excluded by `AvailableJobsList`'s required-field check.
*/

import admin from 'firebase-admin'

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Please set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file.')
    process.exit(1)
  }

  admin.initializeApp({ credential: admin.credential.applicationDefault() })
  const db = admin.firestore()

  const snap = await db.collection('jobPostings').get()
  console.log(`Found ${snap.size} job postings`)

  let updated = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const updates: Record<string, unknown> = {}

    if (!data.location) {
      updates.location = data.jobType === 'remote' ? 'Remote' : 'Unspecified'
    }

    if (!data.salary) {
      updates.salary = 'Not specified'
    }

    if (!data.description) {
      updates.description = 'No description provided.'
    }

    if (!data.postedDate) {
      updates.postedDate = new Date().toISOString().split('T')[0]
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates)
      console.log(`Updated ${doc.id}:`, updates)
      updated += 1
    }
  }

  console.log(`Backfill complete — updated ${updated} documents.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
