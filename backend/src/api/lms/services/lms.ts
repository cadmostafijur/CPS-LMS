import { errors } from '@strapi/utils';
import type { Core } from '@strapi/strapi';
import { getAuthUser } from '../../../utils/auth';
import {
  assertCourseOwnerOrManager,
  canManageBlog,
  canManageCourse,
} from '../../../utils/ownership';
import { calculateCourseProgress } from '../../../utils/progress';
import { gradeQuizAnswers, sanitizeQuizForTake } from '../../../utils/quiz';
import {
  isAdmin,
  isContentManager,
  isInstructor,
  isStudent,
  ROLE_NAMES,
} from '../../../utils/roles';
import { sanitizeUser } from '../../../utils/sanitize';
import { ensureUniqueSlug } from '../../../utils/slug';
import { createOpsHandlers } from './ops';

const { ApplicationError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } =
  errors;

type Ctx = any;

async function resolveByIdOrDocumentId(strapi: Core.Strapi, uid: string, id: string) {
  const byDocumentId = await strapi.db.query(uid).findOne({
    where: { documentId: id },
  });
  if (byDocumentId) return byDocumentId;

  if (/^\d+$/.test(String(id))) {
    return strapi.db.query(uid).findOne({
      where: { id: Number(id) },
    });
  }

  return null;
}

async function findCourse(strapi: Core.Strapi, courseId: string, populate: any = true) {
  const where: any = /^\d+$/.test(String(courseId))
    ? { $or: [{ documentId: courseId }, { id: Number(courseId) }] }
    : { documentId: courseId };

  return strapi.db.query('api::course.course').findOne({ where, populate });
}

async function findLesson(strapi: Core.Strapi, lessonId: string, populate: any = true) {
  const where: any = /^\d+$/.test(String(lessonId))
    ? { $or: [{ documentId: lessonId }, { id: Number(lessonId) }] }
    : { documentId: lessonId };

  return strapi.db.query('api::lesson.lesson').findOne({ where, populate });
}

async function findQuiz(strapi: Core.Strapi, quizId: string, populate: any = true) {
  const where: any = /^\d+$/.test(String(quizId))
    ? { $or: [{ documentId: quizId }, { id: Number(quizId) }] }
    : { documentId: quizId };

  return strapi.db.query('api::quiz.quiz').findOne({ where, populate });
}

function makeCertificateCode() {
  const part = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CPS-${part()}-${part()}`;
}

async function issueCertificateIfNeeded(
  strapi: Core.Strapi,
  student: any,
  course: any,
  enrollment: any
) {
  const existing = await strapi.db.query('api::certificate.certificate').findOne({
    where: {
      student: student.id,
      course: course.id,
    },
  });
  if (existing) return existing;

  const studentName =
    student.name || student.username || student.email || 'Student';
  const courseTitle = course.title || 'Course';

  return strapi.db.query('api::certificate.certificate').create({
    data: {
      code: makeCertificateCode(),
      issuedAt: new Date().toISOString(),
      studentName,
      courseTitle,
      student: student.id,
      course: course.id,
      enrollment: enrollment.id,
    },
    populate: { student: true, course: true },
  });
}

function sanitizeCertificate(cert: any) {
  if (!cert) return null;
  return {
    id: cert.id,
    documentId: cert.documentId,
    code: cert.code,
    status: cert.status || "ISSUED",
    issuedAt: cert.issuedAt,
    studentName: cert.studentName,
    courseTitle: cert.courseTitle,
    student: cert.student ? sanitizeUser(cert.student) : null,
    course: cert.course
      ? {
          id: cert.course.id,
          documentId: cert.course.documentId,
          title: cert.course.title,
          slug: cert.course.slug,
        }
      : null,
  };
}

function courseIsFree(course: any) {
  if (typeof course?.isFree === 'boolean') return course.isFree;
  const price = Number(course?.price ?? 0);
  return !(price > 0);
}

function coursePrice(course: any) {
  if (courseIsFree(course)) return 0;
  return Math.max(0, Number(course?.price ?? 0));
}

function sanitizeCoupon(coupon: any) {
  if (!coupon) return null;
  return {
    id: coupon.id,
    documentId: coupon.documentId,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue ?? 0),
    isActive: coupon.isActive !== false,
    maxUses: coupon.maxUses ?? null,
    usedCount: coupon.usedCount ?? 0,
    expiresAt: coupon.expiresAt ?? null,
    minAmount: Number(coupon.minAmount ?? 0),
  };
}

function sanitizeBanner(banner: any) {
  if (!banner) return null;
  return {
    id: banner.id,
    documentId: banner.documentId,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.ctaLabel,
    linkUrl: banner.linkUrl,
    imageUrl: banner.imageUrl,
    placement: banner.placement || 'BOTH',
    isActive: banner.isActive !== false,
    sortOrder: banner.sortOrder ?? 0,
  };
}

function sanitizeCategory(cat: any) {
  if (!cat) return null;
  return {
    id: cat.id,
    documentId: cat.documentId,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || null,
    isActive: cat.isActive !== false,
  };
}

function sanitizeModule(mod: any) {
  if (!mod) return null;
  return {
    id: mod.id,
    documentId: mod.documentId,
    title: mod.title,
    description: mod.description || null,
    order: mod.order ?? 0,
  };
}

function courseBuilderFields(course: any) {
  return {
    coverImageUrl: course.coverImageUrl || null,
    difficulty: course.difficulty || 'BEGINNER',
    language: course.language || 'English',
    discountPrice: course.discountPrice != null ? Number(course.discountPrice) : null,
    requirements: course.requirements || null,
    outcomes: course.outcomes || null,
    publishedAt: course.publishedAt || null,
    category: sanitizeCategory(course.category),
  };
}

function lessonPublicFields(lesson: any, includeContent: boolean) {
  const base = {
    id: lesson.id,
    documentId: lesson.documentId,
    title: lesson.title,
    slug: lesson.slug,
    lessonType: lesson.lessonType,
    order: lesson.order,
    isPreview: Boolean(lesson.isPreview),
    durationMinutes: lesson.durationMinutes ?? 0,
    module: lesson.module ? sanitizeModule(lesson.module) : null,
  };
  if (!includeContent) return base;
  return {
    ...base,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    documentUrl: lesson.documentUrl,
    externalUrl: lesson.externalUrl,
  };
}

async function applyCouponToPrice(
  strapi: Core.Strapi,
  originalPrice: number,
  couponCode?: string | null
) {
  if (!couponCode || !String(couponCode).trim()) {
    return {
      amountDue: originalPrice,
      discount: 0,
      coupon: null as any,
    };
  }

  const code = String(couponCode).trim().toUpperCase();
  const coupon = await strapi.db.query('api::coupon.coupon').findOne({
    where: { code },
  });
  if (!coupon) throw new ValidationError('Invalid coupon code');
  if (coupon.isActive === false) throw new ValidationError('Coupon is inactive');
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    throw new ValidationError('Coupon has expired');
  }
  if (
    coupon.maxUses != null &&
    Number(coupon.usedCount || 0) >= Number(coupon.maxUses)
  ) {
    throw new ValidationError('Coupon usage limit reached');
  }
  const minAmount = Number(coupon.minAmount || 0);
  if (originalPrice < minAmount) {
    throw new ValidationError(`Coupon requires a minimum of ${minAmount}`);
  }

  let discount = 0;
  const value = Number(coupon.discountValue || 0);
  if (coupon.discountType === 'FIXED') {
    discount = Math.min(originalPrice, value);
  } else {
    discount = Math.min(originalPrice, (originalPrice * value) / 100);
  }

  return {
    amountDue: Math.max(0, Number((originalPrice - discount).toFixed(2))),
    discount: Number(discount.toFixed(2)),
    coupon,
  };
}

function pricingFields(course: any) {
  const free = courseIsFree(course);
  return {
    isFree: free,
    price: free ? 0 : coursePrice(course),
    currency: course.currency || 'USD',
  };
}

async function getCourseProgressForStudent(
  strapi: Core.Strapi,
  studentId: number,
  courseId: number
) {
  const lessons = await strapi.db.query('api::lesson.lesson').findMany({
    where: { course: courseId },
  });
  const completed = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
    where: {
      student: studentId,
      course: courseId,
      completed: true,
    },
  });

  const totalLessons = lessons.length;
  const completedCount = completed.length;
  const percentage = calculateCourseProgress(completedCount, totalLessons);

  return { totalLessons, completedCount, percentage };
}

function assertNotStudent(user: any) {
  if (isStudent(user)) {
    throw new ForbiddenError('Students cannot perform this action');
  }
}

/** Spec matrix: enroll / take quizzes / complete lessons = Student only */
function assertStudentOnly(user: any) {
  if (!isStudent(user)) {
    throw new ForbiddenError('Only students can perform this action');
  }
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async me(ctx: Ctx) {
    const authHeader = String(ctx.request?.header?.authorization || '');
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    let payload: { id?: number };
    try {
      payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
    } catch {
      throw new UnauthorizedError('Invalid token');
    }

    if (!payload?.id) {
      throw new UnauthorizedError('Invalid token payload');
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: payload.id },
      populate: { role: true },
    });

    if (!user || user.blocked || user.isActive === false) {
      throw new UnauthorizedError('User not available');
    }

    return { data: sanitizeUser(user) };
  },

  async updateMe(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const body = ctx.request.body || {};
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name) throw new ValidationError('Name is required');
      data.name = name;
    }
    if (body.phone !== undefined) {
      data.phone = body.phone ? String(body.phone).trim() : null;
    }
    if (body.avatarUrl !== undefined) {
      data.avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;
    }
    if (body.username !== undefined) {
      const username = String(body.username || '').trim();
      if (username.length < 3) throw new ValidationError('Username must be at least 3 characters');
      const clash = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username, id: { $ne: user.id } },
      });
      if (clash) throw new ValidationError('Username already taken');
      data.username = username;
    }

    if (Object.keys(data).length === 0) {
      throw new ValidationError('No profile fields to update');
    }

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data,
      populate: { role: true },
    });

    return { data: sanitizeUser(updated) };
  },

  async changeMyPassword(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const { currentPassword, newPassword } = ctx.request.body || {};
    if (!currentPassword || !newPassword) {
      throw new ValidationError('currentPassword and newPassword are required');
    }
    if (String(newPassword).length < 8) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    const valid = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(String(currentPassword), user.password);
    if (!valid) throw new ValidationError('Current password is incorrect');

    await strapi.plugin('users-permissions').service('user').edit(user.id, {
      password: String(newPassword),
    });

    return { data: { ok: true } };
  },

  async enroll(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertStudentOnly(user);
    const { courseId } = ctx.params;
    const body = ctx.request.body || {};
    const couponCode = body.couponCode || body.coupon || null;

    const course = await findCourse(strapi, courseId, {
      instructor: true,
      createdByUser: true,
    });

    if (!course) throw new NotFoundError('Course not found');
    if (course.status !== 'PUBLISHED') {
      throw new ForbiddenError('Only published courses can be enrolled');
    }

    const existing = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: {
        student: user.id,
        course: course.id,
      },
    });

    if (existing) {
      throw new ApplicationError('Already enrolled in this course');
    }

    const originalPrice = coursePrice(course);
    const free = courseIsFree(course);
    let amountPaid = 0;
    let appliedCoupon: any = null;

    if (!free && originalPrice > 0) {
      const priced = await applyCouponToPrice(strapi, originalPrice, couponCode);
      amountPaid = priced.amountDue;
      appliedCoupon = priced.coupon;

      // Simulated checkout: paid courses enroll after price/coupon resolution.
      // amountPaid === 0 means a 100% coupon was applied.
    } else if (couponCode) {
      // Ignore coupons on free courses (still enroll)
    }

    const enrollment = await strapi.db.query('api::enrollment.enrollment').create({
      data: {
        student: user.id,
        course: course.id,
        enrolledAt: new Date().toISOString(),
        isFreeEnrollment: free || amountPaid === 0,
        originalPrice,
        amountPaid,
        couponCode: appliedCoupon?.code || null,
        currency: course.currency || 'USD',
      },
      populate: { course: true, student: true },
    });

    if (appliedCoupon) {
      await strapi.db.query('api::coupon.coupon').update({
        where: { id: appliedCoupon.id },
        data: { usedCount: Number(appliedCoupon.usedCount || 0) + 1 },
      });
    }

    return {
      data: {
        ...enrollment,
        student: sanitizeUser(enrollment.student || user),
        pricing: {
          isFree: free,
          originalPrice,
          amountPaid,
          couponCode: appliedCoupon?.code || null,
          currency: course.currency || 'USD',
        },
      },
    };
  },

  async myCourses(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertStudentOnly(user);

    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      where: { student: user.id },
      populate: {
        course: {
          populate: { instructor: true, lessons: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const data = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const progress = enrollment.course
          ? await getCourseProgressForStudent(strapi, user.id, enrollment.course.id)
          : { totalLessons: 0, completedCount: 0, percentage: 0 };

        let certificate = enrollment.course
          ? await strapi.db.query('api::certificate.certificate').findOne({
              where: { student: user.id, course: enrollment.course.id },
            })
          : null;

        if (
          !certificate &&
          enrollment.course &&
          (enrollment.completedAt || progress.percentage >= 100)
        ) {
          certificate = await issueCertificateIfNeeded(
            strapi,
            user,
            enrollment.course,
            enrollment
          );
        }

        return {
          ...enrollment,
          progress,
          certificate: sanitizeCertificate(certificate),
          student: sanitizeUser(enrollment.student || user),
        };
      })
    );

    return { data };
  },

  async completeLesson(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertStudentOnly(user);
    const { lessonId } = ctx.params;

    const lesson = await findLesson(strapi, lessonId, { course: true });
    if (!lesson) throw new NotFoundError('Lesson not found');
    if (!lesson.course) throw new ValidationError('Lesson has no course');

    const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: {
        student: user.id,
        course: lesson.course.id,
      },
    });

    if (!enrollment) {
      throw new ForbiddenError('You must be enrolled to complete lessons');
    }

    const existing = await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
      where: {
        student: user.id,
        lesson: lesson.id,
      },
    });

    let progress;
    if (existing) {
      progress = await strapi.db.query('api::lesson-progress.lesson-progress').update({
        where: { id: existing.id },
        data: {
          completed: true,
          completedAt: new Date().toISOString(),
          course: lesson.course.id,
        },
      });
    } else {
      progress = await strapi.db.query('api::lesson-progress.lesson-progress').create({
        data: {
          student: user.id,
          course: lesson.course.id,
          lesson: lesson.id,
          completed: true,
          completedAt: new Date().toISOString(),
        },
      });
    }

    const courseProgress = await getCourseProgressForStudent(
      strapi,
      user.id,
      lesson.course.id
    );

    let certificate = null;
    if (courseProgress.percentage >= 100) {
      if (!enrollment.completedAt) {
        await strapi.db.query('api::enrollment.enrollment').update({
          where: { id: enrollment.id },
          data: { completedAt: new Date().toISOString() },
        });
      }
      certificate = await issueCertificateIfNeeded(
        strapi,
        user,
        lesson.course,
        enrollment
      );
    }

    return {
      data: {
        progress,
        courseProgress,
        certificate: sanitizeCertificate(certificate),
      },
    };
  },

  async courseProgress(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const { courseId } = ctx.params;

    const course = await findCourse(strapi, courseId, {
      instructor: true,
      createdByUser: true,
      lessons: true,
    });
    if (!course) throw new NotFoundError('Course not found');

    const isOwnerOrManager = canManageCourse(user, course);
    const targetStudentId = isOwnerOrManager
      ? Number(ctx.query.studentId || user.id)
      : user.id;

    if (!isOwnerOrManager && targetStudentId !== user.id) {
      throw new ForbiddenError('Cannot view other students progress');
    }

    if (!isOwnerOrManager) {
      const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
        where: { student: user.id, course: course.id },
      });
      if (!enrollment) throw new ForbiddenError('Not enrolled in this course');
    }

    const progress = await getCourseProgressForStudent(strapi, targetStudentId, course.id);
    const lessonProgress = await strapi.db
      .query('api::lesson-progress.lesson-progress')
      .findMany({
        where: { student: targetStudentId, course: course.id },
        populate: { lesson: true },
      });

    return {
      data: {
        course: { id: course.id, documentId: course.documentId, title: course.title },
        ...progress,
        lessons: lessonProgress,
      },
    };
  },

  async takeQuiz(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertStudentOnly(user);
    const { quizId } = ctx.params;

    const quiz = await findQuiz(strapi, quizId, {
      course: true,
      questions: {
        populate: { options: true },
      },
    });

    if (!quiz) throw new NotFoundError('Quiz not found');

    if (quiz.course) {
      const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
        where: { student: user.id, course: quiz.course.id },
      });
      if (!enrollment) {
        throw new ForbiddenError('You must be enrolled to take this quiz');
      }
    }

    if (Array.isArray(quiz.questions)) {
      quiz.questions.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    }

    // Ensure isCorrect is never returned (private attr + explicit sanitize)
    return { data: sanitizeQuizForTake(quiz) };
  },

  async submitQuiz(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertStudentOnly(user);
    const { quizId } = ctx.params;
    const submissions = ctx.request.body?.answers;

    if (!Array.isArray(submissions)) {
      throw new ValidationError('answers must be an array of {questionId, selectedOptionId}');
    }

    const quiz = await findQuiz(strapi, quizId, {
      course: true,
      questions: {
        populate: { options: true },
      },
    });

    if (!quiz) throw new NotFoundError('Quiz not found');

    if (quiz.course) {
      const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
        where: { student: user.id, course: quiz.course.id },
      });
      if (!enrollment) {
        throw new ForbiddenError('You must be enrolled to submit this quiz');
      }
    }

    const questions = (quiz.questions || []).map((q: any) => ({
      id: q.id,
      documentId: q.documentId,
      question: q.question,
      options: (q.options || []).map((o: any) => ({
        id: o.id,
        documentId: o.documentId,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    }));

    let graded;
    try {
      graded = gradeQuizAnswers(questions, submissions);
    } catch (err: any) {
      throw new ValidationError(err.message || 'Invalid quiz submission');
    }

    const attempt = await strapi.db.query('api::quiz-attempt.quiz-attempt').create({
      data: {
        quiz: quiz.id,
        student: user.id,
        score: graded.score,
        totalQuestions: graded.totalQuestions,
        percentage: graded.percentage,
        submittedAt: new Date().toISOString(),
      },
    });

    for (const answer of graded.answers) {
      const question = questions.find(
        (q: any) =>
          String(q.id) === String(answer.questionId) ||
          q.documentId === String(answer.questionId)
      );
      const option = (question?.options || []).find(
        (o: any) =>
          String(o.id) === String(answer.selectedOptionId) ||
          o.documentId === String(answer.selectedOptionId)
      );

      await strapi.db.query('api::quiz-answer.quiz-answer').create({
        data: {
          attempt: attempt.id,
          question: question?.id,
          selectedOption: option?.id,
          isCorrect: answer.isCorrect,
        },
      });
    }

    const fullAttempt = await strapi.db.query('api::quiz-attempt.quiz-attempt').findOne({
      where: { id: attempt.id },
      populate: {
        answers: {
          populate: { question: true, selectedOption: true },
        },
      },
    });

    return { data: fullAttempt };
  },

  async quizAttempts(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const { quizId } = ctx.params;

    const quiz = await findQuiz(strapi, quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const attempts = await strapi.db.query('api::quiz-attempt.quiz-attempt').findMany({
      where: {
        quiz: quiz.id,
        student: user.id,
      },
      orderBy: { submittedAt: 'desc' },
      populate: {
        answers: {
          populate: { question: true, selectedOption: true },
        },
      },
    });

    return { data: attempts };
  },

  async studentDashboard(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertStudentOnly(user);

    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      where: { student: user.id },
      populate: {
        course: {
          populate: { lessons: true },
        },
      },
    });

    const withProgress = await Promise.all(
      enrollments.map(async (e: any) => ({
        enrollment: e,
        progress: e.course
          ? await getCourseProgressForStudent(strapi, user.id, e.course.id)
          : { percentage: 0 },
      }))
    );

    const attempts = await strapi.db.query('api::quiz-attempt.quiz-attempt').count({
      where: { student: user.id },
    });

    return {
      data: {
        user: sanitizeUser(user),
        enrolledCount: enrollments.length,
        completedCourses: withProgress.filter((p) => (p.progress?.percentage ?? 0) >= 100).length,
        quizAttempts: attempts,
        courses: withProgress,
      },
    };
  },

  async instructorDashboard(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);

    const courses = await strapi.db.query('api::course.course').findMany({
      where: {
        $or: [{ instructor: user.id }, { createdByUser: user.id }],
      },
      populate: { enrollments: true, lessons: true, quizzes: true },
    });

    const enrollmentCount = courses.reduce(
      (sum: number, c: any) => sum + (c.enrollments?.length || 0),
      0
    );

    return {
      data: {
        user: sanitizeUser(user),
        courseCount: courses.length,
        enrollmentCount,
        courses: courses.map((c: any) => ({
          id: c.id,
          documentId: c.documentId,
          title: c.title,
          status: c.status,
          lessonCount: c.lessons?.length || 0,
          quizCount: c.quizzes?.length || 0,
          enrollmentCount: c.enrollments?.length || 0,
        })),
      },
    };
  },

  async contentManagerDashboard(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }

    const [
      courses,
      publishedCourses,
      draftCourses,
      blogPosts,
      publishedBlog,
      draftBlog,
      categories,
      lessons,
      quizzes,
      banners,
    ] = await Promise.all([
      strapi.db.query('api::course.course').count(),
      strapi.db.query('api::course.course').count({ where: { status: 'PUBLISHED' } }),
      strapi.db.query('api::course.course').count({ where: { status: 'DRAFT' } }),
      strapi.db.query('api::blog-post.blog-post').count(),
      strapi.db.query('api::blog-post.blog-post').count({ where: { status: 'PUBLISHED' } }),
      strapi.db.query('api::blog-post.blog-post').count({ where: { status: 'DRAFT' } }),
      strapi.db.query('api::course-category.course-category').count().catch(() => 0),
      strapi.db.query('api::lesson.lesson').count(),
      strapi.db.query('api::quiz.quiz').count(),
      strapi.db.query('api::banner.banner').count({ where: { isActive: true } }).catch(() => 0),
    ]);

    const recentCourses = await strapi.db.query('api::course.course').findMany({
      orderBy: { updatedAt: 'desc' },
      limit: 5,
      populate: { instructor: true },
    });

    return {
      data: {
        user: sanitizeUser(user),
        courses,
        publishedCourses,
        draftCourses,
        blogPosts,
        publishedBlog,
        draftBlog,
        categories,
        lessons,
        quizzes,
        activeBanners: banners,
        recentCourses: recentCourses.map((c: any) => ({
          id: c.id,
          documentId: c.documentId,
          title: c.title,
          status: c.status,
          instructor: sanitizeUser(c.instructor),
          updatedAt: c.updatedAt,
        })),
      },
    };
  },

  async staffListCourses(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user) && !isInstructor(user)) {
      throw new ForbiddenError('Staff required');
    }

    const where: any = {};
    if (isInstructor(user) && !isAdmin(user) && !isContentManager(user)) {
      where.$or = [{ instructor: user.id }, { createdByUser: user.id }];
    }

    const courses = await strapi.db.query('api::course.course').findMany({
      where,
      populate: { instructor: true, lessons: true, quizzes: true, category: true },
      orderBy: { updatedAt: 'desc' },
      limit: 200,
    });

    return {
      data: courses.map((c: any) => ({
        id: c.id,
        documentId: c.documentId,
        title: c.title,
        slug: c.slug,
        status: c.status,
        isFree: c.isFree,
        price: c.price,
        currency: c.currency,
        category: c.category
          ? { id: c.category.id, name: c.category.name, slug: c.category.slug }
          : null,
        instructor: sanitizeUser(c.instructor),
        lessonCount: c.lessons?.length || 0,
        quizCount: c.quizzes?.length || 0,
        updatedAt: c.updatedAt,
      })),
    };
  },

  /** Instructor / CM / Admin: view enrollments + progress for courses they manage */
  async staffListProgress(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user) && !isInstructor(user)) {
      throw new ForbiddenError('Staff required');
    }

    const courseFilter: any =
      isInstructor(user) && !isAdmin(user) && !isContentManager(user)
        ? { $or: [{ instructor: user.id }, { createdByUser: user.id }] }
        : {};

    const courses = await strapi.db.query('api::course.course').findMany({
      where: courseFilter,
      limit: 500,
    });
    const courseIds = courses.map((c: any) => c.id);
    if (courseIds.length === 0) {
      return { data: [] };
    }

    const courseIdFilter = ctx.query.courseId ? String(ctx.query.courseId) : null;
    let scopedIds = courseIds;
    if (courseIdFilter) {
      const match = courses.find(
        (c: any) =>
          String(c.documentId) === courseIdFilter || String(c.id) === courseIdFilter
      );
      if (!match) throw new ForbiddenError('Course not in your scope');
      scopedIds = [match.id];
    }

    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      where: { course: { id: { $in: scopedIds } } },
      populate: { student: true, course: true },
      orderBy: { enrolledAt: 'desc' },
      limit: 500,
    });

    const data = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const progress =
          enrollment.student && enrollment.course
            ? await getCourseProgressForStudent(
                strapi,
                enrollment.student.id,
                enrollment.course.id
              )
            : { totalLessons: 0, completedCount: 0, percentage: 0 };
        return {
          id: enrollment.id,
          documentId: enrollment.documentId,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          progress,
          student: sanitizeUser(enrollment.student),
          course: enrollment.course
            ? {
                id: enrollment.course.id,
                documentId: enrollment.course.documentId,
                title: enrollment.course.title,
                slug: enrollment.course.slug,
              }
            : null,
        };
      })
    );

    return { data };
  },

  async adminDashboard(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');

    const studentRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: ROLE_NAMES.STUDENT },
    });
    const instructorRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: ROLE_NAMES.INSTRUCTOR },
    });

    const [
      users,
      courses,
      enrollments,
      blogPosts,
      quizzes,
      certificates,
      bannedUsers,
      publishedCourses,
      draftCourses,
      completedEnrollments,
      activeStudents,
      students,
      instructors,
      activeCoupons,
      activeBanners,
    ] = await Promise.all([
      strapi.db.query('plugin::users-permissions.user').count(),
      strapi.db.query('api::course.course').count(),
      strapi.db.query('api::enrollment.enrollment').count(),
      strapi.db.query('api::blog-post.blog-post').count(),
      strapi.db.query('api::quiz.quiz').count(),
      strapi.db.query('api::certificate.certificate').count(),
      strapi.db.query('plugin::users-permissions.user').count({
        where: { $or: [{ blocked: true }, { isActive: false }] },
      }),
      strapi.db.query('api::course.course').count({ where: { status: 'PUBLISHED' } }),
      strapi.db.query('api::course.course').count({ where: { status: 'DRAFT' } }),
      strapi.db.query('api::enrollment.enrollment').count({
        where: { completedAt: { $notNull: true } },
      }),
      studentRole
        ? strapi.db.query('plugin::users-permissions.user').count({
            where: { role: studentRole.id, isActive: true, blocked: false },
          })
        : 0,
      studentRole
        ? strapi.db.query('plugin::users-permissions.user').count({
            where: { role: studentRole.id },
          })
        : 0,
      instructorRole
        ? strapi.db.query('plugin::users-permissions.user').count({
            where: { role: instructorRole.id },
          })
        : 0,
      strapi.db.query('api::coupon.coupon').count({ where: { isActive: true } }).catch(() => 0),
      strapi.db.query('api::banner.banner').count({ where: { isActive: true } }).catch(() => 0),
    ]);

    const paidRows = await strapi.db.query('api::enrollment.enrollment').findMany({
      select: ['amountPaid'],
    });
    const revenue = paidRows.reduce(
      (sum: number, row: any) => sum + Number(row.amountPaid || 0),
      0
    );

    const roles = await strapi.db.query('plugin::users-permissions.role').findMany();
    const usersByRole: Record<string, number> = {};
    for (const role of roles) {
      usersByRole[role.name] = await strapi.db.query('plugin::users-permissions.user').count({
        where: { role: role.id },
      });
    }

    const completionRate =
      enrollments > 0 ? Math.round((completedEnrollments / enrollments) * 100) : 0;

    return {
      data: {
        user: sanitizeUser(user),
        users,
        courses,
        enrollments,
        blogPosts,
        quizzes,
        certificates,
        bannedUsers,
        usersByRole,
        students,
        activeStudents,
        instructors,
        publishedCourses,
        draftCourses,
        completedEnrollments,
        completionRate,
        revenue: Number(revenue.toFixed(2)),
        activeCoupons,
        activeBanners,
      },
    };
  },

  async adminListUsers(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');

    const { search, role, isActive, page = 1, pageSize = 25 } = ctx.query;
    const where: any = {};

    if (search) {
      where.$or = [
        { email: { $containsi: search } },
        { name: { $containsi: search } },
        { username: { $containsi: search } },
      ];
    }

    if (role) {
      const roleEntity = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { name: role },
      });
      if (roleEntity) where.role = roleEntity.id;
    }

    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = String(isActive) === 'true';
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 25));

    const [results, total] = await Promise.all([
      strapi.db.query('plugin::users-permissions.user').findMany({
        where,
        populate: { role: true },
        offset: (pageNum - 1) * size,
        limit: size,
        orderBy: { id: 'asc' },
      }),
      strapi.db.query('plugin::users-permissions.user').count({ where }),
    ]);

    return {
      data: results.map((u: any) => sanitizeUser(u)),
      meta: {
        pagination: {
          page: pageNum,
          pageSize: size,
          pageCount: Math.ceil(total / size),
          total,
        },
      },
    };
  },

  async adminUpdateUserRole(ctx: Ctx) {
    const admin = await getAuthUser(ctx, strapi);
    if (!isAdmin(admin)) throw new ForbiddenError('Admin required');

    const { userId } = ctx.params;
    const { role: roleName, confirmSelfRoleChange } = ctx.request.body || {};

    if (!roleName || !Object.values(ROLE_NAMES).includes(roleName)) {
      throw new ValidationError(
        `role must be one of: ${Object.values(ROLE_NAMES).join(', ')}`
      );
    }

    const target = await resolveByIdOrDocumentId(
      strapi,
      'plugin::users-permissions.user',
      userId
    );
    if (!target) throw new NotFoundError('User not found');

    const isSelf = String(target.id) === String(admin.id);
    if (isSelf && roleName !== ROLE_NAMES.ADMIN && !confirmSelfRoleChange) {
      throw new ValidationError(
        'Changing your own admin role requires confirmSelfRoleChange: true to prevent lockout'
      );
    }

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundError(`Role ${roleName} not found`);

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: target.id },
      data: { role: role.id },
      populate: { role: true },
    });

    return { data: sanitizeUser(updated) };
  },

  async adminUpdateUserStatus(ctx: Ctx) {
    const admin = await getAuthUser(ctx, strapi);
    if (!isAdmin(admin)) throw new ForbiddenError('Admin required');

    const { userId } = ctx.params;
    const { isActive } = ctx.request.body || {};

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive boolean is required');
    }

    const target = await resolveByIdOrDocumentId(
      strapi,
      'plugin::users-permissions.user',
      userId
    );
    if (!target) throw new NotFoundError('User not found');

    if (String(target.id) === String(admin.id) && isActive === false) {
      throw new ValidationError('Cannot deactivate your own account');
    }

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: target.id },
      data: {
        isActive,
        blocked: !isActive,
      },
      populate: { role: true },
    });

    return { data: sanitizeUser(updated) };
  },

  async adminCreateUser(ctx: Ctx) {
    const admin = await getAuthUser(ctx, strapi);
    if (!isAdmin(admin)) throw new ForbiddenError('Admin required');

    const body = ctx.request.body || {};
    const { name, email, username, password, role: roleName } = body;

    if (!name || !email || !password) {
      throw new ValidationError('name, email, and password are required');
    }
    if (!roleName || !Object.values(ROLE_NAMES).includes(roleName)) {
      throw new ValidationError(
        `role must be one of: ${Object.values(ROLE_NAMES).join(', ')}`
      );
    }
    if (String(password).length < 8) {
      throw new ValidationError('password must be at least 8 characters');
    }

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundError(`Role ${roleName} not found`);

    const existingEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (existingEmail) throw new ValidationError('Email already in use');

    const uname =
      (username && String(username).trim()) ||
      String(email)
        .split('@')[0]
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .slice(0, 24) ||
      `user${Date.now()}`;

    const existingUsername = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { username: uname } });
    const finalUsername = existingUsername ? `${uname}${Date.now().toString().slice(-4)}` : uname;

    const created = await strapi.plugin('users-permissions').service('user').add({
      username: finalUsername,
      email: String(email).toLowerCase().trim(),
      password: String(password),
      name: String(name).trim(),
      confirmed: true,
      blocked: false,
      isActive: true,
      provider: 'local',
      role: role.id,
    });

    const withRole = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: created.id },
      populate: { role: true },
    });

    return { data: sanitizeUser(withRole) };
  },

  async adminDeleteUser(ctx: Ctx) {
    const admin = await getAuthUser(ctx, strapi);
    if (!isAdmin(admin)) throw new ForbiddenError('Admin required');

    const { userId } = ctx.params;
    const target = await resolveByIdOrDocumentId(
      strapi,
      'plugin::users-permissions.user',
      userId
    );
    if (!target) throw new NotFoundError('User not found');

    if (String(target.id) === String(admin.id)) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Clean related LMS data before removing the user
    const attempts = await strapi.db.query('api::quiz-attempt.quiz-attempt').findMany({
      where: { student: target.id },
      select: ['id'],
    });
    for (const attempt of attempts) {
      await strapi.db.query('api::quiz-answer.quiz-answer').deleteMany({
        where: { attempt: attempt.id },
      });
    }
    await strapi.db.query('api::quiz-attempt.quiz-attempt').deleteMany({
      where: { student: target.id },
    });
    await strapi.db.query('api::lesson-progress.lesson-progress').deleteMany({
      where: { student: target.id },
    });
    await strapi.db.query('api::certificate.certificate').deleteMany({
      where: { student: target.id },
    });
    await strapi.db.query('api::enrollment.enrollment').deleteMany({
      where: { student: target.id },
    });

    await strapi.db.query('plugin::users-permissions.user').delete({
      where: { id: target.id },
    });

    return { data: { id: target.id, deleted: true } };
  },

  async myCertificates(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const certs = await strapi.db.query('api::certificate.certificate').findMany({
      where: { student: user.id },
      populate: { course: true, student: true },
      orderBy: { issuedAt: 'desc' },
    });
    return { data: certs.map(sanitizeCertificate) };
  },

  async getCertificate(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const { id } = ctx.params;
    const cert = await resolveByIdOrDocumentId(strapi, 'api::certificate.certificate', id);
    if (!cert) throw new NotFoundError('Certificate not found');

    const full = await strapi.db.query('api::certificate.certificate').findOne({
      where: { id: cert.id },
      populate: { course: true, student: true },
    });
    if (!full) throw new NotFoundError('Certificate not found');

    const isOwner = String(full.student?.id) === String(user.id);
    if (!isOwner && !isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Not allowed to view this certificate');
    }

    return { data: sanitizeCertificate(full) };
  },

  async adminListCertificates(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');

    const { page = 1, pageSize = 25, search } = ctx.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const where: any = {};
    if (search) {
      where.$or = [
        { code: { $containsi: search } },
        { studentName: { $containsi: search } },
        { courseTitle: { $containsi: search } },
      ];
    }

    const [results, total] = await Promise.all([
      strapi.db.query('api::certificate.certificate').findMany({
        where,
        populate: { student: true, course: true },
        offset: (pageNum - 1) * size,
        limit: size,
        orderBy: { issuedAt: 'desc' },
      }),
      strapi.db.query('api::certificate.certificate').count({ where }),
    ]);

    return {
      data: results.map(sanitizeCertificate),
      meta: {
        pagination: {
          page: pageNum,
          pageSize: size,
          pageCount: Math.ceil(total / size),
          total,
        },
      },
    };
  },

  async adminListEnrollments(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');

    const { page = 1, pageSize = 25, search } = ctx.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 25));

    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      populate: {
        student: true,
        course: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    let filtered = enrollments;
    if (search) {
      const q = String(search).toLowerCase();
      filtered = enrollments.filter((e: any) => {
        const email = e.student?.email?.toLowerCase() || '';
        const name = e.student?.name?.toLowerCase() || '';
        const title = e.course?.title?.toLowerCase() || '';
        return email.includes(q) || name.includes(q) || title.includes(q);
      });
    }

    const total = filtered.length;
    const slice = filtered.slice((pageNum - 1) * size, pageNum * size);

    const data = await Promise.all(
      slice.map(async (enrollment: any) => {
        const progress =
          enrollment.student && enrollment.course
            ? await getCourseProgressForStudent(
                strapi,
                enrollment.student.id,
                enrollment.course.id
              )
            : { totalLessons: 0, completedCount: 0, percentage: 0 };
        return {
          id: enrollment.id,
          documentId: enrollment.documentId,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          progress,
          student: sanitizeUser(enrollment.student),
          course: enrollment.course
            ? {
                id: enrollment.course.id,
                documentId: enrollment.course.documentId,
                title: enrollment.course.title,
                slug: enrollment.course.slug,
              }
            : null,
        };
      })
    );

    return {
      data,
      meta: {
        pagination: {
          page: pageNum,
          pageSize: size,
          pageCount: Math.ceil(total / size),
          total,
        },
      },
    };
  },

  async listBanners(ctx: Ctx) {
    const placement = String(ctx.query?.placement || '').toUpperCase();
    const where: any = { isActive: true };
    if (placement === 'HOME' || placement === 'CATALOG') {
      where.$or = [{ placement }, { placement: 'BOTH' }];
    }

    const banners = await strapi.db.query('api::banner.banner').findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { data: banners.map(sanitizeBanner) };
  },

  async adminListBanners(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const banners = await strapi.db.query('api::banner.banner').findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { data: banners.map(sanitizeBanner) };
  },

  async adminCreateBanner(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const body = ctx.request.body || {};
    if (!body.title) throw new ValidationError('title is required');
    const created = await strapi.db.query('api::banner.banner').create({
      data: {
        title: String(body.title).trim(),
        subtitle: body.subtitle || null,
        ctaLabel: body.ctaLabel || null,
        linkUrl: body.linkUrl || null,
        imageUrl: body.imageUrl || null,
        placement: body.placement || 'BOTH',
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder || 0),
      },
    });
    return { data: sanitizeBanner(created) };
  },

  async adminUpdateBanner(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::banner.banner',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Banner not found');
    const body = ctx.request.body || {};
    const data: any = {};
    for (const key of [
      'title',
      'subtitle',
      'ctaLabel',
      'linkUrl',
      'imageUrl',
      'placement',
      'isActive',
      'sortOrder',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const updated = await strapi.db.query('api::banner.banner').update({
      where: { id: target.id },
      data,
    });
    return { data: sanitizeBanner(updated) };
  },

  async adminDeleteBanner(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::banner.banner',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Banner not found');
    await strapi.db.query('api::banner.banner').delete({ where: { id: target.id } });
    return { data: { id: target.id, deleted: true } };
  },

  async adminListCoupons(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');
    const coupons = await strapi.db.query('api::coupon.coupon').findMany({
      orderBy: { id: 'desc' },
    });
    return { data: coupons.map(sanitizeCoupon) };
  },

  async adminCreateCoupon(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');
    const body = ctx.request.body || {};
    if (!body.code) throw new ValidationError('code is required');
    if (body.discountValue === undefined || body.discountValue === null) {
      throw new ValidationError('discountValue is required');
    }
    const code = String(body.code).trim().toUpperCase();
    const existing = await strapi.db.query('api::coupon.coupon').findOne({ where: { code } });
    if (existing) throw new ValidationError('Coupon code already exists');

    const created = await strapi.db.query('api::coupon.coupon').create({
      data: {
        code,
        description: body.description || null,
        discountType: body.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
        discountValue: Number(body.discountValue),
        isActive: body.isActive !== false,
        maxUses: body.maxUses != null ? Number(body.maxUses) : null,
        usedCount: 0,
        expiresAt: body.expiresAt || null,
        minAmount: Number(body.minAmount || 0),
      },
    });
    return { data: sanitizeCoupon(created) };
  },

  async adminUpdateCoupon(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::coupon.coupon',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Coupon not found');
    const body = ctx.request.body || {};
    const data: any = {};
    if (body.code !== undefined) data.code = String(body.code).trim().toUpperCase();
    for (const key of [
      'description',
      'discountType',
      'discountValue',
      'isActive',
      'maxUses',
      'expiresAt',
      'minAmount',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const updated = await strapi.db.query('api::coupon.coupon').update({
      where: { id: target.id },
      data,
    });
    return { data: sanitizeCoupon(updated) };
  },

  async adminDeleteCoupon(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user)) throw new ForbiddenError('Admin required');
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::coupon.coupon',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Coupon not found');
    await strapi.db.query('api::coupon.coupon').delete({ where: { id: target.id } });
    return { data: { id: target.id, deleted: true } };
  },

  async validateCoupon(ctx: Ctx) {
    await getAuthUser(ctx, strapi);
    const body = ctx.request.body || {};
    const courseId = body.courseId;
    const couponCode = body.couponCode || body.code;
    if (!courseId) throw new ValidationError('courseId is required');
    const course = await findCourse(strapi, String(courseId));
    if (!course) throw new NotFoundError('Course not found');
    const originalPrice = coursePrice(course);
    const priced = await applyCouponToPrice(strapi, originalPrice, couponCode);
    return {
      data: {
        originalPrice,
        discount: priced.discount,
        amountDue: priced.amountDue,
        currency: course.currency || 'USD',
        coupon: sanitizeCoupon(priced.coupon),
        isFree: courseIsFree(course),
      },
    };
  },

  async createCourse(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const body = ctx.request.body?.data || ctx.request.body || {};
    const {
      title,
      description,
      shortDescription,
      thumbnailUrl,
      coverImageUrl,
      status,
      instructorId,
      isFree,
      price,
      currency,
      discountPrice,
      difficulty,
      language,
      requirements,
      outcomes,
      publishedAt,
      categoryId,
    } = body;

    if (!title) throw new ValidationError('title is required');

    const slug = await ensureUniqueSlug(strapi, 'api::course.course', title);

    let instructorUserId = user.id;
    if (instructorId && (isAdmin(user) || isContentManager(user))) {
      const instructor = await resolveByIdOrDocumentId(
        strapi,
        'plugin::users-permissions.user',
        String(instructorId)
      );
      if (!instructor) throw new NotFoundError('Instructor not found');
      instructorUserId = instructor.id;
    } else if (isInstructor(user)) {
      instructorUserId = user.id;
    }

    const free =
      typeof isFree === 'boolean' ? isFree : !(Number(price || 0) > 0);

    let category = null;
    if (categoryId) {
      category = await resolveByIdOrDocumentId(
        strapi,
        'api::course-category.course-category',
        String(categoryId)
      );
    }

    const course = await strapi.db.query('api::course.course').create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        thumbnailUrl,
        coverImageUrl: coverImageUrl || thumbnailUrl || null,
        status: status || 'DRAFT',
        isFree: free,
        price: free ? 0 : Math.max(0, Number(price || 0)),
        currency: currency || 'USD',
        discountPrice: discountPrice != null ? Number(discountPrice) : null,
        difficulty: difficulty || 'BEGINNER',
        language: language || 'English',
        requirements: requirements || null,
        outcomes: outcomes || null,
        publishedAt: publishedAt || (status === 'PUBLISHED' ? new Date().toISOString() : null),
        category: category?.id || null,
        instructor: instructorUserId,
        createdByUser: user.id,
      },
      populate: { instructor: true, createdByUser: true, category: true },
    });

    return { data: course };
  },

  async updateCourse(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const course = await findCourse(strapi, ctx.params.id, {
      instructor: true,
      createdByUser: true,
    });
    if (!course) throw new NotFoundError('Course not found');
    assertCourseOwnerOrManager(user, course);

    const body = ctx.request.body?.data || ctx.request.body || {};
    const data: any = {};

    for (const key of [
      'title',
      'description',
      'shortDescription',
      'thumbnailUrl',
      'coverImageUrl',
      'status',
      'currency',
      'difficulty',
      'language',
      'requirements',
      'outcomes',
      'publishedAt',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (body.discountPrice !== undefined) {
      data.discountPrice = body.discountPrice == null ? null : Number(body.discountPrice);
    }

    if (body.categoryId !== undefined) {
      if (!body.categoryId) {
        data.category = null;
      } else {
        const category = await resolveByIdOrDocumentId(
          strapi,
          'api::course-category.course-category',
          String(body.categoryId)
        );
        if (!category) throw new NotFoundError('Category not found');
        data.category = category.id;
      }
    }

    if (body.isFree !== undefined || body.price !== undefined) {
      const free =
        typeof body.isFree === 'boolean'
          ? body.isFree
          : !(Number(body.price ?? course.price ?? 0) > 0);
      data.isFree = free;
      data.price = free ? 0 : Math.max(0, Number(body.price ?? course.price ?? 0));
    }

    if (body.title) {
      data.slug = await ensureUniqueSlug(
        strapi,
        'api::course.course',
        body.title,
        course.id
      );
    }

    if (body.instructorId && (isAdmin(user) || isContentManager(user))) {
      const instructor = await resolveByIdOrDocumentId(
        strapi,
        'plugin::users-permissions.user',
        String(body.instructorId)
      );
      if (!instructor) throw new NotFoundError('Instructor not found');
      data.instructor = instructor.id;
    }

    const updated = await strapi.db.query('api::course.course').update({
      where: { id: course.id },
      data,
      populate: {
        instructor: true,
        createdByUser: true,
        lessons: true,
        category: true,
        modules: true,
      },
    });

    return { data: updated };
  },

  async deleteCourse(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const course = await findCourse(strapi, ctx.params.id, {
      instructor: true,
      createdByUser: true,
    });
    if (!course) throw new NotFoundError('Course not found');
    assertCourseOwnerOrManager(user, course);

    await strapi.db.query('api::course.course').delete({ where: { id: course.id } });
    return { data: { id: course.id, documentId: course.documentId } };
  },

  async createLesson(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const course = await findCourse(strapi, ctx.params.courseId, {
      instructor: true,
      createdByUser: true,
    });
    if (!course) throw new NotFoundError('Course not found');
    assertCourseOwnerOrManager(user, course);

    const body = ctx.request.body?.data || ctx.request.body || {};
    if (!body.title) throw new ValidationError('title is required');

    const slug = await ensureUniqueSlug(strapi, 'api::lesson.lesson', body.title);

    let moduleId = null;
    if (body.moduleId) {
      const fullMod = await resolveByIdOrDocumentId(
        strapi,
        'api::course-module.course-module',
        String(body.moduleId)
      );
      if (!fullMod) throw new NotFoundError('Module not found');
      const withCourse = await strapi.db.query('api::course-module.course-module').findOne({
        where: { id: fullMod.id },
        populate: { course: true },
      });
      if (Number(withCourse?.course?.id) !== Number(course.id)) {
        throw new ValidationError('Module does not belong to this course');
      }
      moduleId = fullMod.id;
    }

    const lesson = await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        videoUrl: body.videoUrl,
        documentUrl: body.documentUrl || null,
        externalUrl: body.externalUrl || null,
        lessonType: body.lessonType || 'TEXT',
        order: body.order ?? 0,
        isPreview: Boolean(body.isPreview),
        durationMinutes: Number(body.durationMinutes || 0),
        course: course.id,
        module: moduleId,
      },
      populate: { course: true, module: true },
    });

    return { data: lesson };
  },

  async updateLesson(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const lesson = await findLesson(strapi, ctx.params.id, {
      course: { populate: { instructor: true, createdByUser: true } },
    });
    if (!lesson) throw new NotFoundError('Lesson not found');
    assertCourseOwnerOrManager(user, lesson.course);

    const body = ctx.request.body?.data || ctx.request.body || {};
    const data: any = {};
    for (const key of [
      'title',
      'content',
      'videoUrl',
      'documentUrl',
      'externalUrl',
      'lessonType',
      'order',
      'isPreview',
      'durationMinutes',
    ]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (body.title) {
      data.slug = await ensureUniqueSlug(strapi, 'api::lesson.lesson', body.title, lesson.id);
    }
    if (body.moduleId !== undefined) {
      if (!body.moduleId) {
        data.module = null;
      } else {
        const fullMod = await resolveByIdOrDocumentId(
          strapi,
          'api::course-module.course-module',
          String(body.moduleId)
        );
        if (!fullMod) throw new NotFoundError('Module not found');
        data.module = fullMod.id;
      }
    }

    const updated = await strapi.db.query('api::lesson.lesson').update({
      where: { id: lesson.id },
      data,
      populate: { course: true, module: true },
    });

    return { data: updated };
  },

  async deleteLesson(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const lesson = await findLesson(strapi, ctx.params.id, {
      course: { populate: { instructor: true, createdByUser: true } },
    });
    if (!lesson) throw new NotFoundError('Lesson not found');
    assertCourseOwnerOrManager(user, lesson.course);

    await strapi.db.query('api::lesson.lesson').delete({ where: { id: lesson.id } });
    return { data: { id: lesson.id, documentId: lesson.documentId } };
  },

  async listCategories(_ctx: Ctx) {
    const categories = await strapi.db.query('api::course-category.course-category').findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { data: categories.map(sanitizeCategory) };
  },

  async adminListCategories(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const categories = await strapi.db.query('api::course-category.course-category').findMany({
      orderBy: { name: 'asc' },
    });
    const withCounts = await Promise.all(
      categories.map(async (cat: any) => ({
        ...sanitizeCategory(cat),
        courseCount: await strapi.db.query('api::course.course').count({
          where: { category: cat.id },
        }),
      }))
    );
    return { data: withCounts };
  },

  async adminCreateCategory(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const body = ctx.request.body || {};
    if (!body.name) throw new ValidationError('name is required');
    const slug = await ensureUniqueSlug(
      strapi,
      'api::course-category.course-category',
      body.name
    );
    const created = await strapi.db.query('api::course-category.course-category').create({
      data: {
        name: String(body.name).trim(),
        slug,
        description: body.description || null,
        isActive: body.isActive !== false,
      },
    });
    return { data: sanitizeCategory(created) };
  },

  async adminUpdateCategory(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::course-category.course-category',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Category not found');
    const body = ctx.request.body || {};
    const data: any = {};
    if (body.name !== undefined) {
      data.name = body.name;
      data.slug = await ensureUniqueSlug(
        strapi,
        'api::course-category.course-category',
        body.name,
        target.id
      );
    }
    if (body.description !== undefined) data.description = body.description;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    const updated = await strapi.db.query('api::course-category.course-category').update({
      where: { id: target.id },
      data,
    });
    return { data: sanitizeCategory(updated) };
  },

  async adminDeleteCategory(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!isAdmin(user) && !isContentManager(user)) {
      throw new ForbiddenError('Content Manager or Admin required');
    }
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::course-category.course-category',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Category not found');
    await strapi.db.query('api::course.course').updateMany({
      where: { category: target.id },
      data: { category: null },
    });
    await strapi.db.query('api::course-category.course-category').delete({
      where: { id: target.id },
    });
    return { data: { id: target.id, deleted: true } };
  },

  async listCourseModules(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const course = await findCourse(strapi, ctx.params.courseId, {
      instructor: true,
      createdByUser: true,
    });
    if (!course) throw new NotFoundError('Course not found');
    assertCourseOwnerOrManager(user, course);
    const modules = await strapi.db.query('api::course-module.course-module').findMany({
      where: { course: course.id },
      orderBy: { order: 'asc' },
    });
    return { data: modules.map(sanitizeModule) };
  },

  async createCourseModule(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);
    const course = await findCourse(strapi, ctx.params.courseId, {
      instructor: true,
      createdByUser: true,
    });
    if (!course) throw new NotFoundError('Course not found');
    assertCourseOwnerOrManager(user, course);
    const body = ctx.request.body || {};
    if (!body.title) throw new ValidationError('title is required');
    const created = await strapi.db.query('api::course-module.course-module').create({
      data: {
        title: String(body.title).trim(),
        description: body.description || null,
        order: Number(body.order || 0),
        course: course.id,
      },
    });
    return { data: sanitizeModule(created) };
  },

  async updateCourseModule(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::course-module.course-module',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Module not found');
    const withCourse = await strapi.db.query('api::course-module.course-module').findOne({
      where: { id: target.id },
      populate: { course: { populate: { instructor: true, createdByUser: true } } },
    });
    assertCourseOwnerOrManager(user, withCourse.course);
    const body = ctx.request.body || {};
    const data: any = {};
    for (const key of ['title', 'description', 'order']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const updated = await strapi.db.query('api::course-module.course-module').update({
      where: { id: target.id },
      data,
    });
    return { data: sanitizeModule(updated) };
  },

  async deleteCourseModule(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);
    const target = await resolveByIdOrDocumentId(
      strapi,
      'api::course-module.course-module',
      ctx.params.id
    );
    if (!target) throw new NotFoundError('Module not found');
    const withCourse = await strapi.db.query('api::course-module.course-module').findOne({
      where: { id: target.id },
      populate: { course: { populate: { instructor: true, createdByUser: true } } },
    });
    assertCourseOwnerOrManager(user, withCourse.course);
    await strapi.db.query('api::lesson.lesson').updateMany({
      where: { module: target.id },
      data: { module: null },
    });
    await strapi.db.query('api::course-module.course-module').delete({
      where: { id: target.id },
    });
    return { data: { id: target.id, deleted: true } };
  },

  async createQuiz(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const course = await findCourse(strapi, ctx.params.courseId, {
      instructor: true,
      createdByUser: true,
    });
    if (!course) throw new NotFoundError('Course not found');
    assertCourseOwnerOrManager(user, course);

    const body = ctx.request.body?.data || ctx.request.body || {};
    if (!body.title) throw new ValidationError('title is required');

    const quiz = await strapi.db.query('api::quiz.quiz').create({
      data: {
        title: body.title,
        description: body.description,
        course: course.id,
        createdByUser: user.id,
      },
    });

    const questionsInput = Array.isArray(body.questions) ? body.questions : [];
    for (let qi = 0; qi < questionsInput.length; qi++) {
      const q = questionsInput[qi];
      const question = await strapi.db.query('api::quiz-question.quiz-question').create({
        data: {
          question: q.question || q.text,
          order: q.order ?? qi,
          quiz: quiz.id,
        },
      });

      const options = Array.isArray(q.options) ? q.options : [];
      for (const opt of options) {
        await strapi.db.query('api::quiz-option.quiz-option').create({
          data: {
            text: opt.text,
            isCorrect: Boolean(opt.isCorrect),
            question: question.id,
          },
        });
      }
    }

    const full = await findQuiz(strapi, String(quiz.id), {
      course: true,
      questions: { populate: { options: true } },
    });

    return { data: full };
  },

  async updateQuiz(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const quiz = await findQuiz(strapi, ctx.params.id, {
      course: { populate: { instructor: true, createdByUser: true } },
    });
    if (!quiz) throw new NotFoundError('Quiz not found');
    assertCourseOwnerOrManager(user, quiz.course);

    const body = ctx.request.body?.data || ctx.request.body || {};
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;

    await strapi.db.query('api::quiz.quiz').update({
      where: { id: quiz.id },
      data,
    });

    // Optional full replace of questions when provided
    if (Array.isArray(body.questions)) {
      const existingQuestions = await strapi.db
        .query('api::quiz-question.quiz-question')
        .findMany({
          where: { quiz: quiz.id },
          populate: { options: true },
        });

      for (const eq of existingQuestions) {
        for (const opt of eq.options || []) {
          await strapi.db.query('api::quiz-option.quiz-option').delete({
            where: { id: opt.id },
          });
        }
        await strapi.db.query('api::quiz-question.quiz-question').delete({
          where: { id: eq.id },
        });
      }

      for (let qi = 0; qi < body.questions.length; qi++) {
        const q = body.questions[qi];
        const question = await strapi.db.query('api::quiz-question.quiz-question').create({
          data: {
            question: q.question || q.text,
            order: q.order ?? qi,
            quiz: quiz.id,
          },
        });
        for (const opt of q.options || []) {
          await strapi.db.query('api::quiz-option.quiz-option').create({
            data: {
              text: opt.text,
              isCorrect: Boolean(opt.isCorrect),
              question: question.id,
            },
          });
        }
      }
    }

    const full = await findQuiz(strapi, String(quiz.id), {
      course: true,
      questions: { populate: { options: true } },
    });

    return { data: full };
  },

  async deleteQuiz(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    assertNotStudent(user);

    const quiz = await findQuiz(strapi, ctx.params.id, {
      course: { populate: { instructor: true, createdByUser: true } },
      questions: { populate: { options: true } },
    });
    if (!quiz) throw new NotFoundError('Quiz not found');
    assertCourseOwnerOrManager(user, quiz.course);

    for (const q of quiz.questions || []) {
      for (const opt of q.options || []) {
        await strapi.db.query('api::quiz-option.quiz-option').delete({
          where: { id: opt.id },
        });
      }
      await strapi.db.query('api::quiz-question.quiz-question').delete({
        where: { id: q.id },
      });
    }

    await strapi.db.query('api::quiz.quiz').delete({ where: { id: quiz.id } });
    return { data: { id: quiz.id, documentId: quiz.documentId } };
  },

  async getCoursePlayer(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    const course = await findCourse(strapi, ctx.params.courseId, {
      instructor: true,
      createdByUser: true,
      category: true,
      lessons: true,
      quizzes: true,
      modules: true,
    });
    if (!course) throw new NotFoundError('Course not found');

    const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { student: user.id, course: course.id },
    });

    const canManage = canManageCourse(user, course);
    // Students need enrollment; staff managers can open for authoring.
    if (!enrollment && !canManage) {
      throw new ForbiddenError('You must be enrolled to access this course player');
    }

    const fullAccess = Boolean(enrollment) || canManage;

    const lessons = await strapi.db.query('api::lesson.lesson').findMany({
      where: { course: course.id },
      populate: { module: true },
      orderBy: { order: 'asc' },
    });

    const modules = await strapi.db.query('api::course-module.course-module').findMany({
      where: { course: course.id },
      orderBy: { order: 'asc' },
    });

    const quizzes = await strapi.db.query('api::quiz.quiz').findMany({
      where: { course: course.id },
      populate: canManage
        ? { questions: { populate: { options: true } } }
        : undefined,
    });

    return {
      data: {
        id: course.id,
        documentId: course.documentId,
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        coverImageUrl: course.coverImageUrl,
        status: course.status,
        ...pricingFields(course),
        ...courseBuilderFields(course),
        instructor: sanitizeUser(course.instructor),
        modules: modules.map(sanitizeModule),
        lessons: lessons.map((lesson: any) =>
          lessonPublicFields(lesson, fullAccess || Boolean(lesson.isPreview))
        ),
        quizzes: quizzes.map((q: any) => {
          if (!canManage) {
            return {
              id: q.id,
              documentId: q.documentId,
              title: q.title,
              description: q.description,
            };
          }
          const questions = [...(q.questions || [])].sort(
            (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
          );
          return {
            id: q.id,
            documentId: q.documentId,
            title: q.title,
            description: q.description,
            questions: questions.map((qq: any) => ({
              id: qq.id,
              documentId: qq.documentId,
              question: qq.question,
              order: qq.order,
              options: (qq.options || []).map((o: any) => ({
                id: o.id,
                documentId: o.documentId,
                text: o.text,
                isCorrect: Boolean(o.isCorrect),
              })),
            })),
          };
        }),
        enrolled: Boolean(enrollment),
      },
    };
  },

  async listCatalog(ctx: Ctx) {
    const search = String(ctx.query?.search || '').trim();
    const categorySlug = String(ctx.query?.category || '').trim();
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (search) {
      where.$or = [
        { title: { $containsi: search } },
        { shortDescription: { $containsi: search } },
        { description: { $containsi: search } },
      ];
    }
    if (categorySlug) {
      const cat = await strapi.db.query('api::course-category.course-category').findOne({
        where: { slug: categorySlug },
      });
      if (cat) where.category = cat.id;
    }

    const courses = await strapi.db.query('api::course.course').findMany({
      where,
      populate: {
        instructor: true,
        lessons: true,
        quizzes: true,
        category: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const now = Date.now();
    const visible = courses.filter((course: any) => {
      if (!course.publishedAt) return true;
      return new Date(course.publishedAt).getTime() <= now;
    });

    return {
      data: visible.map((course: any) => ({
        id: course.id,
        documentId: course.documentId,
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        status: course.status,
        ...pricingFields(course),
        ...courseBuilderFields(course),
        instructor: sanitizeUser(course.instructor),
        lessonCount: course.lessons?.length ?? 0,
        quizCount: course.quizzes?.length ?? 0,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })),
    };
  },

  async getCatalogCourse(ctx: Ctx) {
    const slug = ctx.params.slug;
    const course = await strapi.db.query('api::course.course').findOne({
      where: { slug, status: 'PUBLISHED' },
      populate: {
        instructor: true,
        lessons: { populate: { module: true }, orderBy: { order: 'asc' } },
        quizzes: true,
        category: true,
        modules: true,
      },
    });

    if (!course) throw new NotFoundError('Course not found');

    const modules = await strapi.db.query('api::course-module.course-module').findMany({
      where: { course: course.id },
      orderBy: { order: 'asc' },
    });

    return {
      data: {
        id: course.id,
        documentId: course.documentId,
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        status: course.status,
        ...pricingFields(course),
        ...courseBuilderFields(course),
        instructor: sanitizeUser(course.instructor),
        modules: modules.map(sanitizeModule),
        lessons: (course.lessons || []).map((lesson: any) =>
          lessonPublicFields(lesson, Boolean(lesson.isPreview))
        ),
        quizzes: (course.quizzes || []).map((quiz: any) => ({
          id: quiz.id,
          documentId: quiz.documentId,
          title: quiz.title,
          description: quiz.description,
        })),
        lessonCount: course.lessons?.length ?? 0,
        quizCount: course.quizzes?.length ?? 0,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
    };
  },

  async listBlog(_ctx: Ctx) {
    const posts = await strapi.db.query('api::blog-post.blog-post').findMany({
      where: { status: 'PUBLISHED' },
      populate: { author: true },
      orderBy: { publishedAt: 'desc' },
    });

    return {
      data: posts.map((p: any) => ({
        ...p,
        author: sanitizeUser(p.author),
      })),
    };
  },

  async getBlogBySlug(ctx: Ctx) {
    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: {
        slug: ctx.params.slug,
        status: 'PUBLISHED',
      },
      populate: { author: true },
    });

    if (!post) throw new NotFoundError('Blog post not found');

    return {
      data: {
        ...post,
        author: sanitizeUser(post.author),
      },
    };
  },

  async manageBlog(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!canManageBlog(user)) {
      throw new ForbiddenError('Not allowed to manage blog');
    }

    // CM and Admin can manage all posts
    const posts = await strapi.db.query('api::blog-post.blog-post').findMany({
      populate: { author: true },
      orderBy: { id: 'desc' },
    });

    return {
      data: posts.map((p: any) => ({
        ...p,
        author: sanitizeUser(p.author),
      })),
    };
  },

  async createBlog(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!canManageBlog(user)) {
      throw new ForbiddenError('Not allowed to create blog posts');
    }

    const body = ctx.request.body?.data || ctx.request.body || {};
    if (!body.title) throw new ValidationError('title is required');

    const slug = await ensureUniqueSlug(strapi, 'api::blog-post.blog-post', body.title);
    const status = body.status || 'DRAFT';

    const post = await strapi.db.query('api::blog-post.blog-post').create({
      data: {
        title: body.title,
        slug,
        body: body.body,
        excerpt: body.excerpt,
        coverImageUrl: body.coverImageUrl,
        status,
        author: user.id,
        publishedAt:
          status === 'PUBLISHED'
            ? body.publishedAt || new Date().toISOString()
            : body.publishedAt || null,
      },
      populate: { author: true },
    });

    return { data: { ...post, author: sanitizeUser(post.author) } };
  },

  async updateBlog(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!canManageBlog(user)) {
      throw new ForbiddenError('Not allowed to update blog posts');
    }

    const post = await resolveByIdOrDocumentId(
      strapi,
      'api::blog-post.blog-post',
      ctx.params.id
    );
    if (!post) throw new NotFoundError('Blog post not found');

    const body = ctx.request.body?.data || ctx.request.body || {};
    const data: any = {};
    for (const key of ['title', 'body', 'excerpt', 'coverImageUrl', 'status', 'publishedAt']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (body.title) {
      data.slug = await ensureUniqueSlug(
        strapi,
        'api::blog-post.blog-post',
        body.title,
        post.id
      );
    }
    if (data.status === 'PUBLISHED' && !data.publishedAt && !post.publishedAt) {
      data.publishedAt = new Date().toISOString();
    }

    const updated = await strapi.db.query('api::blog-post.blog-post').update({
      where: { id: post.id },
      data,
      populate: { author: true },
    });

    return { data: { ...updated, author: sanitizeUser(updated.author) } };
  },

  async deleteBlog(ctx: Ctx) {
    const user = await getAuthUser(ctx, strapi);
    if (!canManageBlog(user)) {
      throw new ForbiddenError('Not allowed to delete blog posts');
    }

    const post = await resolveByIdOrDocumentId(
      strapi,
      'api::blog-post.blog-post',
      ctx.params.id
    );
    if (!post) throw new NotFoundError('Blog post not found');

    await strapi.db.query('api::blog-post.blog-post').delete({ where: { id: post.id } });
    return { data: { id: post.id, documentId: post.documentId } };
  },

  ...createOpsHandlers(strapi),
});
