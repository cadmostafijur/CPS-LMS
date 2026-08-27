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
| 1 | main | Student in-app notifications | Done |
| 2 | `feature/course-discussions` | Course discussion / Q&A | Done (branch) |
| 3–10 | `feature/real-lms-extensions` | Reviews, announcements, question-bank import, assignment file URL, live sessions, tickets, analytics, wishlist | Packaged for spaced push |

## Spaced push

Use `scripts/spaced-push-features.ps1` — pushes branches with a **20 minute** gap (configurable).

