## Plan: Resume Parsing into Job History

Add a server-side resume parsing pipeline that extracts work history from uploaded resumes and merges it into the profile job history without overwriting manual edits. Use Firebase Storage for resume files, normalize parser output through a mapping layer so it can adapt to the job history UI schema, and integrate the flow into the applicant profile upload UX.

**Steps**
1. Phase 1 — Align the job history contract with the in-progress UI, then add it to the profile model in [app/data/profileData.ts](app/data/profileData.ts) and any shared types in [app/types/job.ts](app/types/job.ts). *depends on the job history branch schema*
2. Phase 2 — Update profile persistence so `jobHistory` round-trips via Firebase: update `getUserProfile()` and `saveUserProfile()` in [app/utils/userProfiles.ts](app/utils/userProfiles.ts) and default merges in [app/applicant/profile/page.tsx](app/applicant/profile/page.tsx). *depends on 1*
3. Phase 3 — Move resume storage to Firebase Storage and keep only URL + filename in profile: adjust upload flow in [app/applicant/profile/ProfilePage.tsx](app/applicant/profile/ProfilePage.tsx) and reuse Firebase helpers in [app/utils/firebaseClient.ts](app/utils/firebaseClient.ts) and [app/utils/firebaseAdmin.ts](app/utils/firebaseAdmin.ts). *depends on 2, parallel with 4*
4. Phase 4 — Add a server-side parsing pipeline via a new route under [app/api](app/api), following patterns in [app/api/jobs/parse-url](app/api/jobs/parse-url) and [app/api/scrape-job](app/api/scrape-job); add dependencies in [package.json](package.json). The route should download the resume file, extract text (PDF via `pdf-parse`), then normalize to `JobHistoryItem[]` using a mapping layer housed under [app/utils](app/utils). *parallel with 3*
5. Phase 5 — Integrate parsing into the profile UI: after successful upload in [app/applicant/profile/ProfilePage.tsx](app/applicant/profile/ProfilePage.tsx), call the parse route, show a review UI, and merge only empty fields into the job history section (use the manual entry pattern in [app/applicant/addExternalJob/page.tsx](app/applicant/addExternalJob/page.tsx) as a UI reference). *depends on 4*
6. Phase 6 — Tests and docs: extend profile UI tests in [__tests__/applicant/profile/ProfilePage.test.tsx](__tests__/applicant/profile/ProfilePage.test.tsx) and [__tests__/applicant/profile/page.test.tsx](__tests__/applicant/profile/page.test.tsx), add parser unit tests under [__tests__/utils](__tests__/utils), and document setup/limits in [README.md](README.md). *depends on 4 and 5*

**Relevant files**
- [app/data/profileData.ts](app/data/profileData.ts) — add `jobHistory` on `UserProfile` and defaults
- [app/utils/userProfiles.ts](app/utils/userProfiles.ts) — persist `jobHistory` and resume metadata
- [app/applicant/profile/ProfilePage.tsx](app/applicant/profile/ProfilePage.tsx) — resume upload hook and UI merge flow
- [app/applicant/profile/page.tsx](app/applicant/profile/page.tsx) — load/save integration
- [app/utils/firebaseClient.ts](app/utils/firebaseClient.ts) — upload helper
- [app/utils/firebaseAdmin.ts](app/utils/firebaseAdmin.ts) — server download helper
- [app/api/jobs/parse-url](app/api/jobs/parse-url) — route pattern to mirror
- [app/api/scrape-job](app/api/scrape-job) — route pattern to mirror
- [app/applicant/addExternalJob/page.tsx](app/applicant/addExternalJob/page.tsx) — manual entry UX reference
- [__tests__/applicant/profile/ProfilePage.test.tsx](__tests__/applicant/profile/ProfilePage.test.tsx) — UI tests
- [__tests__/applicant/profile/page.test.tsx](__tests__/applicant/profile/page.test.tsx) — page tests
- [package.json](package.json) — add parsing deps

**Verification**
1. Upload PDF resumes and confirm `jobHistory` merges without overwriting existing entries (manual check in [app/applicant/profile/ProfilePage.tsx](app/applicant/profile/ProfilePage.tsx)).
2. Run the test script defined in [package.json](package.json) after adding parser deps.
3. Validate the saved profile document in Firestore includes `jobHistory`, `resumeUrl`, and `resumeFileName` via `getUserProfile()` in [app/utils/userProfiles.ts](app/utils/userProfiles.ts).

**Decisions**
- Parsing runs server-side in a new API route under [app/api](app/api).
- Resume files move to Firebase Storage; profile stores only URL + filename.
- Merge behavior: parser fills empty fields only, preserving manual edits.
- Target job history shape is the provided `JobHistoryItem` interface; keep a mapping layer to adapt to future UI schema changes.

**Further Considerations**
1. If supporting DOC or DOCX later, add a converter service and extraction step before parsing.
2. If extraction accuracy is low, consider adding an optional LLM-assisted extraction step behind a feature flag; document privacy considerations in [README.md](README.md).

**Resources**
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Firebase Storage (Web SDK): https://firebase.google.com/docs/storage/web/start
- Firebase Admin Storage: https://firebase.google.com/docs/storage/admin/start
- `pdf-parse` docs: https://www.npmjs.com/package/pdf-parse
- `chrono-node` date parsing: https://www.npmjs.com/package/chrono-node
