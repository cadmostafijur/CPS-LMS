# Database Schema

Visible schema for evaluators: [`prisma/schema.prisma`](../prisma/schema.prisma)

Runtime schemas (Strapi):

| Entity | Path |
|--------|------|
| User | `backend/src/extensions/users-permissions/content-types/user/schema.json` |
| Course | `backend/src/api/course/content-types/course/schema.json` |
| Lesson | `backend/src/api/lesson/content-types/lesson/schema.json` |
| Enrollment | `backend/src/api/enrollment/content-types/enrollment/schema.json` |
| LessonProgress | `backend/src/api/lesson-progress/content-types/lesson-progress/schema.json` |
| Quiz | `backend/src/api/quiz/content-types/quiz/schema.json` |
| QuizQuestion | `backend/src/api/quiz-question/content-types/quiz-question/schema.json` |
| QuizOption | `backend/src/api/quiz-option/content-types/quiz-option/schema.json` |
| QuizAttempt | `backend/src/api/quiz-attempt/content-types/quiz-attempt/schema.json` |
| QuizAnswer | `backend/src/api/quiz-answer/content-types/quiz-answer/schema.json` |
| BlogPost | `backend/src/api/blog-post/content-types/blog-post/schema.json` |

**Neon:** set `DATABASE_URL` in `backend/.env`, then start Strapi — it creates tables automatically. You will not see tables in Neon until Strapi has connected once with a valid URL.
