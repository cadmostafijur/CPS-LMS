# Architectural Decisions — CPS Academy LMS

## Authentication
- Strapi Users & Permissions issues JWTs.
- Next.js BFF stores JWT in httpOnly `cps_token` cookie and proxies LMS calls.
- Public registration always assigns **Student**; role field from body is ignored.

## Authorization
- Four users-permissions roles: Admin, Content Manager, Instructor, Student.
- Global policies + LMS controller checks enforce role and ownership.
- Frontend middleware is UX only; API remains authoritative.

## Data ownership
- `createdByUser` / `instructor` / `author` / `student` are set server-side from JWT.
- Instructors may mutate only their courses (and nested lessons/quizzes).
- Content Managers may manage courses and blog; never users.

## Progress
- `LessonProgress` rows are source of truth.
- Percentage = completed / total lessons, capped at 100.
- Duplicate complete is idempotent.

## Quizzes
- Take endpoint strips `isCorrect`.
- Submit validates question∈quiz and option∈question, then grades server-side.
- Attempts stored with answers for history.

## Blog
- Public endpoints filter `status = PUBLISHED` only.
- Admin and Content Manager manage posts via LMS blog routes.

## Deployment
- Frontend → Vercel; Backend → Railway; DB → Neon/Railway Postgres.
- CORS allowlist from `CORS_ORIGIN`.
