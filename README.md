# CPS Academy LMS

Production-oriented Learning Management System — **Junior Software Engineer Project Round** submission.

**Stack (mandatory):** Next.js (Vercel) → Strapi REST API (Railway) → PostgreSQL

---

## Contest Requirements Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Tech stack** — Next.js + Strapi + PostgreSQL only | ✅ Done | `frontend/` (Vercel), `backend/` (Railway) |
| **4 roles** — Admin, Content Manager, Instructor, Student | ✅ Done | `backend/src/utils/roles.ts`, `frontend/lib/roles.ts` |
| **Permission matrix** enforced on **backend** | ✅ Done | LMS services + policies; not UI-only |
| **Auth** — sign up, login, logout, JWT session | ✅ Done | httpOnly cookie via Next BFF |
| **Course CRUD** per matrix | ✅ Done | Admin/CM any; Instructor own courses |
| **Lessons** — text + video URL, ordered | ✅ Done | Learning player + staff course editor |
| **Student enrollment** + My Courses | ✅ Done | `/api/lms/enroll`, `/student/my-courses` |
| **Lesson viewing** for enrolled students | ✅ Done | `/learn/[courseId]/[lessonId]` |
| **Progress tracking** — mark complete, % persists | ✅ Done | `lesson-progress`, server-side calculation |
| **Quiz + auto-grading** — MCQ, score on submit, stored | ✅ Done | Server grades; no `isCorrect` leak on take |
| **Admin panel** — users, roles, courses, stats | ✅ Done | `/admin/*` dashboard + users CRUD |
| **Blog** — draft/publish, public list + single post | ✅ Done | CM/Admin write; public `/blog` |
| **README** — local run + features completed | ✅ Done | This file |
| **Deployed app** (Vercel + Railway) | ⚠️ You submit | Set URLs in submission form |
| **10-min video walkthrough** | ⚠️ You record | Demo all roles + explain your code |

### Permission matrix (implemented)

| Action | Admin | Content Manager | Instructor | Student |
|--------|:-----:|:---------------:|:----------:|:-------:|
| Manage users & roles | ✅ | ❌ | ❌ | ❌ |
| Create / edit / delete any course | ✅ | ✅ | Own only | ❌ |
| Add / edit / delete lessons | ✅ | ✅ | Own courses | ❌ |
| Create quizzes | ✅ | ✅ | Own courses | ❌ |
| View student progress | ✅ | ✅ | Own courses | Own only |
| Write / manage blog | ✅ | ✅ | ❌ | ❌ |
| Enroll in a course | ❌ | ❌ | ❌ | ✅ |
| Take quizzes | ❌ | ❌ | ❌ | ✅ |

Backend enforcement examples: `assertStudentOnly`, `assertCourseOwnerOrManager`, `canManageCourse`, `ForbiddenError` in `backend/src/api/lms/services/lms.ts`.

---

## Extra Features (beyond contest spec)

These were added to make the product production-ready and stand out:

### AI & learning
- **Sage AI assistant** — text-based student tutor (`/student/assistant`)
- **Certificates** — auto-issue on course completion, print, public verify (`/verify/[code]`)
- **Assignments** — publish, submit (file upload), instructor grading
- **Question bank** — import questions into quizzes
- **Student transcript** — downloadable grade summary
- **Timed quizzes** — optional time limit with auto-submit behavior
- **Course preview lessons** — browse sample lesson without enrollment

### Live & community
- **Live class calendar** + attendance (`/student/calendar`)
- **Course discussions** — threaded Q&A on course pages
- **Reviews & ratings** — student reviews, admin moderation
- **Course announcements** — notify enrolled students
- **Help desk / messaging** — student ↔ instructor chat
- **Support tickets** — student tickets, admin triage

### Commerce (simulated)
- **Paid enrollment** — orders, coupons, checkout flow
- **Plans & subscriptions**, payments admin, inventory (demo data)

### Marketing & UX
- **Admin-managed homepage banners** — hero carousel, promo strips, success stories
- **Redesigned marketing homepage** — sections, FAQ, CTA blocks
- **Blog redesign** — featured hero, card grid, sidebar TOC, share, related posts
- **Wishlist** + reminder notifications
- **Course categories** + public catalog with filters
- **Student analytics dashboard** — real progress/quiz/assignment charts
- **In-app notifications** — bell dropdown + full inbox (enrollment, quiz, assignment, course cancel, announcements)
- **Unified button design system** — consistent orange/navy CTAs

### Admin / staff tooling
- **Content Manager workspace** — separate dashboard for courses/blog/banners
- **Staff courses board** — catalog-first course management UI
- **Batches / cohorts**, attendance records, audit logs, reports
- **Bulk grade CSV export**, course clone, SEO fields on courses
- **Email notifications** (SMTP) alongside in-app alerts

---

## Project Overview

CPS Academy is a role-based LMS with courses, ordered lessons, enrollment, persistent progress, server-graded quizzes, admin user management, and a public blog. **Authorization is enforced on the Strapi backend** — UI gating alone is never trusted.

---

## Tech Stack

| Area | Technology |
|------|------------|
| Frontend | Next.js 15, TypeScript, App Router, Tailwind CSS v4 |
| Backend | Strapi 5, TypeScript, REST |
| Database | PostgreSQL (production), SQLite (local optional) |
| Deploy | Vercel + Railway |

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` — at minimum set `APP_KEYS`, `JWT_SECRET`, and database URL.  
Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run (from repo root)

```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Strapi: [http://localhost:1337](http://localhost:1337)

First boot with `SEED_ON_BOOTSTRAP=true` creates roles, demo users, courses, quizzes, and blog posts.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lms-demo.com` | `DemoAdmin123!` |
| Content Manager | `content@lms-demo.com` | `DemoContent123!` |
| Instructor | `instructor@lms-demo.com` | `DemoInstructor123!` |
| Student | `student@lms-demo.com` | `DemoStudent123!` |

Public registration always creates a **Student**. Admins create other roles under **Admin → Users**.

---

## Key Routes

| Role | Dashboard |
|------|-----------|
| Student | `/student/dashboard` |
| Instructor | `/instructor/dashboard` |
| Content Manager | `/content-manager/dashboard` |
| Admin | `/admin/dashboard` |

Public: `/courses`, `/blog`, `/login`, `/register`

---

## API

Custom secure API: `/api/lms/*` — see `backend/src/api/lms/routes/lms.ts`  
Frontend BFF: `/api/auth/*`, `/api/lms/[...path]` (JWT in httpOnly `cps_token` cookie)

---

## Testing

```bash
cd backend && npm test
```

Covers progress calculation, role helpers, and quiz grading.

---

## Deployment

### Backend (Railway)

1. Deploy `backend/` with env from `.env.example`
2. Set `DATABASE_URL` (PostgreSQL), `CORS_ORIGIN` = your Vercel URL
3. Set `PUBLIC_URL` to Railway public domain (not `0.0.0.0`)

### Frontend (Vercel)

1. Root directory: `frontend/`
2. `NEXT_PUBLIC_API_URL=https://<railway-host>/api`
3. `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`

---

## Submission Checklist

Before **30 August 2026, 11:59 PM**:

1. ✅ GitHub repo (public) with commit history
2. ⚠️ Live **Vercel** frontend URL
3. ⚠️ Live **Railway** backend URL
4. ⚠️ **10-minute video** (screen + voice): student flow, staff flow, admin roles, data flow, backend RBAC, progress logic, quiz grading, blog publish, deployment env vars

---

## Security Notes

- Passwords hashed by Strapi; never returned to client
- Role from authenticated user only — never from request body
- Quiz `isCorrect` stripped on student take endpoints
- Draft courses/posts hidden from public APIs
- Registration cannot self-assign Admin

---

## License

Private evaluation / contest submission.
