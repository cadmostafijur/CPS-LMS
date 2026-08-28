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
import { generateSageReply } from '../../../utils/sage-ai';

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
          dropOffRate:
            enrollments > 0
              ? Math.round(((enrollments - completed) / enrollments) * 100)
              : 0,
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
        const passPercent = Number(quiz.passPercent ?? 80);
        const passRate =
          attempts.length > 0
            ? Math.round(
                (attempts.filter((a: any) => Number(a.percentage || 0) >= passPercent).length /
                  attempts.length) *
                  100
              )
            : null;
        quizStats.push({
          quizId: quiz.documentId || quiz.id,
          title: quiz.title,
          attemptCount: attempts.length,
          averagePercent: avg,
          passRate,
          difficultyHint:
            avg == null ? 'unknown' : avg >= 80 ? 'easy' : avg >= 60 ? 'medium' : 'hard',
        });
      }

      return {
        data: {
          courseId: course.documentId || course.id,
          title: course.title,
          enrollmentCount: enrollments,
          lessonStats,
          quizStats,
          difficultyHint:
            quizStats.length === 0
              ? null
              : quizStats.some((q: any) => q.difficultyHint === 'hard')
                ? 'Some quizzes average below 60% — review content or questions.'
                : quizStats.every((q: any) => q.difficultyHint === 'easy')
                  ? 'Quizzes look easy overall (avg ≥ 80%).'
                  : 'Quiz difficulty looks mixed / medium.',
        },
      };
    },

    // —— Messaging ——
    async listMyMessages(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const withUser = ctx.query.withUser ? String(ctx.query.withUser) : null;
      const where: any = {
        $or: [{ sender: user.id }, { recipient: user.id }],
      };
      if (withUser) {
        const other = await resolve(strapi, 'plugin::users-permissions.user', withUser);
        if (other) {
          where.$and = [
            {
              $or: [
                { sender: user.id, recipient: other.id },
                { sender: other.id, recipient: user.id },
              ],
            },
          ];
          delete where.$or;
        }
      }
      const rows = await strapi.db.query('api::message.message').findMany({
        where,
        populate: { sender: true, recipient: true, course: true },
        orderBy: { id: 'asc' },
        limit: 200,
      });
      return {
        data: rows.map((m: any) => ({
          id: m.id,
          documentId: m.documentId,
          body: m.body,
          isRead: m.isRead,
          createdAt: m.createdAt,
          courseId: m.course?.documentId || m.course?.id || null,
          sender: sanitizeUser(m.sender),
          recipient: sanitizeUser(m.recipient),
        })),
      };
    },

    async sendMessage(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const recipientId = ctx.request.body?.recipientId;
      const body = String(ctx.request.body?.body || '').trim();
      if (!recipientId || !body) throw new ValidationError('recipientId and body required');
      const recipient = await resolve(
        strapi,
        'plugin::users-permissions.user',
        String(recipientId)
      );
      if (!recipient) throw new NotFoundError('Recipient not found');

      let courseId = null;
      if (ctx.request.body?.courseId) {
        const course = await findCourse(strapi, String(ctx.request.body.courseId));
        courseId = course?.id || null;
      }

      const row = await strapi.db.query('api::message.message').create({
        data: {
          body,
          isRead: false,
          sender: user.id,
          recipient: recipient.id,
          course: courseId,
        },
        populate: { sender: true, recipient: true },
      });

      await notifyUser(strapi, recipient.id, {
        title: 'New message',
        body: `${user.name || user.email}: ${body.slice(0, 120)}`,
        type: 'message',
        linkUrl: '/student/messages',
      });

      return {
        data: {
          id: row.id,
          documentId: row.documentId,
          body: row.body,
          createdAt: row.createdAt,
          sender: sanitizeUser(row.sender || user),
          recipient: sanitizeUser(row.recipient || recipient),
        },
      };
    },

    // —— Live attendance ——
    async markLiveAttendance(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const session = await resolve(strapi, 'api::live-session.live-session', ctx.params.id);
      if (!session) throw new NotFoundError('Live session not found');
      const full = await strapi.db.query('api::live-session.live-session').findOne({
        where: { id: session.id },
        populate: { course: true },
      });
      if (!full?.course) throw new NotFoundError('Session course missing');
      await requireEnrollment(strapi, user.id, full.course.id);
      const ids = Array.isArray(full.attendeeIds) ? [...full.attendeeIds] : [];
      if (!ids.map(String).includes(String(user.id))) ids.push(user.id);
      const updated = await strapi.db.query('api::live-session.live-session').update({
        where: { id: full.id },
        data: { attendeeIds: ids },
      });
      return { data: { id: updated.id, attendeeCount: ids.length, attended: true } };
    },

    // —— Wishlist reminders ——
    async runWishlistReminders(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const rows = await strapi.db.query('api::wishlist.wishlist').findMany({
        where: { student: user.id },
        populate: { course: true },
        limit: 50,
      });
      let sent = 0;
      for (const w of rows) {
        if (!w.course) continue;
        await notifyUser(strapi, user.id, {
          title: 'Wishlist reminder',
          body: `Still interested in “${w.course.title}”? Enroll when you’re ready.`,
          type: 'wishlist',
          linkUrl: w.course.slug ? `/courses/${w.course.slug}` : '/student/wishlist',
        });
        sent += 1;
      }
      return { data: { reminded: sent } };
    },

    // —— Transcript / gradebook ——
    async studentTranscript(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { student: user.id },
        populate: { course: { populate: { lessons: true, quizzes: true } } },
      });
      const rows = [];
      for (const e of enrollments) {
        if (!e.course) continue;
        const completed = await strapi.db.query('api::lesson-progress.lesson-progress').count({
          where: { student: user.id, course: e.course.id, completed: true },
        });
        const total = (e.course.lessons || []).length || 0;
        const pct = total ? Math.round((completed / total) * 100) : 0;
        const attempts = await strapi.db.query('api::quiz-attempt.quiz-attempt').findMany({
          where: { student: user.id, quiz: { course: e.course.id } },
          limit: 100,
        });
        const bestQuiz =
          attempts.length > 0
            ? Math.max(...attempts.map((a: any) => Number(a.percentage || 0)))
            : null;
        rows.push({
          courseTitle: e.course.title,
          courseSlug: e.course.slug,
          progressPercent: pct,
          completedLessons: completed,
          totalLessons: total,
          bestQuizPercent: bestQuiz,
          completedAt: e.completedAt || null,
        });
      }
      return {
        data: {
          student: sanitizeUser(user),
          generatedAt: new Date().toISOString(),
          courses: rows,
        },
      };
    },

    async exportCourseGradesCsv(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
        lessons: true,
        quizzes: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      assertCourseOwnerOrManager(user, course);

      const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { course: course.id },
        populate: { student: true },
        limit: 1000,
      });
      const lines = ['student_name,student_email,progress_percent,best_quiz_percent,completed_at'];
      for (const e of enrollments) {
        const completed = await strapi.db.query('api::lesson-progress.lesson-progress').count({
          where: { student: e.student?.id, course: course.id, completed: true },
        });
        const total = (course.lessons || []).length || 0;
        const pct = total ? Math.round((completed / total) * 100) : 0;
        const attempts = await strapi.db.query('api::quiz-attempt.quiz-attempt').findMany({
          where: { student: e.student?.id, quiz: { course: course.id } },
          limit: 50,
        });
        const best =
          attempts.length > 0
            ? Math.max(...attempts.map((a: any) => Number(a.percentage || 0)))
            : '';
        const name = (e.student?.name || '').replace(/,/g, ' ');
        const email = e.student?.email || '';
        lines.push(`${name},${email},${pct},${best},${e.completedAt || ''}`);
      }
      return {
        data: {
          filename: `grades-${course.slug || course.id}.csv`,
          csv: lines.join('\n'),
        },
      };
    },

    // —— Clone course (CM/Admin/Instructor owner) ——
    async cloneCourse(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const course = await findCourse(strapi, ctx.params.courseId, {
        instructor: true,
        createdByUser: true,
        lessons: true,
        modules: true,
        category: true,
      });
      if (!course) throw new NotFoundError('Course not found');
      assertCourseOwnerOrManager(user, course);

      const title = `${course.title} (Copy)`;
      const slugBase = `${course.slug || 'course'}-copy-${Date.now().toString(36)}`;
      const created = await strapi.db.query('api::course.course').create({
        data: {
          title,
          slug: slugBase,
          description: course.description,
          shortDescription: course.shortDescription,
          thumbnailUrl: course.thumbnailUrl,
          coverImageUrl: course.coverImageUrl,
          status: 'DRAFT',
          isFree: course.isFree,
          price: course.price,
          currency: course.currency,
          difficulty: course.difficulty,
          language: course.language,
          requirements: course.requirements,
          outcomes: course.outcomes,
          tags: course.tags,
          seoTitle: course.seoTitle,
          seoDescription: course.seoDescription,
          category: course.category?.id || null,
          instructor: user.id,
          createdByUser: user.id,
        },
      });

      const moduleMap = new Map<string, number>();
      for (const mod of [...(course.modules || [])].sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
      )) {
        const nm = await strapi.db.query('api::course-module.course-module').create({
          data: {
            title: mod.title,
            order: mod.order ?? 0,
            course: created.id,
          },
        });
        moduleMap.set(String(mod.id), nm.id);
      }

      for (const lesson of [...(course.lessons || [])].sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
      )) {
        const mid = lesson.module?.id ? moduleMap.get(String(lesson.module.id)) : null;
        await strapi.db.query('api::lesson.lesson').create({
          data: {
            title: lesson.title,
            slug: `${lesson.slug || 'lesson'}-copy-${Date.now().toString(36)}-${lesson.order || 0}`,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            captionsUrl: lesson.captionsUrl,
            lessonType: lesson.lessonType,
            documentUrl: lesson.documentUrl,
            externalUrl: lesson.externalUrl,
            isPreview: lesson.isPreview,
            durationMinutes: lesson.durationMinutes,
            order: lesson.order,
            course: created.id,
            module: mid || null,
          },
        });
      }

      return {
        data: {
          id: created.id,
          documentId: created.documentId,
          title: created.title,
          slug: created.slug,
        },
      };
    },

    // —— Student live calendar (all enrolled courses) ——
    async listMyLiveCalendar(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);
      const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { student: user.id },
        populate: { course: true },
        limit: 100,
      });
      const courseIds = enrollments.map((e: any) => e.course?.id).filter(Boolean);
      if (!courseIds.length) return { data: [] };
      const sessions = await strapi.db.query('api::live-session.live-session').findMany({
        where: { course: { id: { $in: courseIds } } },
        populate: { course: true },
        orderBy: { startsAt: 'asc' },
        limit: 200,
      });
      return {
        data: sessions.map((s: any) => ({
          id: s.id,
          documentId: s.documentId,
          title: s.title,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          meetingUrl: s.meetingUrl,
          attendeeIds: s.attendeeIds || [],
          attended: Array.isArray(s.attendeeIds)
            ? s.attendeeIds.map(String).includes(String(user.id))
            : false,
          course: s.course
            ? {
                id: s.course.id,
                documentId: s.course.documentId,
                title: s.course.title,
                slug: s.course.slug,
              }
            : null,
        })),
      };
    },

    // —— Help Desk (community forum) ——
    async listHelpDeskPosts(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      let courseIds: number[] = [];
      const courseMap = new Map<number, any>();
      const courseOptions: { id: string | number; title?: string }[] = [];

      if (isStudent(user)) {
        const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
          where: { student: user.id },
          populate: { course: true },
          limit: 100,
        });
        courseIds = enrollments.map((e: any) => e.course?.id).filter(Boolean);
        for (const e of enrollments) {
          if (e.course?.id) {
            courseMap.set(e.course.id, e.course);
            courseOptions.push({
              id: e.course.documentId || e.course.id,
              title: e.course.title,
            });
          }
        }
      } else if (isInstructor(user) || isContentManager(user) || isAdmin(user)) {
        const taught = await strapi.db.query('api::course.course').findMany({
          where: isAdmin(user) || isContentManager(user)
            ? {}
            : { instructor: user.id },
          limit: 100,
        });
        courseIds = taught.map((c: any) => c.id).filter(Boolean);
        for (const c of taught) {
          courseMap.set(c.id, c);
          courseOptions.push({ id: c.documentId || c.id, title: c.title });
        }
      }

      let threads: any[] = [];
      if (courseIds.length) {
        threads = await strapi.db.query('api::discussion-post.discussion-post').findMany({
          where: {
            course: { id: { $in: courseIds } },
            parent: null,
            isHidden: false,
          },
          populate: {
            author: { populate: { role: true } },
            course: true,
            replies: { populate: { author: { populate: { role: true } } } },
          },
          orderBy: { id: 'desc' },
          limit: 100,
        });
      }

      const announcements = await strapi.db.query('api::announcement.announcement').findMany({
        where: {
          isActive: true,
          audience: { $in: ['EVERYONE', 'STUDENTS'] },
        },
        populate: { course: true },
        orderBy: { id: 'desc' },
        limit: 30,
      });

      const mapPost = (p: any) => {
        const roleName = p.author?.role?.name || p.author?.role?.type || '';
        const isStaff = ['Admin', 'Content Manager', 'Instructor'].includes(roleName);
        const course = p.course;
        return {
          id: p.id,
          documentId: p.documentId,
          kind: 'post' as const,
          title: p.title || null,
          body: p.body,
          category: p.category || 'courses',
          isResolved: Boolean(p.isResolved),
          createdAt: p.createdAt,
          author: sanitizeUser(p.author),
          isStaffPost: isStaff,
          isMine: String(p.author?.id) === String(user.id),
          commentCount: (p.replies || []).filter((r: any) => !r.isHidden).length,
          course: course
            ? {
                id: course.id,
                documentId: course.documentId,
                title: course.title,
                slug: course.slug,
              }
            : null,
          replies: [...(p.replies || [])]
            .filter((r: any) => !r.isHidden)
            .sort(
              (a: any, b: any) =>
                new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            )
            .map((r: any) => ({
              id: r.id,
              documentId: r.documentId,
              body: r.body,
              createdAt: r.createdAt,
              author: sanitizeUser(r.author),
            })),
        };
      };

      const posts = threads.map(mapPost);
      const annPosts = announcements.map((a: any) => ({
        id: `ann-${a.id}`,
        documentId: a.documentId,
        kind: 'announcement' as const,
        title: a.title,
        body: a.content,
        category: 'announcements' as const,
        isResolved: false,
        createdAt: a.publishAt || a.createdAt,
        author: { name: 'CPS Academy', email: null },
        isStaffPost: true,
        isMine: false,
        commentCount: 0,
        course: a.course
          ? {
              id: a.course.id,
              documentId: a.course.documentId,
              title: a.course.title,
              slug: a.course.slug,
            }
          : null,
        replies: [],
      }));

      const merged = [...annPosts, ...posts].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      const counts = {
        courses: posts.filter((p) => p.category === 'courses').length,
        bugs: posts.filter((p) => p.category === 'bugs').length,
        feature: posts.filter((p) => p.category === 'feature').length,
        others: posts.filter((p) => p.category === 'others').length,
        announcements: annPosts.length,
        resolved: posts.filter((p) => p.isResolved).length,
      };

      return {
        data: merged,
        meta: {
          counts,
          courses: courseOptions,
        },
      };
    },

    async createHelpDeskPost(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const body = ctx.request.body || {};
      const text = String(body.body || '').trim();
      const title = String(body.title || '').trim();
      const category = String(body.category || 'courses');
      const allowed = ['courses', 'bugs', 'feature', 'others'];
      if (!allowed.includes(category)) throw new ValidationError('Invalid category');
      if (!text) throw new ValidationError('body is required');

      let course = null;
      if (body.courseId) {
        course = await findCourse(strapi, String(body.courseId), {
          instructor: true,
          createdByUser: true,
        });
      } else if (isStudent(user)) {
        const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
          where: { student: user.id },
          populate: { course: true },
          orderBy: { id: 'desc' },
        });
        course = enrollment?.course || null;
      }
      if (!course) throw new ValidationError('courseId is required');

      const canManage = canManageCourse(user, course);
      if (!canManage) {
        assertStudent(user);
        await requireEnrollment(strapi, user.id, course.id);
      }

      const post = await strapi.db.query('api::discussion-post.discussion-post').create({
        data: {
          title: title || null,
          body: text,
          category,
          isResolved: false,
          isHidden: false,
          course: course.id,
          author: user.id,
          parent: null,
        },
        populate: { author: { populate: { role: true } }, course: true },
      });

      return {
        data: {
          id: post.id,
          documentId: post.documentId,
          kind: 'post',
          title: post.title,
          body: post.body,
          category: post.category || category,
          isResolved: false,
          createdAt: post.createdAt,
          author: sanitizeUser(post.author || user),
          isStaffPost: false,
          isMine: true,
          commentCount: 0,
          course: {
            id: course.id,
            documentId: course.documentId,
            title: course.title,
            slug: course.slug,
          },
          replies: [],
        },
      };
    },

    // —— Sage AI assistant ——
    async aiAssistant(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      assertStudent(user);

      const body = ctx.request.body || {};
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];
      const messages = rawMessages
        .filter(
          (m: any) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim()
        )
        .slice(-20)
        .map((m: any) => ({ role: m.role, content: m.content.trim() }));

      if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
        throw new ValidationError('Send at least one user message');
      }

      const context = {
        studentName: user.name || user.username,
        enrolledCourses: Array.isArray(body.context?.enrolledCourses)
          ? body.context.enrolledCourses
          : undefined,
      };

      try {
        const result = await generateSageReply(messages, context);
        return {
          data: {
            role: 'assistant',
            content: result.reply,
            provider: result.provider,
            assistantName: result.assistantName,
          },
        };
      } catch (err: any) {
        throw new ApplicationError(
          err?.message || 'Sage AI is unavailable. Check AGENTROUTER_API_KEY on the server.'
        );
      }
    },
  };
}
