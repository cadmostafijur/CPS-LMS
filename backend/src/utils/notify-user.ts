import type { Core } from '@strapi/strapi';
import { sendEmail } from './mail-upload';

/** Create an in-app notification (+ optional email) for a user. Never throws. */
export async function notifyUser(
  strapi: Core.Strapi,
  userId: number | string,
  payload: {
    title: string;
    body?: string;
    type?: string;
    linkUrl?: string | null;
  }
) {
  try {
    await strapi.db.query('api::notification.notification').create({
      data: {
        title: payload.title,
        body: payload.body || '',
        type: payload.type || 'system',
        isRead: false,
        linkUrl: payload.linkUrl || null,
        user: userId,
      },
    });

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
    });
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `[CPS Academy] ${payload.title}`,
        text: `${payload.body || payload.title}\n\n${payload.linkUrl || ''}`.trim(),
      });
    }
  } catch (err) {
    strapi.log.warn(`[notifyUser] failed for user ${userId}: ${String(err)}`);
  }
}

/** Notify all students enrolled in a course. Never throws. */
export async function notifyCourseStudents(
  strapi: Core.Strapi,
  courseId: number | string,
  payload: {
    title: string;
    body?: string;
    type?: string;
    linkUrl?: string | null;
  }
) {
  try {
    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      where: { course: courseId },
      populate: { student: true },
      limit: 500,
    });
    for (const e of enrollments) {
      if (e.student?.id) {
        await notifyUser(strapi, e.student.id, payload);
      }
    }
  } catch (err) {
    strapi.log.warn(`[notifyCourseStudents] failed for course ${courseId}: ${String(err)}`);
  }
}
