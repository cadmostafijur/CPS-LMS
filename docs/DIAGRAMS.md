# CPS Academy LMS — Video Walkthrough Diagrams

Use these Mermaid diagrams in your **10-minute video**, README, or slides.  
Preview at [mermaid.live](https://mermaid.live) or in VS Code with a Mermaid extension.

---

## 1. Overall system architecture

```mermaid
flowchart TB
    subgraph User["User Browser"]
        UI["Next.js Pages<br/>/courses, /learn, /admin"]
        Client["Client Components<br/>bffFetch()"]
    end

    subgraph Vercel["Vercel — Frontend"]
        Pages["Server Components<br/>apiFetch() + session"]
        AuthBFF["/api/auth/login<br/>/api/auth/register"]
        LmsBFF["/api/lms/*<br/>BFF Proxy"]
        MW["middleware.ts<br/>Route guard by role cookie"]
    end

    subgraph Railway["Railway — Backend"]
        Strapi["Strapi 5 REST API"]
        LMS["Custom /api/lms/*<br/>lms.ts services"]
        Policies["Policies<br/>is-admin, is-instructor-or-above"]
        Roles["bootstrap/roles.ts<br/>Permission matrix"]
    end

    subgraph DB["PostgreSQL"]
        Users["users + roles"]
        Courses["courses, lessons, quizzes"]
        Progress["lesson_progress"]
        Attempts["quiz_attempts, quiz_answers"]
        Blog["blog_posts"]
        Enroll["enrollments"]
    end

    UI --> MW
    MW --> Pages
    Client --> LmsBFF
    Pages --> AuthBFF
    Pages -->|"direct + JWT token"| LMS
    AuthBFF -->|"POST /auth/local"| Strapi
    LmsBFF -->|"JWT from httpOnly cookie"| LMS
    Strapi --> LMS
    LMS --> Policies
    LMS --> Roles
    LMS --> DB
    Strapi --> DB
```

**Key files:**
- `frontend/app/api/lms/[...path]/route.ts` — BFF proxy
- `frontend/middleware.ts` — frontend route guard
- `backend/src/api/lms/services/lms.ts` — main API logic
- `backend/src/bootstrap/roles.ts` — role permissions

---

## 2. Login & session data flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant Auth as /api/auth/login
    participant Strapi as Strapi /auth/local
    participant DB as PostgreSQL

    User->>FE: Enter email + password
    FE->>Auth: POST { identifier, password }
    Auth->>Strapi: POST /auth/local
    Strapi->>DB: Verify user + password hash
    DB-->>Strapi: User + role
    Strapi-->>Auth: JWT + user object
    Auth->>Auth: Set httpOnly cookies<br/>cps_token, cps_role, cps_user
    Auth-->>FE: { user }
    FE-->>User: Redirect to role dashboard<br/>/student, /admin, etc.

    Note over FE,Strapi: middleware.ts reads cps_role<br/>and blocks wrong /admin, /student paths
```

**Key files:**
- `frontend/app/api/auth/login/route.ts`
- `frontend/lib/auth.ts` — `setAuthCookies()`
- `frontend/middleware.ts`

---

## 3. Student flow — enroll → lesson → progress → quiz

```mermaid
sequenceDiagram
    actor Student
    participant UI as Frontend UI
    participant BFF as /api/lms/*
    participant LMS as lms.ts (Strapi)
    participant DB as PostgreSQL

    rect rgb(240, 248, 255)
        Note over Student,DB: 1. ENROLL
        Student->>UI: Click Enroll on course
        UI->>BFF: POST /api/lms/enroll/:courseId
        BFF->>LMS: POST /lms/enroll/:courseId + JWT
        LMS->>LMS: assertStudentOnly() ✓
        LMS->>DB: INSERT enrollment
        DB-->>LMS: enrollment row
        LMS-->>UI: success
    end

    rect rgb(255, 248, 240)
        Note over Student,DB: 2. VIEW LESSON
        Student->>UI: Open /learn/courseId/lessonId
        UI->>LMS: GET /lms/courses/:id/player
        LMS->>DB: lessons + progress + module gates
        DB-->>UI: lesson content + videoUrl
    end

    rect rgb(240, 255, 240)
        Note over Student,DB: 3. MARK COMPLETE + PROGRESS
        Student->>UI: Click "Mark complete"
        UI->>BFF: POST /api/lms/lessons/:id/complete
        BFF->>LMS: completeLesson()
        LMS->>LMS: assertStudentOnly() ✓
        LMS->>DB: UPSERT lesson_progress<br/>(student, course, lesson, completed=true)
        LMS->>LMS: calculateCourseProgress()<br/>completedCount / totalLessons
        LMS-->>UI: { percentage: 60% }
        UI-->>Student: Progress bar updates
    end

    rect rgb(255, 240, 255)
        Note over Student,DB: 4. QUIZ AUTO-GRADE
        Student->>UI: Take quiz + submit answers
        UI->>BFF: GET /api/lms/quizzes/:id/take
        BFF->>LMS: takeQuiz()
        LMS->>LMS: sanitizeQuizForTake()<br/>strip isCorrect from options
        LMS-->>UI: questions (no answers leaked)

        Student->>UI: Submit answers
        UI->>BFF: POST /api/lms/quizzes/:id/submit
        BFF->>LMS: submitQuiz()
        LMS->>LMS: gradeQuizAnswers()<br/>compare selectedOption vs isCorrect
        LMS->>DB: INSERT quiz_attempt + quiz_answers
        LMS-->>UI: score 4/5 = 80%
        UI-->>Student: Show result immediately
    end
```

**Key files:**
- `frontend/features/courses/enroll-button.tsx`
- `frontend/features/learn/learning-player.tsx`
- `frontend/features/quizzes/quiz-taker.tsx`
- `backend/src/api/lms/services/lms.ts` — `enroll`, `completeLesson`, `submitQuiz`

---

## 4. Role-based access control (RBAC)

```mermaid
flowchart LR
    subgraph Request["Incoming API Request"]
        JWT["JWT in Authorization header<br/>or httpOnly cookie via BFF"]
    end

    subgraph Layer1["Layer 1 — Route Policy"]
        P1["is-admin"]
        P2["is-content-manager-or-admin"]
        P3["is-instructor-or-above"]
        P4["is-authenticated"]
    end

    subgraph Layer2["Layer 2 — Service Check"]
        S1["assertStudentOnly()<br/>enroll, quiz, progress"]
        S2["assertNotStudent()<br/>staff authoring"]
        S3["canManageCourse()<br/>instructor = own course only"]
        S4["canManageBlog()<br/>admin + CM only"]
    end

    subgraph Layer3["Layer 3 — Bootstrap Matrix"]
        M["roles.ts seeds permissions<br/>per role on startup"]
    end

    subgraph Result["Result"]
        OK["200 OK — allowed"]
        F403["403 Forbidden — blocked"]
    end

    JWT --> Layer1
    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer2 --> OK
    Layer2 --> F403
```

**Examples to demo in video:**
| Action | Role | Result |
|--------|------|--------|
| `GET /lms/dashboard/admin` | Student | **403** |
| `POST /lms/enroll/:id` | Instructor | **403** |
| `POST /lms/lessons/:id/complete` | Student | **200** |
| `PUT /lms/admin/users/:id/role` | Admin | **200** |

**Key files:**
- `backend/src/policies/is-admin.ts`
- `backend/src/api/lms/services/lms.ts` — `assertStudentOnly()`
- `backend/src/utils/ownership.ts` — `canManageCourse()`
- `backend/src/bootstrap/roles.ts`

---

## 5. Staff flow — course, lesson, quiz, blog

```mermaid
flowchart TB
    subgraph Roles["Staff Roles"]
        CM["Content Manager"]
        INS["Instructor"]
        ADM["Admin"]
    end

    subgraph Actions["Actions"]
        CC["Create / Edit Course"]
        CL["Add / Edit Lesson<br/>text + videoUrl"]
        CQ["Create MCQ Quiz<br/>options + isCorrect"]
        BL["Blog Post<br/>DRAFT or PUBLISHED"]
        UR["Manage User Roles"]
    end

    CM --> CC
    CM --> CL
    CM --> CQ
    CM --> BL

    INS --> CC
    INS --> CL
    INS --> CQ

    ADM --> CC
    ADM --> CL
    ADM --> CQ
    ADM --> BL
    ADM --> UR

    CC --> DB1[(courses)]
    CL --> DB2[(lessons)]
    CQ --> DB3[(quizzes, questions, options)]
    BL --> DB4[(blog_posts)]
    UR --> DB5[(users + roles)]

    subgraph Public["Public sees"]
        PUB1["PUBLISHED courses only"]
        PUB2["PUBLISHED blog only"]
    end

    DB1 --> PUB1
    DB4 --> PUB2
```

**Key files:**
- `frontend/features/courses/course-form.tsx`
- `frontend/features/courses/lesson-manager.tsx`
- `frontend/features/courses/quiz-manager.tsx`
- `frontend/features/blog/blog-manager.tsx`
- `frontend/app/admin/users/page.tsx`

---

## 6. Progress tracking — where data is stored

```mermaid
flowchart TB
    subgraph Trigger["Student clicks Mark Complete"]
        BTN["learning-player.tsx<br/>POST /api/lms/lessons/:id/complete"]
    end

    subgraph Backend["completeLesson() in lms.ts"]
        A1["1. getAuthUser()"]
        A2["2. assertStudentOnly()"]
        A3["3. Check enrollment exists"]
        A4["4. UPSERT lesson_progress row"]
        A5["5. getCourseProgressForStudent()"]
        A6["6. calculateCourseProgress()"]
        A7["7. If 100% → mark enrollment complete"]
    end

    subgraph Storage["PostgreSQL Tables"]
        T1["lesson_progresses<br/>student_id, course_id, lesson_id<br/>completed, completed_at"]
        T2["lessons<br/>count total per course"]
        T3["enrollments<br/>completed_at when 100%"]
    end

    subgraph Display["Frontend shows"]
        D1["My Courses → 60%"]
        D2["Student Dashboard"]
        D3["Progress bar in learning player"]
    end

    BTN --> A1 --> A2 --> A3 --> A4
    A4 --> T1
    A4 --> A5
    A5 --> T2
    A5 --> T1
    A5 --> A6
    A6 -->|"completedCount / totalLessons * 100"| A7
    A7 --> T3
    A6 --> Display
```

**Formula:**
```
progress % = (completed lessons / total lessons) × 100
```

**Key files (explain line by line in video):**
1. `backend/src/api/lesson-progress/content-types/lesson-progress/schema.json`
2. `backend/src/utils/progress.ts` — `calculateCourseProgress()`
3. `backend/src/api/lms/services/lms.ts` — `getCourseProgressForStudent()`, `completeLesson()`

---

## 7. Quiz auto-grading — data flow

```mermaid
flowchart LR
    subgraph Take["TAKE QUIZ"]
        T1["GET /lms/quizzes/:id/take"]
        T2["sanitizeQuizForTake()"]
        T3["Remove isCorrect<br/>from all options"]
        T4["Send to student UI"]
    end

    subgraph Submit["SUBMIT QUIZ"]
        S1["POST body:<br/>answers: [{questionId, selectedOptionId}]"]
        S2["gradeQuizAnswers()"]
        S3["For each answer:<br/>find option → check isCorrect"]
        S4["score++ if correct"]
        S5["percentage = score/total × 100"]
    end

    subgraph Save["SAVE TO DB"]
        DB1["quiz_attempts<br/>score, percentage, submittedAt"]
        DB2["quiz_answers<br/>questionId, optionId, isCorrect"]
    end

    subgraph Return["RETURN"]
        R1["Immediate score to UI<br/>e.g. 4/5 = 80%"]
        R2["/quizzes/:id/results<br/>view later"]
    end

    T1 --> T2 --> T3 --> T4
    T4 --> S1 --> S2 --> S3 --> S4 --> S5
    S5 --> DB1
    S5 --> DB2
    S5 --> R1 --> R2
```

**Key files (explain line by line in video):**
1. `backend/src/utils/quiz.ts` — `sanitizeQuizForTake()`, `gradeQuizAnswers()`
2. `backend/src/api/lms/services/lms.ts` — `takeQuiz()`, `submitQuiz()`
3. `frontend/features/quizzes/quiz-taker.tsx`

---

## 8. Blog draft → publish flow

```mermaid
sequenceDiagram
    actor CM as Content Manager / Admin
    participant UI as blog-manager.tsx
    participant BFF as /api/lms/blog
    participant LMS as lms.ts
    participant DB as blog_posts table
    actor Public as Public visitor

    CM->>UI: Create post, status = DRAFT
    UI->>BFF: POST /api/lms/blog
    BFF->>LMS: createBlog()
    LMS->>LMS: canManageBlog() ✓
    LMS->>DB: INSERT status=DRAFT
  Public->>LMS: GET /lms/blog
    LMS->>DB: WHERE status=PUBLISHED only
    DB-->>Public: Draft NOT returned

    CM->>UI: Edit post, status = PUBLISHED
    UI->>BFF: PUT /api/lms/blog/:id
    LMS->>DB: UPDATE status=PUBLISHED, publishedAt=now
  Public->>LMS: GET /lms/blog
    DB-->>Public: Post now visible on /blog
```

**Key files:**
- `frontend/features/blog/blog-manager.tsx`
- `backend/src/api/lms/services/lms.ts` — `listBlog()`, `createBlog()`, `manageBlog()`
- `frontend/app/(public)/blog/page.tsx`

---

## 9. Deployment & environment variables

```mermaid
flowchart TB
    subgraph Internet["Internet"]
        User["User"]
    end

    subgraph Vercel["Vercel — frontend/"]
        V1["NEXT_PUBLIC_API_URL<br/>= Railway URL + /api"]
        V2["NEXT_PUBLIC_SITE_URL<br/>= Vercel domain"]
        V3["Next.js App"]
    end

    subgraph Railway["Railway — backend/"]
        R1["DATABASE_URL<br/>PostgreSQL"]
        R2["JWT_SECRET, APP_KEYS"]
        R3["CORS_ORIGIN<br/>= Vercel URL"]
        R4["PUBLIC_URL<br/>= Railway domain"]
        R5["Strapi API"]
    end

    subgraph Neon["PostgreSQL"]
        DB[(All tables)]
    end

    User --> V3
    V3 -->|"API calls"| R5
    R5 --> DB
    V1 -.->|"points to"| R5
    R3 -.->|"allows only Vercel"| V3
```

**Env files:**
- `backend/.env.example` — Railway variables
- `frontend/.env.example` — Vercel variables

---

## 10-minute video timeline

| Time | Section | Diagram |
|------|---------|---------|
| 0:00–0:30 | Intro | #1 Architecture |
| 0:30–3:00 | Student live demo | #3 Student flow |
| 3:00–4:30 | CM/Instructor demo | #5 Staff flow |
| 4:30–5:30 | Admin + role change | #4 RBAC |
| 5:30–6:30 | Data flow explanation | #2 or #3 |
| 6:30–7:30 | Backend RBAC code | #4 |
| 7:30–8:30 | Progress logic code | #6 |
| 8:30–9:15 | Quiz grading code | #7 |
| 9:15–9:45 | Blog draft → publish | #8 |
| 9:45–10:00 | Deployment env vars | #9 |

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lms-demo.com` | `DemoAdmin123!` |
| Content Manager | `content@lms-demo.com` | `DemoContent123!` |
| Instructor | `instructor@lms-demo.com` | `DemoInstructor123!` |
| Student | `student@lms-demo.com` | `DemoStudent123!` |

---

## How to preview diagrams

1. Copy any ` ```mermaid ` block into [mermaid.live](https://mermaid.live)
2. Export as PNG/SVG for slides or OBS overlay
3. Or install **Markdown Preview Mermaid Support** in VS Code and open this file
