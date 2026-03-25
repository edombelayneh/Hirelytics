```md
# Hirelytics Status Ownership Implementation Guide

## Goal
Make application status recruiter-controlled for Hirelytics-hosted jobs:
1. Applicant can view status but cannot change it for Hirelytics rows.
2. Recruiter can update status from the recruiter job details applicant table.
3. Status update is saved to Firebase and reflected on applicant side in realtime.

---

## Step 1: Add applicant-side guard for status writes

### File
[app/applicant/applications/page.tsx](app/applicant/applications/page.tsx)

### Where
Replace the existing `handleStatusChange` function around [app/applicant/applications/page.tsx#L58](app/applicant/applications/page.tsx#L58)

### Snippet
    const handleStatusChange = async (id: string, status: JobApplication['status']) => {
      if (!isLoaded || !userId) return

      const target = liveApplications.find((app) => app.id === id)
      if (!target) return

      // Hirelytics-hosted jobs are recruiter-managed
      if (target.jobSource === 'Hirelytics') return

      await updateDoc(doc(db, 'users', userId, 'applications', id), {
        status,
        updatedAt: serverTimestamp(),
      })
    }

### Verify
1. External applications still allow status change.
2. Hirelytics applications no longer update status from applicant page.

---

## Step 2: Disable applicant status dropdown for Hirelytics rows

### File
[app/components/ApplicationsTable.tsx](app/components/ApplicationsTable.tsx)

### Where A
Add helper inside component, after `filteredApplications` is computed.

### Snippet A
    const isRecruiterManaged = (app: JobApplication) => app.jobSource === 'Hirelytics'

### Where B
Replace the Status column Select block in the row render section.

### Snippet B
    <TableCell>
      <Select
        value={app.status}
        disabled={isRecruiterManaged(app)}
        onValueChange={(status) => {
          if (isRecruiterManaged(app)) return
          onStatusChange?.(app.id, status as JobApplication['status'])
        }}
      >
        <SelectTrigger className={`w-[120px] ${STATUS_STYLES[app.status] ?? ''}`}>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='Applied' className={STATUS_STYLES.Applied}>
            Applied
          </SelectItem>
          <SelectItem value='Interview' className={STATUS_STYLES.Interview}>
            Interview
          </SelectItem>
          <SelectItem value='Offer' className={STATUS_STYLES.Offer}>
            Offer
          </SelectItem>
          <SelectItem value='Rejected' className={STATUS_STYLES.Rejected}>
            Rejected
          </SelectItem>
          <SelectItem value='Withdrawn' className={STATUS_STYLES.Withdrawn}>
            Withdrawn
          </SelectItem>
        </SelectContent>
      </Select>
    </TableCell>

### Verify
1. Hirelytics row dropdown is disabled.
2. External row dropdown remains enabled.

---

## Step 3: Update application model to include Hirelytics source

### File
[app/data/mockData.ts](app/data/mockData.ts)

### Where
Update the `jobSource` union in `JobApplication` around [app/data/mockData.ts#L14](app/data/mockData.ts#L14)

### Snippet
    jobSource: 'LinkedIn' | 'Company Website' | 'Indeed' | 'Glassdoor' | 'Referral' | 'Hirelytics' | 'Other'

### Verify
No type errors when `jobSource` is `Hirelytics`.

---

## Step 4: Add shared status type and applicant status fields

### File
[app/types/job.ts](app/types/job.ts)

### Where A
Add status union near top of file.

### Snippet A
    export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn'

### Where B
Extend `Applicant` type with status and source fields.

### Snippet B
    applicationStatus?: ApplicationStatus
    jobSource?: string

### Verify
Applicant records can carry `applicationStatus` and `jobSource`.

---

## Step 5: Load applicant status in recruiter job details page

### File
[app/recruiter/JobDetails/[jobId]/page.tsx](app/recruiter/JobDetails/[jobId]/page.tsx)

### Where A
Update imports.

### Snippet A
    import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
    import type { Applicant, Job, ApplicationStatus } from '../../../types/job'

### Where B
Add status helper below imports.

### Snippet B
    const VALID_STATUSES: ApplicationStatus[] = [
      'Applied',
      'Interview',
      'Offer',
      'Rejected',
      'Withdrawn',
    ]

    function toApplicationStatus(value: unknown): ApplicationStatus {
      return VALID_STATUSES.includes(value as ApplicationStatus)
        ? (value as ApplicationStatus)
        : 'Applied'
    }

### Where C
Replace current applicant profile map logic inside the job snapshot callback to also read `users/{uid}/applications/{jobId}`.

### Snippet C
    const profiles = await Promise.all(
      applicantIds.map(async (uid) => {
        const [userSnap, applicationSnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDoc(doc(db, 'users', uid, 'applications', jobId)),
        ])

        const profile = userSnap.exists() ? (userSnap.data()?.profile ?? {}) : {}
        const applicationData = applicationSnap.exists() ? (applicationSnap.data() ?? {}) : {}

        return {
          id: uid,
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          resumeUrl: profile.resumeFile,
          resumeFileName: profile.resumeFileName,
          linkedinUrl: profile.linkedinUrl,
          portfolioUrl: profile.portfolioUrl,
          applicationStatus: toApplicationStatus(applicationData.status),
          jobSource: typeof applicationData.jobSource === 'string' ? applicationData.jobSource : 'Hirelytics',
        } as Applicant
      })
    )

### Verify
Recruiter page now shows each applicant with a status value sourced from application document.

---

## Step 6: Add recruiter status update handler and pass to table

### File
[app/recruiter/JobDetails/[jobId]/page.tsx](app/recruiter/JobDetails/[jobId]/page.tsx)

### Where A
Add handler in component body before return.

### Snippet A
    const handleApplicantStatusChange = async (
      applicantId: string,
      status: ApplicationStatus
    ) => {
      if (!jobId) return

      await updateDoc(doc(db, 'users', applicantId, 'applications', jobId), {
        status,
        updatedAt: serverTimestamp(),
      })
    }

### Where B
Pass callback into `ApplicantsTable` near [app/recruiter/JobDetails/[jobId]/page.tsx#L101](app/recruiter/JobDetails/[jobId]/page.tsx#L101)

### Snippet B
    <ApplicantsTable
      applicants={applicants}
      profileHref={(applicantId) => `/recruiter/applicants/${applicantId}`}
      onStatusChange={handleApplicantStatusChange}
    />

### Verify
Recruiter status changes persist to `users/{applicantId}/applications/{jobId}`.

---

## Step 7: Add status UI to recruiter applicants table

### File
[app/components/job/ApplicantsTable.tsx](app/components/job/ApplicantsTable.tsx)

### Where A
Add imports for Select and `ApplicationStatus`.

### Snippet A
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
    import type { Applicant, ApplicationStatus } from '../../types/job'

### Where B
Extend props type.

### Snippet B
    type ApplicantsTableProps = {
      applicants: Applicant[]
      title?: string
      profileHref?: (applicantId: string) => string
      onStatusChange?: (applicantId: string, status: ApplicationStatus) => Promise<void> | void
    }

### Where C
Add Status header in table head row.

### Snippet C
    <TableHead className='w-[20%]'>Status</TableHead>

### Where D
Add Status cell inside each applicant row.

### Snippet D
    <TableCell>
      <Select
        value={a.applicationStatus ?? 'Applied'}
        disabled={!onStatusChange}
        onValueChange={(status) =>
          onStatusChange?.(a.id, status as ApplicationStatus)
        }
      >
        <SelectTrigger className='w-[130px]'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='Applied'>Applied</SelectItem>
          <SelectItem value='Interview'>Interview</SelectItem>
          <SelectItem value='Offer'>Offer</SelectItem>
          <SelectItem value='Rejected'>Rejected</SelectItem>
          <SelectItem value='Withdrawn'>Withdrawn</SelectItem>
        </SelectContent>
      </Select>
    </TableCell>

### Where E
Update empty-state `colSpan` from 4 to 5.

### Snippet E
    <TableCell colSpan={5} className='text-sm text-muted-foreground'>

### Verify
Recruiter applicant table has a working status dropdown column.

---

## Step 8: Update applicant page tests for guard behavior

### File
[__tests__/applicant/applications/MyApplicationsPage.test.tsx](__tests__/applicant/applications/MyApplicationsPage.test.tsx)

### Where
Add a test ensuring Hirelytics status update does not call `updateDoc`.

### Snippet
    it('does not update status for Hirelytics applications', async () => {
      const hirelyticsApp = {
        id: 'hire-1',
        company: 'Hirelytics',
        country: 'USA',
        city: 'Remote',
        jobLink: '',
        position: 'Software Engineer',
        applicationDate: '2026-01-01',
        status: 'Applied' as const,
        contactPerson: '',
        notes: '',
        jobSource: 'Hirelytics' as const,
        outcome: 'Pending' as const,
      }

      // Configure snapshot mock in this test to emit hirelyticsApp,
      // trigger status change from mocked table, and assert no write:
      expect(updateDocMock).not.toHaveBeenCalled()
    })

---

## Step 9: Update recruiter job details tests for status write

### File
[__tests__/recruiter/JobDetails/page.test.tsx](__tests__/recruiter/JobDetails/page.test.tsx)

### Where
Extend Firestore mock to include:
1. `updateDoc` mock
2. `serverTimestamp` mock
3. Application document data for `users/{uid}/applications/{jobId}`

### Snippet
    const updateDocMock = vi.fn()
    const serverTimestampMock = vi.fn(() => 'SERVER_TS')

    // In firestore mock return object:
    updateDoc: (...args: unknown[]) => updateDocMock(...args),
    serverTimestamp: () => serverTimestampMock(),

    // In getDoc mock, branch for applications doc:
    if (ref.path[0] === 'users' && ref.path[2] === 'applications') {
      return Promise.resolve({
        exists: () => true,
        data: () => ({ status: 'Interview', jobSource: 'Hirelytics' }),
      })
    }

---

## Step 10: Update applications table UI tests for disabled status

### File
[app/components/ApplicationsTable.test.tsx](app/components/ApplicationsTable.test.tsx)

### Where
Add test case with a Hirelytics application and verify disabled status control.

### Snippet
    it('disables status control for Hirelytics applications', () => {
      const apps: JobApplication[] = [
        {
          id: 'hire-1',
          company: 'Hirelytics',
          country: 'USA',
          city: 'Remote',
          jobLink: '',
          position: 'Engineer',
          applicationDate: '2026-01-01',
          status: 'Applied',
          contactPerson: '',
          notes: '',
          jobSource: 'Hirelytics',
          outcome: 'Pending',
        },
      ]

      render(<ApplicationsTable applications={apps} onStatusChange={vi.fn()} />)

      // Assert disabled combobox/select based on your current test select mock
    })

---

## Step 11: Firestore security rules alignment

### Note
A rules file is not currently present in this repo, so apply this in your Firebase rules location.

### Required policy
1. Applicant can edit own application documents generally.
2. Applicant cannot change status when `jobSource` is `Hirelytics`.
3. Recruiter for the related job can update only `status` and `updatedAt` on applicant application docs.

### Verify
Manual test in Firebase emulator or console-backed environment:
1. Applicant write for Hirelytics status fails.
2. Recruiter write for Hirelytics status succeeds.
3. External application status remains applicant-editable.

---

## Final manual flow check

1. Applicant applies to Hirelytics job.
2. Recruiter opens [app/recruiter/JobDetails/[jobId]/page.tsx](app/recruiter/JobDetails/[jobId]/page.tsx) and updates applicant status.
3. Firebase `users/{applicantId}/applications/{jobId}` status updates.
4. Applicant opens [app/applicant/applications/page.tsx](app/applicant/applications/page.tsx) and sees updated status.
5. Applicant cannot edit status for that Hirelytics row in [app/components/ApplicationsTable.tsx](app/components/ApplicationsTable.tsx).
```