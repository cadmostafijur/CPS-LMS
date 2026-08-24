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

function lessonContent(title: string) {
  return `## ${title}\n\nThis lesson covers key concepts for ${title}. Practice the examples and complete the associated quiz when ready.`;
}

const COURSE_DEFS = [
  {
    title: 'Next.js Fundamentals',
    shortDescription: 'Build modern apps with the Next.js App Router.',
    description:
      'Learn routing, server components, data fetching, and deployment with Next.js.',
    lessons: [
      'Introduction to Next.js',
      'App Router Basics',
      'Server and Client Components',
      'Data Fetching Patterns',
      'Deploying Next.js Apps',
    ],
    quizTitle: 'Next.js Fundamentals Quiz',
  },
  {
    title: 'React Mastery',
    shortDescription: 'Deep dive into React patterns and hooks.',
    description: 'Master hooks, composition, performance, and advanced React patterns.',
    lessons: [
      'React Mental Model',
      'Hooks in Depth',
      'Composition Patterns',
      'Performance Optimization',
      'Testing React Components',
    ],
    quizTitle: 'React Mastery Quiz',
  },
  {
    title: 'Node.js Backend Development',
    shortDescription: 'APIs, auth, and production Node services.',
    description: 'Build secure REST APIs with Node.js, Express patterns, and best practices.',
    lessons: [
      'Node.js Runtime Essentials',
      'Building REST APIs',
      'Authentication & Authorization',
      'Databases and ORMs',
      'Production Hardening',
    ],
    quizTitle: 'Node.js Backend Quiz',
  },
  {
    title: 'TypeScript Essentials',
    shortDescription: 'Types, generics, and safer JavaScript.',
    description: 'Write reliable TypeScript for frontend and backend applications.',
    lessons: [
      'TypeScript Basics',
      'Interfaces and Types',
      'Generics',
      'Utility Types',
      'Strict Mode Practices',
    ],
    quizTitle: 'TypeScript Essentials Quiz',
  },
];

function buildQuizQuestions(courseTitle: string) {
  return [
    {
      question: `What is the primary focus of ${courseTitle}?`,
      options: [
        { text: 'Core concepts and practical skills', isCorrect: true },
        { text: 'Unrelated trivia', isCorrect: false },
        { text: 'Hardware assembly only', isCorrect: false },
        { text: 'None of the above', isCorrect: false },
      ],
    },
    {
      question: 'Which practice improves maintainability?',
      options: [
        { text: 'Clear naming and modular design', isCorrect: true },
        { text: 'Copy-paste everywhere', isCorrect: false },
        { text: 'Ignoring errors', isCorrect: false },
        { text: 'Hardcoding secrets', isCorrect: false },
      ],
    },
    {
      question: 'What should you do before submitting a quiz?',
      options: [
        { text: 'Review the lesson material', isCorrect: true },
        { text: 'Guess randomly', isCorrect: false },
        { text: 'Skip reading', isCorrect: false },
        { text: 'Disable validation', isCorrect: false },
      ],
    },
    {
      question: 'Which statement about APIs is true?',
      options: [
        { text: 'Validate input on the server', isCorrect: true },
        { text: 'Trust all client data', isCorrect: false },
        { text: 'Expose private keys', isCorrect: false },
        { text: 'Skip authentication', isCorrect: false },
      ],
    },
    {
      question: 'Progress should be capped at what maximum percentage?',
      options: [
        { text: '100%', isCorrect: true },
        { text: '150%', isCorrect: false },
        { text: '200%', isCorrect: false },
        { text: 'Unlimited', isCorrect: false },
      ],
    },
  ];
}

export async function seedDemoData(strapi: Core.Strapi, roleMap: RoleMap) {
  const userCount = await strapi.db.query('plugin::users-permissions.user').count();
  const forceSeed = process.env.SEED_ON_BOOTSTRAP === 'true';

  if (userCount > 0 && !forceSeed) {
    strapi.log.info('[LMS] Users already exist — skipping demo seed');
    return;
  }

  if (userCount > 0 && forceSeed) {
    const courseCount = await strapi.db.query('api::course.course').count();
    if (courseCount > 0) {
      strapi.log.info('[LMS] SEED_ON_BOOTSTRAP set but data exists — skipping content seed');
      return;
    }
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

  const createdCourses: any[] = [];

  for (let i = 0; i < COURSE_DEFS.length; i++) {
    const def = COURSE_DEFS[i];
    const instructor = instructors[i % instructors.length];
    const slug = slugify(def.title);

    const existingCourse = await strapi.db.query('api::course.course').findOne({
      where: { slug },
    });
    if (existingCourse) {
      createdCourses.push(existingCourse);
      continue;
    }

    const course = await strapi.db.query('api::course.course').create({
      data: {
        title: def.title,
        slug,
        description: def.description,
        shortDescription: def.shortDescription,
        thumbnailUrl: `https://placehold.co/600x400?text=${encodeURIComponent(def.title)}`,
        status: 'PUBLISHED',
        instructor: instructor.id,
        createdByUser: instructor.id,
      },
    });

    const lessons: any[] = [];
    for (let li = 0; li < def.lessons.length; li++) {
      const title = def.lessons[li];
      const lesson = await strapi.db.query('api::lesson.lesson').create({
        data: {
          title,
          slug: `${slug}-${slugify(title)}`,
          content: lessonContent(title),
          videoUrl: li % 2 === 0 ? null : `https://example.com/videos/${slug}-${li}`,
          lessonType: li % 2 === 0 ? 'TEXT' : 'VIDEO',
          order: li,
          course: course.id,
        },
      });
      lessons.push(lesson);
    }

    const quiz = await strapi.db.query('api::quiz.quiz').create({
      data: {
        title: def.quizTitle,
        description: `Assessment for ${def.title}`,
        course: course.id,
        createdByUser: instructor.id,
      },
    });

    const questions = buildQuizQuestions(def.title);
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
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

    createdCourses.push({ ...course, lessons, quiz });
  }

  // Enrollments + progress + quiz attempts
  for (let si = 0; si < Math.min(students.length, 6); si++) {
    const student = students[si];
    const course = createdCourses[si % createdCourses.length];
    if (!course) continue;

    const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { student: student.id, course: course.id },
    });
    if (existingEnrollment) continue;

    await strapi.db.query('api::enrollment.enrollment').create({
      data: {
        student: student.id,
        course: course.id,
        enrolledAt: new Date().toISOString(),
      },
    });

    const lessons =
      course.lessons ||
      (await strapi.db.query('api::lesson.lesson').findMany({
        where: { course: course.id },
      }));

    const completeCount = Math.min(lessons.length, 2 + (si % 3));
    for (let li = 0; li < completeCount; li++) {
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

    const quiz =
      course.quiz ||
      (await strapi.db.query('api::quiz.quiz').findOne({
        where: { course: course.id },
      }));

    if (quiz && si < 3) {
      const questions = await strapi.db.query('api::quiz-question.quiz-question').findMany({
        where: { quiz: quiz.id },
        populate: { options: true },
      });

      let score = 0;
      const attempt = await strapi.db.query('api::quiz-attempt.quiz-attempt').create({
        data: {
          quiz: quiz.id,
          student: student.id,
          score: 0,
          totalQuestions: questions.length,
          percentage: 0,
          submittedAt: new Date().toISOString(),
        },
      });

      for (const question of questions) {
        const correct = (question.options || []).find((o: any) => o.isCorrect);
        const pick =
          si === 0
            ? correct
            : question.options?.[si % (question.options?.length || 1)] || correct;
        const isCorrect = Boolean(pick?.isCorrect);
        if (isCorrect) score += 1;

        await strapi.db.query('api::quiz-answer.quiz-answer').create({
          data: {
            attempt: attempt.id,
            question: question.id,
            selectedOption: pick?.id,
            isCorrect,
          },
        });
      }

      const percentage =
        questions.length > 0
          ? Math.round((score / questions.length) * 10000) / 100
          : 0;

      await strapi.db.query('api::quiz-attempt.quiz-attempt').update({
        where: { id: attempt.id },
        data: { score, percentage },
      });
    }
  }

  // Blog posts
  const blogDefs = [
    {
      title: 'Welcome to CPS Academy LMS',
      excerpt: 'An overview of the learning platform.',
      body: 'CPS Academy LMS helps students learn modern web development with structured courses, quizzes, and progress tracking.',
      status: 'PUBLISHED' as const,
      author: content1,
    },
    {
      title: 'How to Succeed in Online Courses',
      excerpt: 'Tips for consistent learning.',
      body: 'Set a schedule, complete lessons in order, and practice with quizzes after each module.',
      status: 'PUBLISHED' as const,
      author: content2,
    },
    {
      title: 'Upcoming Curriculum Updates',
      excerpt: 'Draft notes for next release.',
      body: 'We are planning additional TypeScript and cloud modules. This draft is for internal review.',
      status: 'DRAFT' as const,
      author: admin,
    },
    {
      title: 'Instructor Guide Draft',
      excerpt: 'Internal instructor onboarding draft.',
      body: 'Draft checklist for instructors creating courses, lessons, and quizzes.',
      status: 'DRAFT' as const,
      author: content1,
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
        coverImageUrl: `https://placehold.co/800x400?text=${encodeURIComponent(post.title)}`,
        status: post.status,
        author: post.author.id,
        publishedAt: post.status === 'PUBLISHED' ? new Date().toISOString() : null,
      },
    });
  }

  strapi.log.info(
    `[LMS] Seed complete. Admin: ${adminEmail} / (SEED_ADMIN_PASSWORD or default). Students: student@lms-demo.com / ${DEMO_PASSWORD_STUDENT}`
  );
}
