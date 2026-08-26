import type { Core } from '@strapi/strapi';
import { ROLE_NAMES } from '../utils/roles';
import { slugify } from '../utils/slug';

type RoleMap = Record<string, { id: number }>;

const DEMO_PASSWORD_ADMIN = 'DemoAdmin123!';
const DEMO_PASSWORD_CONTENT = 'DemoContent123!';
const DEMO_PASSWORD_INSTRUCTOR = 'DemoInstructor123!';
const DEMO_PASSWORD_STUDENT = 'DemoStudent123!';

async function createUser(
  strapi: Core.Strapi,
  data: {
    username: string;
    email: string;
    password: string;
    name: string;
    roleId: number;
  }
) {
  const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: data.email },
  });
  if (existing) return existing;

  return strapi.plugin('users-permissions').service('user').add({
    username: data.username,
    email: data.email,
    password: data.password,
    name: data.name,
    confirmed: true,
    blocked: false,
    isActive: true,
    provider: 'local',
    role: data.roleId,
  });
}

type QuizQ = {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
};

type CourseDef = {
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  lessons: Array<{ title: string; content: string; lessonType: 'TEXT' | 'VIDEO'; videoUrl?: string }>;
  quizTitle: string;
  questions: QuizQ[];
};

const COURSE_DEFS: CourseDef[] = [
  {
    title: 'Next.js Fundamentals',
    shortDescription: 'Build production apps with the App Router.',
    description:
      'Learn App Router, Server Components, data fetching, middleware, and deployment patterns used in real Next.js products.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop',
    lessons: [
      {
        title: 'Introduction to Next.js',
        lessonType: 'TEXT',
        content:
          '## Introduction\n\nNext.js is a React framework for production. You get routing, rendering strategies, and tooling out of the box.\n\n**Goals of this course**\n- Understand App Router\n- Ship a small feature end-to-end\n- Deploy confidently',
      },
      {
        title: 'App Router Basics',
        lessonType: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/Wm_xI7KntDs',
        content:
          '## App Router\n\nUse the `app/` directory for routes. Folders become URL segments. Special files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.',
      },
      {
        title: 'Server and Client Components',
        lessonType: 'TEXT',
        content:
          '## Rendering model\n\nServer Components fetch data close to the source. Add `"use client"` only when you need browser APIs, state, or effects.',
      },
      {
        title: 'Data Fetching Patterns',
        lessonType: 'TEXT',
        content:
          '## Fetching\n\nPrefer `async` Server Components with `fetch`. Use `cache: "no-store"` for personalized data. Keep secrets on the server.',
      },
      {
        title: 'Deploying Next.js Apps',
        lessonType: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/Sklc_fQBmcs',
        content:
          '## Deploy\n\nVercel is the default host. Set `NEXT_PUBLIC_*` for public config only. Never expose DB URLs or JWT secrets.',
      },
    ],
    quizTitle: 'Next.js Fundamentals Quiz',
    questions: [
      {
        question: 'Where do App Router pages live?',
        options: [
          { text: 'In the app/ directory', isCorrect: true },
          { text: 'Only in pages/api', isCorrect: false },
          { text: 'Inside node_modules', isCorrect: false },
          { text: 'In public/ only', isCorrect: false },
        ],
      },
      {
        question: 'When should you use "use client"?',
        options: [
          { text: 'When you need state, effects, or browser APIs', isCorrect: true },
          { text: 'On every file by default', isCorrect: false },
          { text: 'Only in middleware', isCorrect: false },
          { text: 'Never', isCorrect: false },
        ],
      },
      {
        question: 'Which file defines a route UI?',
        options: [
          { text: 'page.tsx', isCorrect: true },
          { text: 'secret.env', isCorrect: false },
          { text: 'package-lock.json', isCorrect: false },
          { text: 'favicon only', isCorrect: false },
        ],
      },
      {
        question: 'Where should JWT secrets live?',
        options: [
          { text: 'Server environment variables', isCorrect: true },
          { text: 'NEXT_PUBLIC_ variables', isCorrect: false },
          { text: 'Client localStorage as plaintext', isCorrect: false },
          { text: 'GitHub README', isCorrect: false },
        ],
      },
      {
        question: 'What does loading.tsx provide?',
        options: [
          { text: 'A loading UI for that route segment', isCorrect: true },
          { text: 'Database migrations', isCorrect: false },
          { text: 'Role permissions', isCorrect: false },
          { text: 'CSS reset only', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'React Mastery',
    shortDescription: 'Hooks, composition, and performance.',
    description:
      'Go beyond basics: hooks mental model, composition patterns, memoization trade-offs, and testing React UIs.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    lessons: [
      {
        title: 'React Mental Model',
        lessonType: 'TEXT',
        content:
          '## Mental model\n\nUI is a function of state. Props flow down. Events flow up. Prefer predictable data flow over clever hacks.',
      },
      {
        title: 'Hooks in Depth',
        lessonType: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q',
        content:
          '## Hooks\n\n`useState`, `useEffect`, and custom hooks. Effects are for synchronization — not for deriving state that can be computed.',
      },
      {
        title: 'Composition Patterns',
        lessonType: 'TEXT',
        content:
          '## Composition\n\nPrefer composition over inheritance. Children, render props, and compound components keep APIs flexible.',
      },
      {
        title: 'Performance Optimization',
        lessonType: 'TEXT',
        content:
          '## Performance\n\nMeasure first. Use `memo`/`useCallback` only when profiling shows benefit. Avoid premature optimization.',
      },
      {
        title: 'Testing React Components',
        lessonType: 'TEXT',
        content:
          '## Testing\n\nTest behavior users care about. Prefer Testing Library queries by role and accessible name.',
      },
    ],
    quizTitle: 'React Mastery Quiz',
    questions: [
      {
        question: 'What describes React UI best?',
        options: [
          { text: 'UI is a function of state', isCorrect: true },
          { text: 'UI is random each render', isCorrect: false },
          { text: 'UI must be imperative DOM code only', isCorrect: false },
          { text: 'UI cannot re-render', isCorrect: false },
        ],
      },
      {
        question: 'Effects are mainly for…',
        options: [
          { text: 'Synchronizing with external systems', isCorrect: true },
          { text: 'Replacing all props', isCorrect: false },
          { text: 'Storing passwords', isCorrect: false },
          { text: 'Skipping accessibility', isCorrect: false },
        ],
      },
      {
        question: 'Composition means…',
        options: [
          { text: 'Building UIs by combining smaller components', isCorrect: true },
          { text: 'Copying CSS from random sites', isCorrect: false },
          { text: 'Avoiding props entirely', isCorrect: false },
          { text: 'Using only one giant file', isCorrect: false },
        ],
      },
      {
        question: 'When should you memoize?',
        options: [
          { text: 'After measuring a real performance issue', isCorrect: true },
          { text: 'On every variable always', isCorrect: false },
          { text: 'Never in production apps', isCorrect: false },
          { text: 'Only in CSS files', isCorrect: false },
        ],
      },
      {
        question: 'Good tests focus on…',
        options: [
          { text: 'User-visible behavior', isCorrect: true },
          { text: 'Private implementation details only', isCorrect: false },
          { text: 'Snapshot of every CSS pixel', isCorrect: false },
          { text: 'Ignoring accessibility roles', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Node.js Backend Development',
    shortDescription: 'Secure APIs and production Node services.',
    description:
      'Build REST APIs with solid auth, validation, database access, and production hardening for Node.js services.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop',
    lessons: [
      {
        title: 'Node.js Runtime Essentials',
        lessonType: 'TEXT',
        content:
          '## Runtime\n\nNode runs JavaScript on the server. Understand the event loop, modules, and async I/O before scaling complexity.',
      },
      {
        title: 'Building REST APIs',
        lessonType: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/fgTGADljAeg',
        content:
          '## REST\n\nDesign resources with clear nouns. Use proper status codes. Keep handlers thin; put business rules in services.',
      },
      {
        title: 'Authentication & Authorization',
        lessonType: 'TEXT',
        content:
          '## AuthZ\n\nAuthentication proves identity. Authorization checks permissions. Never trust role values from the client body.',
      },
      {
        title: 'Databases and ORMs',
        lessonType: 'TEXT',
        content:
          '## Data layer\n\nUse parameterized queries. Model relationships clearly. Index fields you filter/join on frequently.',
      },
      {
        title: 'Production Hardening',
        lessonType: 'TEXT',
        content:
          '## Production\n\nHelmet/CORS, rate limits, structured logs, health checks, and secret management are non-negotiable.',
      },
    ],
    quizTitle: 'Node.js Backend Quiz',
    questions: [
      {
        question: 'Authorization should be enforced…',
        options: [
          { text: 'On the server for every protected action', isCorrect: true },
          { text: 'Only by hiding UI buttons', isCorrect: false },
          { text: 'Only in CSS', isCorrect: false },
          { text: 'Never for students', isCorrect: false },
        ],
      },
      {
        question: 'Client-supplied roles should be…',
        options: [
          { text: 'Ignored for authorization decisions', isCorrect: true },
          { text: 'Trusted blindly', isCorrect: false },
          { text: 'Stored in localStorage as admin', isCorrect: false },
          { text: 'Printed in responses as passwordHash', isCorrect: false },
        ],
      },
      {
        question: 'What is a good REST practice?',
        options: [
          { text: 'Use meaningful status codes', isCorrect: true },
          { text: 'Always return 200 with errors hidden', isCorrect: false },
          { text: 'Put business logic only in the browser', isCorrect: false },
          { text: 'Skip validation', isCorrect: false },
        ],
      },
      {
        question: 'SQL injections are prevented by…',
        options: [
          { text: 'Parameterized queries / ORM bindings', isCorrect: true },
          { text: 'String-concatenating user input', isCorrect: false },
          { text: 'Disabling HTTPS', isCorrect: false },
          { text: 'Exposing DATABASE_URL publicly', isCorrect: false },
        ],
      },
      {
        question: 'CORS in production should…',
        options: [
          { text: 'Allow only trusted frontend origins', isCorrect: true },
          { text: 'Always use * with credentials', isCorrect: false },
          { text: 'Disable all security headers', isCorrect: false },
          { text: 'Trust every domain', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'TypeScript Essentials',
    shortDescription: 'Types, generics, and safer JavaScript.',
    description:
      'Write reliable TypeScript: types vs interfaces, generics, utility types, and strict-mode habits for real codebases.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
    lessons: [
      {
        title: 'TypeScript Basics',
        lessonType: 'TEXT',
        content:
          '## Basics\n\nTypeScript adds a type system on top of JavaScript. Catch bugs at compile time before they hit production.',
      },
      {
        title: 'Interfaces and Types',
        lessonType: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/zQnAVpRiF7I',
        content:
          '## Modeling data\n\nUse `interface` for object shapes and `type` for unions/intersections. Prefer explicit public API types.',
      },
      {
        title: 'Generics',
        lessonType: 'TEXT',
        content:
          '## Generics\n\nGenerics let you write reusable functions/components without losing type safety (`Array<T>`, `Promise<T>`).',
      },
      {
        title: 'Utility Types',
        lessonType: 'TEXT',
        content:
          '## Utilities\n\n`Partial`, `Pick`, `Omit`, and `Record` help reshape types without duplication.',
      },
      {
        title: 'Strict Mode Practices',
        lessonType: 'TEXT',
        content:
          '## Strict mode\n\nEnable `strict`. Avoid `any`. Prefer `unknown` + narrowing. Treat type errors as real bugs.',
      },
    ],
    quizTitle: 'TypeScript Essentials Quiz',
    questions: [
      {
        question: 'What does TypeScript mainly add?',
        options: [
          { text: 'A static type system', isCorrect: true },
          { text: 'A new browser engine', isCorrect: false },
          { text: 'A database', isCorrect: false },
          { text: 'A CSS preprocessor', isCorrect: false },
        ],
      },
      {
        question: 'Generics help you…',
        options: [
          { text: 'Reuse logic while preserving types', isCorrect: true },
          { text: 'Delete all types', isCorrect: false },
          { text: 'Bypass authentication', isCorrect: false },
          { text: 'Hide runtime errors forever', isCorrect: false },
        ],
      },
      {
        question: 'Which is a TypeScript utility type?',
        options: [
          { text: 'Partial<T>', isCorrect: true },
          { text: 'RandomCSS', isCorrect: false },
          { text: 'MongoHack', isCorrect: false },
          { text: 'DIVONLY', isCorrect: false },
        ],
      },
      {
        question: 'Prefer what over any?',
        options: [
          { text: 'unknown with narrowing', isCorrect: true },
          { text: 'any everywhere', isCorrect: false },
          { text: 'Ignoring compiler errors', isCorrect: false },
          { text: 'Disabling TypeScript', isCorrect: false },
        ],
      },
      {
        question: 'Strict mode is useful because…',
        options: [
          { text: 'It catches more bugs at compile time', isCorrect: true },
          { text: 'It removes all tests', isCorrect: false },
          { text: 'It disables ESLint', isCorrect: false },
          { text: 'It makes CSS faster', isCorrect: false },
        ],
      },
    ],
  },
];

export async function seedDemoData(strapi: Core.Strapi, roleMap: RoleMap) {
  const userCount = await strapi.db.query('plugin::users-permissions.user').count();
  const courseCount = await strapi.db.query('api::course.course').count();
  const force = process.env.SEED_FORCE === 'true';

  if (!force && userCount > 0 && courseCount > 0) {
    strapi.log.info('[LMS] Demo data already present — skipping seed');
    return;
  }

  strapi.log.info('[LMS] Seeding demo users and content...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lms-demo.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || DEMO_PASSWORD_ADMIN;

  const admin = await createUser(strapi, {
    username: 'admin',
    email: adminEmail,
    password: adminPassword,
    name: 'Demo Admin',
    roleId: roleMap[ROLE_NAMES.ADMIN].id,
  });

  const content1 = await createUser(strapi, {
    username: 'content',
    email: 'content@lms-demo.com',
    password: DEMO_PASSWORD_CONTENT,
    name: 'Content Manager One',
    roleId: roleMap[ROLE_NAMES.CONTENT_MANAGER].id,
  });

  const content2 = await createUser(strapi, {
    username: 'content2',
    email: 'content2@lms-demo.com',
    password: DEMO_PASSWORD_CONTENT,
    name: 'Content Manager Two',
    roleId: roleMap[ROLE_NAMES.CONTENT_MANAGER].id,
  });

  const instructor1 = await createUser(strapi, {
    username: 'instructor',
    email: 'instructor@lms-demo.com',
    password: DEMO_PASSWORD_INSTRUCTOR,
    name: 'Instructor One',
    roleId: roleMap[ROLE_NAMES.INSTRUCTOR].id,
  });

  const instructor2 = await createUser(strapi, {
    username: 'instructor2',
    email: 'instructor2@lms-demo.com',
    password: DEMO_PASSWORD_INSTRUCTOR,
    name: 'Instructor Two',
    roleId: roleMap[ROLE_NAMES.INSTRUCTOR].id,
  });

  const instructor3 = await createUser(strapi, {
    username: 'instructor3',
    email: 'instructor3@lms-demo.com',
    password: DEMO_PASSWORD_INSTRUCTOR,
    name: 'Instructor Three',
    roleId: roleMap[ROLE_NAMES.INSTRUCTOR].id,
  });

  const instructors = [instructor1, instructor2, instructor3];

  const student1 = await createUser(strapi, {
    username: 'student',
    email: 'student@lms-demo.com',
    password: DEMO_PASSWORD_STUDENT,
    name: 'Student One',
    roleId: roleMap[ROLE_NAMES.STUDENT].id,
  });

  const students = [student1];
  for (let i = 2; i <= 8; i++) {
    students.push(
      await createUser(strapi, {
        username: `student${i}`,
        email: `student${i}@lms-demo.com`,
        password: DEMO_PASSWORD_STUDENT,
        name: `Student ${i}`,
        roleId: roleMap[ROLE_NAMES.STUDENT].id,
      })
    );
  }

  if (!force && courseCount > 0) {
    strapi.log.info('[LMS] Courses already exist — skipping course/blog seed');
    return;
  }

  const createdCourses: any[] = [];

  for (let i = 0; i < COURSE_DEFS.length; i++) {
    const def = COURSE_DEFS[i];
    const instructor = instructors[i % instructors.length];
    const slug = slugify(def.title);

    let course = await strapi.db.query('api::course.course').findOne({
      where: { slug },
    });

    if (!course) {
      course = await strapi.db.query('api::course.course').create({
        data: {
          title: def.title,
          slug,
          description: def.description,
          shortDescription: def.shortDescription,
          thumbnailUrl: def.thumbnailUrl,
          status: 'PUBLISHED',
          instructor: instructor.id,
          createdByUser: instructor.id,
        },
      });
    }

    const lessons: any[] = [];
    for (let li = 0; li < def.lessons.length; li++) {
      const lessonDef = def.lessons[li];
      const lessonSlug = `${slug}-${slugify(lessonDef.title)}`;
      let lesson = await strapi.db.query('api::lesson.lesson').findOne({
        where: { slug: lessonSlug },
      });
      if (!lesson) {
        lesson = await strapi.db.query('api::lesson.lesson').create({
          data: {
            title: lessonDef.title,
            slug: lessonSlug,
            content: lessonDef.content,
            videoUrl: lessonDef.videoUrl || null,
            lessonType: lessonDef.lessonType,
            order: li,
            course: course.id,
          },
        });
      }
      lessons.push(lesson);
    }

    let quiz = await strapi.db.query('api::quiz.quiz').findOne({
      where: { title: def.quizTitle, course: course.id },
    });
    if (!quiz) {
      quiz = await strapi.db.query('api::quiz.quiz').create({
        data: {
          title: def.quizTitle,
          description: `Assessment for ${def.title}`,
          course: course.id,
          createdByUser: instructor.id,
        },
      });

      for (let qi = 0; qi < def.questions.length; qi++) {
        const q = def.questions[qi];
        const question = await strapi.db.query('api::quiz-question.quiz-question').create({
          data: {
            question: q.question,
            order: qi,
            quiz: quiz.id,
          },
        });
        for (const opt of q.options) {
          await strapi.db.query('api::quiz-option.quiz-option').create({
            data: {
              text: opt.text,
              isCorrect: opt.isCorrect,
              question: question.id,
            },
          });
        }
      }
    }

    createdCourses.push({ ...course, lessons, quiz });
  }

  for (let si = 0; si < Math.min(students.length, 6); si++) {
    const student = students[si];
    const course = createdCourses[si % createdCourses.length];
    if (!course) continue;

    const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { student: student.id, course: course.id },
    });
    if (!existingEnrollment) {
      await strapi.db.query('api::enrollment.enrollment').create({
        data: {
          student: student.id,
          course: course.id,
          enrolledAt: new Date().toISOString(),
        },
      });
    }

    const lessons =
      course.lessons ||
      (await strapi.db.query('api::lesson.lesson').findMany({
        where: { course: course.id },
        orderBy: { order: 'asc' },
      }));

    const completeCount = Math.min(lessons.length, 2 + (si % 3));
    for (let li = 0; li < completeCount; li++) {
      const existingProgress = await strapi.db
        .query('api::lesson-progress.lesson-progress')
        .findOne({
          where: { student: student.id, lesson: lessons[li].id },
        });
      if (existingProgress) continue;
      await strapi.db.query('api::lesson-progress.lesson-progress').create({
        data: {
          student: student.id,
          course: course.id,
          lesson: lessons[li].id,
          completed: true,
          completedAt: new Date().toISOString(),
        },
      });
    }
  }

  const blogDefs = [
    {
      title: 'Welcome to CPS Academy',
      excerpt: 'How this LMS helps you learn modern web development.',
      body: '## Welcome\n\nCPS Academy combines structured courses, lesson progress, and auto-graded quizzes.\n\nStart with **Next.js Fundamentals**, then move into React, Node, and TypeScript.',
      status: 'PUBLISHED' as const,
      author: content1,
      cover:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop',
    },
    {
      title: 'How Progress Tracking Works',
      excerpt: 'Completed lessons become a durable percentage per course.',
      body: '## Progress\n\nWhen you mark a lesson complete, we store a `LessonProgress` row.\n\nPercentage = completed lessons / total lessons (capped at 100%). It survives refresh and re-login.',
      status: 'PUBLISHED' as const,
      author: content2,
      cover:
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop',
    },
    {
      title: 'Quiz Auto-Grading Explained',
      excerpt: 'Scores are computed on the server — never trust the client.',
      body: '## Grading\n\nStudents receive options without `isCorrect`. On submit, Strapi validates each option belongs to its question and grades server-side.',
      status: 'PUBLISHED' as const,
      author: content1,
      cover:
        'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&h=630&fit=crop',
    },
    {
      title: 'Upcoming Curriculum Updates',
      excerpt: 'Internal draft for next modules.',
      body: 'Draft: cloud modules, system design primer, and more TypeScript labs.',
      status: 'DRAFT' as const,
      author: admin,
      cover:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop',
    },
    {
      title: 'Instructor Onboarding Checklist',
      excerpt: 'Draft checklist for new instructors.',
      body: 'Draft: create course → add ordered lessons → attach quiz → publish when ready.',
      status: 'DRAFT' as const,
      author: content1,
      cover:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop',
    },
  ];

  for (const post of blogDefs) {
    const slug = slugify(post.title);
    const exists = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { slug },
    });
    if (exists) continue;

    await strapi.db.query('api::blog-post.blog-post').create({
      data: {
        title: post.title,
        slug,
        excerpt: post.excerpt,
        body: post.body,
        coverImageUrl: post.cover,
        status: post.status,
        author: post.author.id,
        publishedAt: post.status === 'PUBLISHED' ? new Date().toISOString() : null,
      },
    });
  }

  strapi.log.info(
    `[LMS] Seed complete. Admin: ${adminEmail}. Student: student@lms-demo.com / ${DEMO_PASSWORD_STUDENT}`
  );
}
