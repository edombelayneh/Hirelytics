# Hirelytics

A modern recruitment platform built with Next.js that connects job seekers with opportunities and helps recruiters manage applicants and job postings.

**[Visit Hirelytics](https://hirelytics.work)**

## Overview

Hirelytics is a full-stack recruitment application featuring:

- **For Applicants:** Browse available jobs, track applications, manage profiles, and add external job postings
- **For Recruiters:** Post new jobs, manage applicants, and track candidates
- **Role-Based Access:** Secure authentication with Clerk and role-based UI rendering
- **Job Data Integration:** Scrape and parse job postings from external sources
- **Real-Time Updates:** Firebase integration for live data synchronization

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Authentication:** Clerk with Firebase Auth
- **Database:** Firebase Realtime Database & Firestore
- **Testing:** Vitest, React Testing Library
- **Build Tool:** Webpack (Next.js)

## Project Structure

```
├── app/
│   ├── api/                    # API routes (Firebase, jobs, user management)
│   ├── applicant/              # Applicant-facing pages (jobs, applications, profile)
│   ├── recruiter/              # Recruiter-facing pages (job management, applicant tracking)
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Firebase client/admin initialization
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── __tests__/                  # Test files (mirroring app structure)
├── scripts/                    # Utility scripts (data migration, etc.)
└── public/                     # Static assets
```

## Key Features

### Applicant Dashboard
- Browse available job postings
- Track application status
- Manage user profile
- Add external job postings for tracking

### Recruiter Dashboard
- Post and manage job listings
- Review and track applicants
- View application analytics
- Access candidate profiles

### Job Scraping
- Parse job URLs and extract posting details
- Support for multiple job sources
- Automated job data enrichment

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project setup
- Clerk authentication setup
- Environment variables configured

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
FIREBASE_ADMIN_PRIVATE_KEY=your_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_email
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Testing

Run the test suite:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## API Routes

- `POST /api/firebase/custom-token` - Generate custom auth tokens
- `POST /api/jobs/parse-url` - Parse job posting from URL
- `POST /api/scrape-job` - Scrape job data
- `GET /api/user/role` - Fetch user role

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Commit and push
5. Create a pull request

## License

MIT
