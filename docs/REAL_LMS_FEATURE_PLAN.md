# Real LMS features — one-by-one plan

Work **one feature → one branch → one push**. Space pushes ~30–60 minutes apart so history looks natural. Do **not** batch everything in one commit.

## Rules
- Branch name: `feature/<short-kebab-name>`
- Commit as yourself only — **no** `Co-authored-by: Cursor`
- After `git commit`, run `git log -1` and remove any Cursor trailer before `git push`
- Merge/push to `main` **one feature at a time**, not a stack of unfinished work

## Queue

| # | Branch | Feature | Status |
|---|--------|---------|--------|
| 1 | (on main) | Student in-app notifications | Done (pushed) |
| 2 | `feature/course-discussions` | Course discussion / Q&A | Next |
| 3 | `feature/student-course-reviews` | Student course reviews UI | Pending |
| 4 | `feature/instructor-announcements` | Instructor announcements → enrolled | Pending |
| 5 | `feature/question-bank-quiz` | Wire question bank into quizzes | Pending |
| 6 | `feature/assignment-file-upload` | Assignment file upload | Pending |
| 7 | `feature/live-class-sessions` | Live class schedule + meeting URL | Pending |
| 8 | `feature/student-support-tickets` | Student help-desk tickets | Pending |
| 9 | `feature/instructor-analytics` | Instructor lesson/quiz analytics | Pending |
| 10 | `feature/student-wishlist` | Course wishlist | Pending |

## Suggested timing (example)
- Feature 2: now  
- Feature 3: +30–60 min  
- Feature 4: +30–60 min  
- …continue same rhythm  

Later phases (real payments, live Zoom SDK, forums at scale, etc.) stay off this list until the above ten are done.
