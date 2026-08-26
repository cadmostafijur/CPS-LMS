# CPS Academy LMS — Admin Panel Implementation Plan

> Created after inspecting the existing monorepo.  
> **Rule:** extend Strapi content-types + `/api/lms` + Next.js `/admin` — do **not** rewrite the stack.  
> **Rule:** every sidebar link must open a working page. Nav items are added **only when** that module ships.

---

## 1. Current architecture (as-is)

| Layer | Choice | Location |
|-------|--------|----------|
| Frontend | Next.js 15 App Router, React 19, Tailwind 4, Radix/shadcn | `frontend/` |
| Backend | Strapi 5.12, custom secure API | `backend/` |
| Database | PostgreSQL (`DATABASE_URL`) / SQLite local | `backend/config/database.ts` |
| Auth | Strapi JWT → BFF httpOnly `cps_token` | `frontend/app/api/auth/*`, `frontend/app/api/lms/[...path]` |
| Prisma | Documentation only (not runtime) | `prisma/schema.prisma` |

### Existing LMS roles

| Role | Type | Admin access |
|------|------|--------------|
| Admin | `lms-admin` | `/admin/*` |
| Content Manager | `content-manager` | `/content-manager/*` |
| Instructor | `instructor` | `/instructor/*` |
| Student | `student` | `/student/*`, `/learn`, quizzes |

Policies: `backend/src/policies/is-*.ts`. Frontend gate: `frontend/middleware.ts` + `frontend/lib/roles.ts`.

### Existing content-types

`course`, `lesson`, `enrollment`, `lesson-progress`, `quiz`, `quiz-question`, `quiz-option`, `quiz-attempt`, `quiz-answer`, `blog-post`, `certificate`, `banner` (schema stub), `coupon` (schema stub).  
Course already has `isFree` / `price` / `currency`. Enrollment has payment snapshot fields. Coupon apply logic exists in enroll service (simulated checkout).

### Existing admin UI

`/admin/dashboard`, `/admin/users`, `/admin/courses`, `/admin/enrollments`, `/admin/certificates`, `/admin/blog`.

### Incomplete in-repo work

| Feature | Backend | Frontend |
|---------|---------|----------|
| Certificates | Complete (auto-issue) | Complete (student + admin) |
| Pricing fields | Create/update + catalog | **Missing** form/catalog/enroll UI |
| Coupons | Schema + enroll apply | **Missing** admin CRUD + checkout field |
| Banners | Schema + unused sanitizer | **Missing** API wiring + display |

---

## 2. Target product vision

Build a **production-feel SaaS LMS admin** on top of CPS Academy, phased so each phase is shippable and type-safe.

Out of scope for an early contest demo but **planned** in later phases: full multi-warehouse inventory ERP, SMS/push, SAML SSO, SCORM/xAPI, live classrooms.

In scope for a commercial admin: learning ops, users/RBAC, commerce (paid courses, orders, coupons), certificates, communication basics, analytics/reports, settings, audit logs.

---

## 3. Reuse strategy

1. **New entities** → Strapi collection types under `backend/src/api/<name>/`.
2. **Secure API** → handlers on `api::lms.lms` with existing policies (never rely on default core routers for app auth).
3. **Admin UI** → `frontend/app/admin/<module>` + `frontend/features/admin/*` using `DashboardShell`, tables, `ConfirmDialog`, `PageHeader`.
4. **Permissions** → extend `ROLE_ACTIONS` in `backend/src/bootstrap/roles.ts`; add staff roles only when modules need them.
5. **Keep** instructor / content-manager / student surfaces; admin becomes the control plane.

---

## 4. Database schema (target additions)

### Phase 1–2 (learning core)

| Entity | Purpose |
|--------|---------|
| `course-category` | Categories / tags for courses |
| `course-module` | Ordered modules under a course |
| lesson (extend) | `module`, `contentType`, `documentUrl`, `isPreview`, `durationMinutes` |
| course (extend) | `category`, `difficulty`, `language`, `discountPrice`, `requirements`, `outcomes` |

### Phase 3 (people & enrollment ops)

| Entity | Purpose |
|--------|---------|
| user (extend) | `phone`, `studentId`, `lastLoginAt`, `status` enum |
| `batch` | Cohort: course, instructor, dates, capacity |
| `batch-member` | Student ↔ batch |
| `attendance` | Date, student, batch/course, status |

### Phase 4 (assessment+)

| Entity | Purpose |
|--------|---------|
| `question-bank-item` | Reusable questions |
| `assignment` / `assignment-submission` | Homework |
| `exam` / `exam-attempt` | Timed exams (reuse quiz patterns where possible) |
| certificate (extend) | `status` (ISSUED/REVOKED), `templateKey`, verify slug |

### Phase 5 (commerce)

| Entity | Purpose |
|--------|---------|
| `product` | Course / bundle / plan |
| `order` / `order-item` | Checkout |
| `payment` | Gateway transaction |
| `refund` | Refunds |
| `subscription` / `plan` | Recurring access |
| coupon (extend) | dates, max discount, per-user limit, course scope |

### Phase 6 (inventory — optional product track)

Full inventory stack only if product still requires physical goods: `warehouse`, `inventory-item`, `warehouse-stock`, `stock-movement`, `supplier`, `purchase-order`, etc. **Transaction-safe stock updates.**

### Phase 7–8 (ops)

| Entity | Purpose |
|--------|---------|
| `notification` | In-app notifications |
| `announcement` | Targeted announcements |
| `support-ticket` / `ticket-message` | Helpdesk |
| `review` | Course ratings |
| `media-asset` | Media library metadata (files in object storage) |
| `audit-log` | Admin action log |
| `setting` | Key/value org settings |
| `banner` | Already stubbed — finish |

---

## 5. API surface (pattern)

All under `/api/lms/*` via BFF `/api/lms/[...path]`.

### Existing (keep)

`me`, catalog, enroll, my-courses, lessons complete, progress, player, quizzes, dashboards, admin users CRUD, certificates, admin enrollments, courses/lessons/quizzes CRUD, blog.

### To add by phase

| Phase | Endpoints (examples) |
|-------|----------------------|
| 1 | `GET /dashboard/admin/stats` (enriched KPIs), `GET /admin/search` (global) |
| 2 | categories CRUD, modules CRUD, lesson content types, media list/upload URL |
| 3 | students/instructors list+detail, force enroll, batches, attendance |
| 4 | question-bank, assignments, exams, certificate revoke + `GET /verify/:code` (public) |
| 5 | coupons CRUD, validate coupon, orders, payments webhook stub, subscriptions |
| 6 | inventory APIs with transactional stock movements |
| 7 | notifications, announcements, tickets, reviews |
| 8 | reports export, audit logs, settings |

---

## 6. Admin pages (URL map)

Ship only when functional:

```
/admin                          → dashboard
/admin/users                    → all users (exists)
/admin/students                 → student list/detail
/admin/instructors              → instructor list/detail
/admin/roles                    → role matrix (read + limited edit)
/admin/courses                  → exists → deepen builder
/admin/categories
/admin/enrollments              → exists → add force enroll / cancel
/admin/batches
/admin/attendance
/admin/certificates             → exists → revoke
/admin/quizzes · /admin/exams · /admin/question-bank · /admin/assignments
/admin/orders · /admin/payments · /admin/coupons · /admin/subscriptions
/admin/banners · /admin/media · /admin/announcements · /admin/tickets
/admin/reports · /admin/audit-logs · /admin/settings
/admin/inventory/...            → Phase 6 only
```

Public: `/verify/[code]` for certificates.

---

## 7. Components to add (reusable)

| Component | Purpose |
|-----------|---------|
| `AdminDataTable` | Pagination, sort, filter, bulk select |
| `FilterBar` | Composable filters |
| `DateRangePicker` | Dashboard/report ranges |
| `ChartCard` | KPI charts (recharts) |
| `StatusBadge` | Unified statuses |
| `FileUploader` / `ImageUploader` | Media |
| `RichTextEditor` | Descriptions (start simple: textarea → TipTap later) |
| `Breadcrumbs` | Already partially present — wire on all admin pages |
| `EmptyState` / skeletons | Already exist — standardize |

Dependencies to add when needed: `recharts` (charts), TipTap or similar (rich text), object-storage SDK when media ships.

---

## 8. Permissions model

Keep four LMS roles initially. Add later:

| Role | When |
|------|------|
| Accountant | Phase 5 |
| Inventory Manager | Phase 6 |
| Support Staff | Phase 7 |

Granular actions: `entity.view|create|update|delete|publish|approve|export` registered in `ROLE_ACTIONS` and enforced in LMS services (never trust UI alone).

---

## 9. Implementation phases

### Phase 1 — Admin foundation *(in progress / largely shipped)*

**Goals**

- Harden admin shell (sidebar groups for **existing** routes only).
- Enrich admin dashboard KPIs from real DB counts (students, instructors, published/draft courses, completion rate, certificates, banned).
- Date-range filter stubs backed by real aggregates where data allows.
- Users: keep create / ban / delete / role; add clearer student vs instructor filters.
- Finish **pricing UI** on course form + catalog + enroll (uses existing backend fields).
- Finish **banners** + **coupons** admin CRUD + public banners + coupon on enroll (schemas already exist).
- Docs: keep this plan updated; sync Prisma docs after schema changes.

**Exit criteria:** `tsc` clean, admin pages work, paid/free + coupon + banner usable, no “Coming soon” links.

**Phase 1 status (2026-08-26)**

- [x] Enriched `adminDashboard` KPIs (students, instructors, published/draft, completion, revenue sim, coupons, banners)
- [x] LMS banner CRUD + public list
- [x] LMS coupon CRUD + validate
- [x] Admin pages `/admin/banners`, `/admin/coupons`
- [x] Course free/paid UI + catalog badges + enroll coupon
- [x] Home/catalog promo banners
- [ ] Rich charts / date-range (Phase 8 polish)
- [ ] Student vs instructor dedicated list pages (Phase 3)


### Phase 2 — Course builder depth

Categories, modules, lesson content types (PDF/URL/preview), media picker (URL + Strapi upload), schedule publish fields.

### Phase 3 — Students, instructors, batches, attendance

Dedicated student/instructor profiles, force enroll, cohorts, attendance entry.

### Phase 4 — Assessment & certificates+

Question bank, assignments, exams, certificate revoke + public verify.

### Phase 5 — Commerce

Orders, payments abstraction (+ webhook stub), coupons mature, subscriptions, invoices/refunds records.

### Phase 6 — Inventory (if required)

Warehouses, SKUs, stock movements (transactional), suppliers, POs, low-stock alerts.

### Phase 7 — Communication & reviews

Notifications, announcements, tickets, course reviews moderation.

### Phase 8 — Analytics, reports, settings, audit

Charts (recharts), CSV/PDF export, org/branding/email/payment settings, audit log search, global search.

### Phase 9 — Hardening

Security review, rate limits, performance (indexes, pagination everywhere), E2E smoke tests, feature audit vs this plan.

---

## 10. Phase 1 detailed checklist

### Backend

- [ ] Enrich `adminDashboard` with: totalStudents, activeStudents, instructors, publishedCourses, draftCourses, completionRate, certificatesIssued, bannedUsers, revenueSimulated (sum `enrollment.amountPaid`)
- [ ] LMS routes: banners list (public) + admin CRUD
- [ ] LMS routes: coupons admin CRUD + `POST /coupons/validate`
- [ ] Register new actions in `bootstrap/roles.ts`
- [ ] Ensure enroll pricing + coupon path remains correct

### Frontend

- [ ] Admin sidebar: grouped labels for live modules only
- [ ] Dashboard KPI cards + simple charts (if recharts added) or progress bars first
- [ ] Course form: Free/Paid, price, currency
- [ ] Course card + detail: show Free or price
- [ ] Enroll button: coupon field for paid courses
- [ ] `/admin/banners` CRUD UI
- [ ] `/admin/coupons` CRUD UI
- [ ] Home + catalog: render active banners

### Quality

- [ ] `npx tsc --noEmit` in frontend
- [ ] Restart Strapi so new CT columns sync
- [ ] Manual smoke: create paid course → coupon → enroll → certificate path still works

---

## 11. Risks & decisions

| Risk | Mitigation |
|------|------------|
| Spec is ERP-sized | Phases; inventory optional |
| Fake sidebar links | Only link shipped modules |
| Dual APIs | Forbid core Strapi CRUD from FE for LMS entities |
| Simulated payments | Document clearly until Phase 5 gateway |
| Schema drift Prisma | Update docs after each CT change |

---

## 12. Feature audit baseline (today)

| Spec area | Status |
|-----------|--------|
| Auth + RBAC (4 roles) | **Done** |
| Admin layout + users | **Partial** (needs richer dashboard/nav) |
| Courses / lessons / quizzes | **Done** (builder depth later) |
| Enrollments / progress | **Partial** |
| Certificates | **Done** (revoke/verify later) |
| Blog | **Done** |
| Pricing / coupons / banners | **Partial backend** |
| Orders / payments / inventory / exams / tickets / audit | **Missing** |

---

## 13. Next action

**Execute Phase 1** against this plan. After Phase 1 passes typecheck and smoke tests, update this document’s checklist and begin Phase 2.
