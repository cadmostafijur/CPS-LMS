import { errors } from '@strapi/utils';
import type { Core } from '@strapi/strapi';
import { getAuthUser } from '../../../utils/auth';
import {
  assertCourseOwnerOrManager,
  canManageCourse,
} from '../../../utils/ownership';
import {
  isAdmin,
  isContentManager,
  isInstructor,
  isStudent,
} from '../../../utils/roles';
import { sanitizeUser } from '../../../utils/sanitize';
import { notifyUser } from '../../../utils/notify-user';

const { ForbiddenError, NotFoundError, ValidationError, ApplicationError } = errors;

type Ctx = any;

async function resolve(strapi: Core.Strapi, uid: string, id: string) {
  const byDoc = await strapi.db.query(uid).findOne({ where: { documentId: id } });
  if (byDoc) return byDoc;
  if (/^\d+$/.test(String(id))) {
    return strapi.db.query(uid).findOne({ where: { id: Number(id) } });
  }
  return null;
}

async function findCourse(strapi: Core.Strapi, courseId: string, populate: any = true) {
  const byDoc = await strapi.db.query('api::course.course').findOne({
    where: { documentId: courseId },
    populate,
  });
  if (byDoc) return byDoc;
  if (/^\d+$/.test(String(courseId))) {
    return strapi.db.query('api::course.course').findOne({
      where: { id: Number(courseId) },
      populate,
    });
  }
  return null;
}

function assertStudent(user: any) {
  if (!isStudent(user)) throw new ForbiddenError('Student role required');
}

async function requireEnrollment(strapi: Core.Strapi, userId: any, courseId: any) {
  const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
    where: { student: userId, course: courseId },
  });
  if (!enrollment) throw new ForbiddenError('You must be enrolled');
  return enrollment;
}

function ticketCode() {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, '0')}`;
}

export function createExtrasHandlers(strapi: Core.Strapi) {
  return {
    // —— Reviews ——
    async listCourseReviews(ctx: Ctx) {
      const course = await findCourse(strapi, ctx.params.courseId);
      if (!course) throw new NotFoundError('Course not found');
      const rows = await strapi.db.query('api::review.review').findMany({
        where: { course: course.id, status: 'APPROVED' },
        populate: { student: true },
        orderBy: { id: 'desc' },
        limit: 50,
      });
      return {
        data: rows.map((r: any) => ({
          id: r.id,
          documentId: r.documentId,
          rating: r.rating,
          body: r.body,
          createdAt: r.createdAt,
          student: sanitizeUser(r.student),
        })),
      };
    },

    async submitCourseReview(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const course = await findCourse(strapi, ctx.params.courseId);
      if (!course) throw new NotFoundError('Course not found');
      await requireEnrollment(strapi, user.id, course.id);

      const rating = Number(ctx.request.body?.rating);
      const body = String(ctx.request.body?.body || '').trim();
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        throw new ValidationError('rating must be 1–5');
      }

      const existing = await strapi.db.query('api::review.review').findOne({
        where: { student: user.id, course: course.id },
      });
      let row;
      if (existing) {
        row = await strapi.db.query('api::review.review').update({
          where: { id: existing.id },
          data: { rating, body, status: 'APPROVED' },
          populate: { student: true },
        });
      } else {
        row = await strapi.db.query('api::review.review').create({
          data: {
            rating,
            body,
            status: 'APPROVED',
            student: user.id,
            course: course.id,
          },
          populate: { student: true },
        });
      }
      return {
        data: {
          id: row.id,
          documentId: row.documentId,
          rating: row.rating,
          body: row.body,
          status: row.status,
          student: sanitizeUser(row.student || user),
        },
      };
    },

    // —— Course announcements (instructor → enrolled) ——
    async listCourseAnnouncements(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      const canManage = canManageCourse(user, course);
      if (!canManage) {
        assertStudent(user);
        await requireEnrollment(strapi, user.id, course.id);
      }
      const rows = await strapi.db.query('api::announcement.announcement').findMany({
        where: { course: course.id, isActive: true },
        orderBy: { id: 'desc' },
        limit: 30,
      });
      return { data: rows };
    },

    async createCourseAnnouncement(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      assertCourseOwnerOrManager(user, course);

      const title = String(ctx.request.body?.title || '').trim();
      const content = String(ctx.request.body?.content || '').trim();
      if (!title || !content) throw new ValidationError('title and content required');

      const row = await strapi.db.query('api::announcement.announcement').create({
        data: {
          title,
          content,
          audience: 'STUDENTS',
          isActive: true,
          course: course.id,
          publishAt: new Date().toISOString(),
        },
      });

      const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { course: course.id },
        populate: { student: true },
        limit: 500,
      });
      for (const e of enrollments) {
        if (e.student?.id) {
          await notifyUser(strapi, e.student.id, {
            title: `Announcement: ${title}`,
            body: content.slice(0, 180),
            type: 'announcement',
            linkUrl: `/courses/${course.slug}#announcements`,
          });
        }
      }

      return { data: row };
    },

    // —— Question bank → quiz ——
    async listCourseQuestionBank(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      assertCourseOwnerOrManager(user, course);
      const rows = await strapi.db.query('api::question-bank-item.question-bank-item').findMany({
        where: { course: course.id },
        orderBy: { id: 'desc' },
        limit: 100,
      });
      return { data: rows };
    },

    async importQuestionBankToQuiz(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const quiz = await resolve(strapi, 'api::quiz.quiz', ctx.params.quizId);
      if (!quiz) throw new NotFoundError('Quiz not found');
      const full = await strapi.db.query('api::quiz.quiz').findOne({
        where: { id: quiz.id },
        populate: { course: { populate: { instructor: true, createdByUser: true } } },
      });
      if (!full?.course) throw new NotFoundError('Quiz course missing');
      assertCourseOwnerOrManager(user, full.course);

      const ids: Array<string | number> = Array.isArray(ctx.request.body?.itemIds)
        ? ctx.request.body.itemIds
        : [];
      if (!ids.length) throw new ValidationError('itemIds required');

      const existingCount = await strapi.db.query('api::quiz-question.quiz-question').count({
        where: { quiz: full.id },
      });
      let order = existingCount;
      let imported = 0;

      for (const rawId of ids) {
        const item =
          (await resolve(strapi, 'api::question-bank-item.question-bank-item', String(rawId))) ||
          null;
        if (!item) continue;
        const optionsJson = Array.isArray(item.options) ? item.options : [];
        const question = await strapi.db.query('api::quiz-question.quiz-question').create({
          data: {
            question: item.question,
            order: order++,
            quiz: full.id,
          },
        });
        for (let i = 0; i < optionsJson.length; i++) {
          const opt = optionsJson[i];
          const text = typeof opt === 'string' ? opt : String(opt?.text || '');
          if (!text) continue;
          const isCorrect =
            typeof opt === 'object'
              ? Boolean(opt.isCorrect)
              : String(item.correctAnswer || '') === text;
          await strapi.db.query('api::quiz-option.quiz-option').create({
            data: {
              text,
              isCorrect,
              order: i,
              question: question.id,
            },
          });
        }
        imported += 1;
      }

      return { data: { imported } };
    },

    // —— Live sessions ——
    async listCourseLiveSessions(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      const canManage = canManageCourse(user, course);
      if (!canManage) {
        assertStudent(user);
        await requireEnrollment(strapi, user.id, course.id);
      }
      const rows = await strapi.db.query('api::live-session.live-session').findMany({
        where: { course: course.id },
        orderBy: { startsAt: 'asc' },
        limit: 50,
      });
      return { data: rows };
    },

    async createCourseLiveSession(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      assertCourseOwnerOrManager(user, course);

      const title = String(ctx.request.body?.title || '').trim();
      const meetingUrl = String(ctx.request.body?.meetingUrl || '').trim();
      const startsAt = ctx.request.body?.startsAt;
      if (!title || !meetingUrl || !startsAt) {
        throw new ValidationError('title, meetingUrl, startsAt required');
      }

      const row = await strapi.db.query('api::live-session.live-session').create({
        data: {
          title,
          description: ctx.request.body?.description || null,
          startsAt,
          endsAt: ctx.request.body?.endsAt || null,
          meetingUrl,
          course: course.id,
          createdByUser: user.id,
        },
      });

      const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { course: course.id },
        populate: { student: true },
        limit: 500,
      });
      for (const e of enrollments) {
        if (e.student?.id) {
          await notifyUser(strapi, e.student.id, {
            title: `Live class: ${title}`,
            body: `Scheduled for ${new Date(startsAt).toLocaleString()}`,
            type: 'live',
            linkUrl: `/courses/${course.slug}#live`,
          });
        }
      }

      return { data: row };
    },

    // —— Support tickets (student) ——
    async listMyTickets(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const rows = await strapi.db.query('api::support-ticket.support-ticket').findMany({
        where: { user: user.id },
        orderBy: { id: 'desc' },
        limit: 50,
      });
      return { data: rows };
    },

    async createMyTicket(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const subject = String(ctx.request.body?.subject || '').trim();
      const body = String(ctx.request.body?.body || '').trim();
      if (!subject) throw new ValidationError('subject required');
      const row = await strapi.db.query('api::support-ticket.support-ticket').create({
        data: {
          ticketNumber: ticketCode(),
          subject,
          body,
          category: ctx.request.body?.category || 'general',
          priority: ctx.request.body?.priority || 'MEDIUM',
          status: 'OPEN',
          user: user.id,
        },
      });
      return { data: row };
    },

    // —— Wishlist ——
    async listMyWishlist(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const rows = await strapi.db.query('api::wishlist.wishlist').findMany({
        where: { student: user.id },
        populate: { course: true },
        orderBy: { id: 'desc' },
        limit: 100,
      });
      return {
        data: rows.map((w: any) => ({
          id: w.id,
          documentId: w.documentId,
          course: w.course
            ? {
                id: w.course.id,
                documentId: w.course.documentId,
                title: w.course.title,
                slug: w.course.slug,
                thumbnailUrl: w.course.thumbnailUrl,
                shortDescription: w.course.shortDescription,
              }
            : null,
        })),
      };
    },

    async addWishlist(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const course = await findCourse(strapi, ctx.params.courseId);
      if (!course) throw new NotFoundError('Course not found');
      const existing = await strapi.db.query('api::wishlist.wishlist').findOne({
        where: { student: user.id, course: course.id },
      });
      if (existing) return { data: { id: existing.id, documentId: existing.documentId } };
      const row = await strapi.db.query('api::wishlist.wishlist').create({
        data: { student: user.id, course: course.id },
      });
      return { data: { id: row.id, documentId: row.documentId } };
    },

    async removeWishlist(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const course = await findCourse(strapi, ctx.params.courseId);
      if (!course) throw new NotFoundError('Course not found');
      const existing = await strapi.db.query('api::wishlist.wishlist').findOne({
        where: { student: user.id, course: course.id },
      });
      if (existing) {
        await strapi.db.query('api::wishlist.wishlist').delete({ where: { id: existing.id } });
      }
      return { data: { removed: Boolean(existing) } };
    },

    // —— Instructor analytics ——
    async instructorCourseAnalytics(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      if (!isInstructor(user) && !isAdmin(user) && !isContentManager(user)) {
        throw new ForbiddenError('Staff required');
      }
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
        lessons: true,
        quizzes: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      assertCourseOwnerOrManager(user, course);

      const enrollments = await strapi.db.query('api::enrollment.enrollment').count({
        where: { course: course.id },
      });
      const lessons = course.lessons || [];
      const lessonStats = [];
      for (const lesson of lessons) {
        const completed = await strapi.db.query('api::lesson-progress.lesson-progress').count({
          where: { course: course.id, lesson: lesson.id, completed: true },
        });
        lessonStats.push({
          lessonId: lesson.documentId || lesson.id,
          title: lesson.title,
          completedCount: completed,
          completionRate:
            enrollments > 0 ? Math.round((completed / enrollments) * 100) : 0,
        });
      }

      const quizStats = [];
      for (const quiz of course.quizzes || []) {
        const attempts = await strapi.db.query('api::quiz-attempt.quiz-attempt').findMany({
          where: { quiz: quiz.id },
          limit: 500,
        });
        const avg =
          attempts.length > 0
            ? Math.round(
                attempts.reduce((s: number, a: any) => s + Number(a.percentage || 0), 0) /
                  attempts.length
              )
            : null;
        quizStats.push({
          quizId: quiz.documentId || quiz.id,
          title: quiz.title,
          attemptCount: attempts.length,
          averagePercent: avg,
        });
      }

      return {
        data: {
          courseId: course.documentId || course.id,
          title: course.title,
          enrollmentCount: enrollments,
          lessonStats,
          quizStats,
        },
      };
    },
  };
}
