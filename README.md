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

## Database Schema

- **Prisma (visible model):** [`prisma/schema.prisma`](./prisma/schema.prisma)
- **Strapi content-types:** `backend/src/api/*/content-types/*/schema.json`
- Full map: [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)

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
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://USER:PASSWORD@ep-XXXX.REGION.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
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

### 3. Database (Neon PostgreSQL)

1. Create a project at [https://console.neon.tech](https://console.neon.tech)
2. Copy the **pooled** connection string (ends with `?sslmode=require`)
3. Put it in `backend/.env`:

```env
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://USER:PASSWORD@ep-XXXX.REGION.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

4. Restart Strapi — tables are created automatically; seed runs when `SEED_ON_BOOTSTRAP=true`

(SQLite remains available only as a local fallback via `DATABASE_CLIENT=sqlite`.)

### 4. Run everything (one command)

From the repo root:

```bash
npm run dev
```

This starts Strapi on [http://localhost:1337](http://localhost:1337) and Next.js on [http://localhost:3000](http://localhost:3000).

First backend boot seeds roles, demo users, courses, quizzes, and blog posts when the DB is empty / seed flag is on.

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

---

## Seed Data & First Admin

On first boot, seed may create a bootstrap admin (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Prefer creating real accounts from **Admin → Users → Create user** for Admin, Content Manager, Instructor, and Student roles.

Public registration always creates a **Student**. Admins assign other roles or create staff accounts directly.

Seeded sample courses and blog posts may still appear for catalog demos. Set `SEED_ON_BOOTSTRAP=false` after initial setup if desired.

---

## Certificates

When a student completes every lesson in a course, the LMS issues a certificate automatically. Students view them under **Certificates**; print/save as PDF from the certificate page. Admins can audit all certificates under **Admin → Certificates**.

---

## Admin panel

Admins can:

- Create users for any role
- Ban / unban users
- Permanently delete users (and related enrollments/progress/certificates)
- Manage courses, enrollments, certificates, and blog

---

## API Surface (custom LMS)

Primary secure API lives under `/api/lms/*` (see `backend/src/api/lms/routes/lms.ts`):

- Auth: Strapi `/api/auth/local`, `/api/auth/local/register` (forced Student)
- Enroll, my-courses, lesson complete, progress, certificates
- Quiz take / submit / attempts
- Course / lesson / quiz / blog management
- Role dashboards & admin users (create / ban / delete)

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
2. Copy the **pooled** connection string
3. On Railway Strapi set:
   - `DATABASE_CLIENT=postgres`
   - `DATABASE_URL=<neon pooled url>`
   - `DATABASE_SSL=true`
   - `DATABASE_SSL_REJECT_UNAUTHORIZED=false`

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
