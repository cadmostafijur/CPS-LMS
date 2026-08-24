# CPS Academy LMS

Production-oriented Learning Management System for a technical hiring contest.

**Stack:** Next.js (Vercel) → Strapi REST API (Railway) → PostgreSQL (Neon / Railway)

---

## Project Overview

CPS Academy is a role-based LMS with courses, ordered lessons, enrollment, persistent progress, server-graded quizzes, admin user management, and a public blog. Authorization is enforced on the Strapi backend — UI gating alone is never trusted.

Brand mark: curly-brace `{ }` logo with gold and orange accents on deep navy.

---

## Features

- Four application roles: **Admin**, **Content Manager**, **Instructor**, **Student**
- Registration (always Student), login, logout, persistent JWT session (httpOnly cookie)
- Course CRUD with draft / published / archived lifecycle
- Ordered text & video lessons and learning player
- Student enrollment with duplicate prevention
- Per-student lesson progress with capped percentage
- MCQ quizzes with **server-side grading** (no `isCorrect` leakage before submit)
- Role dashboards with live statistics
- Admin user & role management
- Public blog with draft / publish controls
- Responsive UI, loading / empty / error / forbidden states

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js         │
                         │      Frontend        │
                         │      Vercel          │
                         └──────────┬───────────┘
                                    │
                              HTTPS / REST
                                    │
                         ┌──────────▼───────────┐
                         │       Strapi         │
                         │      Backend/CMS     │
                         │      Railway         │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │     PostgreSQL       │
                         │   Neon / Railway     │
                         └──────────────────────┘
```

| Layer | Responsibility |
|-------|----------------|
| Next.js | UI, BFF auth cookies, protected routes, forms, dashboards |
| Strapi | Auth, RBAC, ownership, courses, lessons, enroll, progress, quiz grading, blog, users |
| PostgreSQL | Persistent relational data |

**Prisma:** Not used as a second competing model layer. All application domain data lives in Strapi’s PostgreSQL schema. Use Neon/Railway Postgres via Strapi’s `DATABASE_URL`.

---

## Tech Stack

| Area | Technology |
|------|------------|
| Frontend | Next.js 15, TypeScript, App Router, Tailwind CSS v4, Radix/shadcn-style UI |
| Backend | Strapi 5, TypeScript, REST |
| Database | PostgreSQL (production), SQLite (local default) |
| Deploy | Vercel + Railway |

---

## Folder Structure

```text
lms/
├── frontend/          # Next.js app (independently deployable)
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── services/
│   ├── middleware.ts
│   └── ...
├── backend/           # Strapi app (independently deployable)
│   ├── config/
│   ├── src/api/
│   ├── src/policies/
│   ├── src/utils/
│   └── ...
├── README.md
└── package.json
```

---

## Database Schema (core entities)

`User`, `Course`, `Lesson`, `Enrollment`, `LessonProgress`, `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, `QuizAnswer`, `BlogPost`

Key constraints / rules:

- Unique enrollment per `(student, course)` (enforced in service)
- Unique progress per `(student, lesson)` (enforced in service)
- Course status: `DRAFT | PUBLISHED | ARCHIVED`
- Blog status: `DRAFT | PUBLISHED`
- Quiz options’ `isCorrect` never returned on student “take” endpoints

---

## Roles & Permissions

| Action | Admin | Content Manager | Instructor | Student |
|--------|:-----:|:---------------:|:----------:|:-------:|
| Manage users / roles | YES | NO | NO | NO |
| Create courses | YES | YES | YES | NO |
| Edit any course | YES | YES | NO | NO |
| Edit own course | YES | YES | YES | NO |
| Lessons / quizzes on own courses | YES | YES | YES | NO |
| Enroll / take quizzes | NO | NO | NO | YES |
| View progress | All | All | Own courses | Own only |
| Manage / publish blog | YES | YES | NO | NO |

Backend policies + LMS controllers verify authentication, role, and ownership on every protected action.

---

## Environment Variables

### Backend (`backend/.env`)

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3000
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
# Production:
# DATABASE_CLIENT=postgres
# DATABASE_URL=postgres://...
SEED_ON_BOOTSTRAP=true
SEED_ADMIN_EMAIL=admin@lms-demo.com
SEED_ADMIN_PASSWORD=DemoAdmin123!
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit real secrets. Only `NEXT_PUBLIC_*` values are browser-safe.

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- (Optional) PostgreSQL for production-like local DB

### 1. Clone & install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Database

Local default uses SQLite (`.tmp/data.db`). For Postgres:

```env
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://user:pass@host:5432/cps_lms
```

### 4. Run backend

```bash
cd backend
npm run develop
```

First boot seeds roles, demo users, courses, quizzes, and blog posts when the DB is empty / seed flag is on.

Strapi admin panel (CMS UI) is separate from LMS Admin role — create a Strapi admin at `/admin` if you need the CMS console.

### 5. Run frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Seed Data & Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lms-demo.com` | `DemoAdmin123!` |
| Content Manager | `content@lms-demo.com` | `DemoContent123!` |
| Instructor | `instructor@lms-demo.com` | `DemoInstructor123!` |
| Student | `student@lms-demo.com` | `DemoStudent123!` |

Seeded courses: Next.js Fundamentals, React Mastery, Node.js Backend Development, TypeScript Essentials — each with lessons and a quiz. Blog includes published and draft posts.

Override admin credentials via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Set `SEED_ON_BOOTSTRAP=false` after initial seed if desired.

---

## API Surface (custom LMS)

Primary secure API lives under `/api/lms/*` (see `backend/src/api/lms/routes/lms.ts`):

- Auth: Strapi `/api/auth/local`, `/api/auth/local/register` (forced Student)
- Enroll, my-courses, lesson complete, progress
- Quiz take / submit / attempts
- Course / lesson / quiz / blog management
- Role dashboards & admin users

Frontend BFF routes: `/api/auth/*`, `/api/lms/[...path]` (JWT in httpOnly `cps_token`).

---

## Testing

```bash
cd backend && npm test
```

Covers progress calculation, role helpers, and quiz grading helpers.

### Manual security checks

As Student, direct API calls to create courses, manage users, or read another student’s progress must fail. Instructors must not edit another instructor’s course. Content Managers must not manage users.

---

## Deployment

### Database (Neon)

1. Create a Neon Postgres project
2. Copy the connection string to Railway Strapi as `DATABASE_URL`
3. Set `DATABASE_CLIENT=postgres`

### Backend (Railway)

1. New Railway project from `backend/`
2. Set env vars from `.env.example` (strong secrets, `CORS_ORIGIN` = your Vercel URL)
3. Deploy; health via Strapi start on `PORT`
4. Confirm `/api/lms/blog` returns published posts only

### Frontend (Vercel)

1. Import `frontend/` as the root directory
2. Set `NEXT_PUBLIC_API_URL=https://<railway-host>/api`
3. Set `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`
4. Deploy

CORS on Strapi must allow only the Vercel origin (comma-separated list) — never `*` for authenticated APIs.

---

## Security Notes

- Passwords hashed by Strapi users-permissions (never plaintext / never returned)
- Role always taken from authenticated user, never from client body
- Ownership checks for instructor resources
- Quiz auto-grade on server; options stripped of `isCorrect` on take
- Progress derived from persisted completions, capped at 100%
- Draft courses/posts excluded from public listing
- Registration cannot self-assign Admin

---

## Architectural Decisions

1. **Strapi as sole backend** — contest stack requirement; no Express/Nest duplicate API
2. **Custom `/api/lms` controllers** — ownership, enroll, progress, and grading need explicit logic beyond default CRUD
3. **httpOnly JWT cookie via Next BFF** — reduces XSS token theft vs localStorage-only
4. **SQLite locally / Postgres in prod** — fast demo onboarding without sacrificing deployability
5. **No Prisma twin models** — avoid dual sources of truth for the same entities

---

## License

Private evaluation / contest submission.
