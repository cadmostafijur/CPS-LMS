import type { Core } from '@strapi/strapi';

/** Create an in-app notification for a user (best-effort; never throws to callers). */
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
  } catch (err) {
    strapi.log.warn(`[notifyUser] failed for user ${userId}: ${String(err)}`);
  }
}
