import { errors } from '@strapi/utils';
import type { Core } from '@strapi/strapi';
import { getAuthUser } from '../../../utils/auth';
import { isAdmin, isContentManager, ROLE_NAMES } from '../../../utils/roles';
import { sanitizeUser } from '../../../utils/sanitize';

const { ForbiddenError, NotFoundError, ValidationError } = errors;

type Ctx = any;

async function resolve(strapi: Core.Strapi, uid: string, id: string) {
  const byDoc = await strapi.db.query(uid).findOne({ where: { documentId: id } });
  if (byDoc) return byDoc;
  if (/^\d+$/.test(String(id))) {
    return strapi.db.query(uid).findOne({ where: { id: Number(id) } });
  }
  return null;
}

async function requireAdmin(ctx: Ctx, strapi: Core.Strapi) {
  const user = await getAuthUser(ctx, strapi);
  if (!isAdmin(user)) throw new ForbiddenError('Admin required');
  return user;
}

async function requireStaff(ctx: Ctx, strapi: Core.Strapi) {
  const user = await getAuthUser(ctx, strapi);
  if (!isAdmin(user) && !isContentManager(user)) {
    throw new ForbiddenError('Staff required');
  }
  return user;
}

async function audit(
  strapi: Core.Strapi,
  user: any,
  action: string,
  entity?: string,
  entityId?: string | number,
  meta?: any
) {
  try {
    await strapi.db.query('api::audit-log.audit-log').create({
      data: {
        action,
        entity: entity || null,
        entityId: entityId != null ? String(entityId) : null,
        meta: meta || null,
        user: user?.id || null,
      },
    });
  } catch {
    // non-blocking
  }
}

function code(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function createOpsHandlers(strapi: Core.Strapi) {
  return {
    async adminListByRole(ctx: Ctx) {
      await requireAdmin(ctx, strapi);
      const roleName = String(ctx.query.role || ROLE_NAMES.STUDENT);
      const search = String(ctx.query.search || '').trim();
      const role = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { name: roleName },
      });
      if (!role) return { data: [] };
      const where: any = { role: role.id };
      if (search) {
        where.$or = [
          { email: { $containsi: search } },
          { name: { $containsi: search } },
          { username: { $containsi: search } },
        ];
      }
      const users = await strapi.db.query('plugin::users-permissions.user').findMany({
        where,
        populate: { role: true },
        orderBy: { id: 'desc' },
        limit: 100,
      });
      const data = await Promise.all(
        users.map(async (u: any) => {
          const enrollments = await strapi.db.query('api::enrollment.enrollment').count({
            where: { student: u.id },
          });
          const courses = await strapi.db.query('api::course.course').count({
            where: { instructor: u.id },
          });
          return {
            ...sanitizeUser(u),
            enrollmentCount: enrollments,
            courseCount: courses,
          };
        })
      );
      return { data };
    },

    async adminForceEnroll(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const { studentId, courseId } = ctx.request.body || {};
      if (!studentId || !courseId) {
        throw new ValidationError('studentId and courseId are required');
      }
      const student = await resolve(strapi, 'plugin::users-permissions.user', String(studentId));
      const course = await resolve(strapi, 'api::course.course', String(courseId));
      if (!student || !course) throw new NotFoundError('Student or course not found');
      const existing = await strapi.db.query('api::enrollment.enrollment').findOne({
        where: { student: student.id, course: course.id },
      });
      if (existing) throw new ValidationError('Already enrolled');
      const enrollment = await strapi.db.query('api::enrollment.enrollment').create({
        data: {
          student: student.id,
          course: course.id,
          enrolledAt: new Date().toISOString(),
          isFreeEnrollment: true,
          originalPrice: 0,
          amountPaid: 0,
        },
        populate: { student: true, course: true },
      });
      await audit(strapi, admin, 'enrollment.force', 'enrollment', enrollment.id, {
        studentId: student.id,
        courseId: course.id,
      });
      return { data: enrollment };
    },

    async adminRemoveEnrollment(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const target = await resolve(strapi, 'api::enrollment.enrollment', ctx.params.id);
      if (!target) throw new NotFoundError('Enrollment not found');
      await strapi.db.query('api::enrollment.enrollment').delete({ where: { id: target.id } });
      await audit(strapi, admin, 'enrollment.remove', 'enrollment', target.id);
      return { data: { id: target.id, deleted: true } };
    },

    async adminCrudList(ctx: Ctx) {
      await requireAdmin(ctx, strapi);
      const uid = String(ctx.params.uid || '');
      const allowed = UID_MAP[uid];
      if (!allowed) throw new ValidationError('Unknown resource');
      const search = String(ctx.query.search || '').trim();
      const where: any = {};
      if (search && allowed.searchFields?.length) {
        where.$or = allowed.searchFields.map((f) => ({ [f]: { $containsi: search } }));
      }
      const rows = await strapi.db.query(allowed.uid).findMany({
        where,
        populate: allowed.populate || true,
        orderBy: { id: 'desc' },
        limit: Math.min(200, Number(ctx.query.pageSize || 50)),
      });
      return { data: rows };
    },

    async adminCrudCreate(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const uid = String(ctx.params.uid || '');
      const allowed = UID_MAP[uid];
      if (!allowed) throw new ValidationError('Unknown resource');
      const body = ctx.request.body || {};
      const data = allowed.prepareCreate ? allowed.prepareCreate(body, admin) : body;
      const created = await strapi.db.query(allowed.uid).create({
        data,
        populate: allowed.populate || true,
      });
      await audit(strapi, admin, `${uid}.create`, uid, created.id);
      return { data: created };
    },

    async adminCrudUpdate(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const uid = String(ctx.params.uid || '');
      const allowed = UID_MAP[uid];
      if (!allowed) throw new ValidationError('Unknown resource');
      const target = await resolve(strapi, allowed.uid, ctx.params.id);
      if (!target) throw new NotFoundError('Not found');
      const body = ctx.request.body || {};
      const data = allowed.prepareUpdate ? allowed.prepareUpdate(body, admin) : body;
      const updated = await strapi.db.query(allowed.uid).update({
        where: { id: target.id },
        data,
        populate: allowed.populate || true,
      });
      await audit(strapi, admin, `${uid}.update`, uid, target.id);
      return { data: updated };
    },

    async adminCrudDelete(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const uid = String(ctx.params.uid || '');
      const allowed = UID_MAP[uid];
      if (!allowed) throw new ValidationError('Unknown resource');
      const target = await resolve(strapi, allowed.uid, ctx.params.id);
      if (!target) throw new NotFoundError('Not found');
      await strapi.db.query(allowed.uid).delete({ where: { id: target.id } });
      await audit(strapi, admin, `${uid}.delete`, uid, target.id);
      return { data: { id: target.id, deleted: true } };
    },

    async adminStockAdjust(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const { itemId, quantity, type, reason } = ctx.request.body || {};
      if (!itemId || quantity == null || !type) {
        throw new ValidationError('itemId, quantity, type required');
      }
      const item = await resolve(strapi, 'api::inventory-item.inventory-item', String(itemId));
      if (!item) throw new NotFoundError('Item not found');
      const prev = Number(item.quantity || 0);
      const qty = Number(quantity);
      let next = prev;
      if (type === 'IN') next = prev + qty;
      else if (type === 'OUT') next = prev - qty;
      else if (type === 'ADJUSTMENT') next = qty;
      else throw new ValidationError('Invalid movement type');
      if (next < 0) throw new ValidationError('Stock cannot be negative');
      let status = 'IN_STOCK';
      if (next === 0) status = 'OUT_OF_STOCK';
      else if (next <= Number(item.reorderLevel || item.minStock || 0)) status = 'LOW_STOCK';
      const updated = await strapi.db.query('api::inventory-item.inventory-item').update({
        where: { id: item.id },
        data: { quantity: next, status },
      });
      await strapi.db.query('api::stock-movement.stock-movement').create({
        data: {
          type,
          quantity: qty,
          previousQuantity: prev,
          newQuantity: next,
          reason: reason || null,
          item: item.id,
          warehouse: item.warehouse || null,
          createdByUser: admin.id,
        },
      });
      await audit(strapi, admin, 'inventory.stock', 'inventory-item', item.id, {
        type,
        prev,
        next,
      });
      return { data: updated };
    },

    async adminRevokeCertificate(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const cert = await resolve(strapi, 'api::certificate.certificate', ctx.params.id);
      if (!cert) throw new NotFoundError('Certificate not found');
      const updated = await strapi.db.query('api::certificate.certificate').update({
        where: { id: cert.id },
        data: { status: 'REVOKED' },
      });
      await audit(strapi, admin, 'certificate.revoke', 'certificate', cert.id);
      return { data: updated };
    },

    async verifyCertificate(ctx: Ctx) {
      const codeValue = String(ctx.params.code || '');
      const cert = await strapi.db.query('api::certificate.certificate').findOne({
        where: { code: codeValue },
        populate: { student: true, course: true },
      });
      if (!cert) throw new NotFoundError('Certificate not found');
      return {
        data: {
          valid: cert.status !== 'REVOKED',
          status: cert.status || 'ISSUED',
          code: cert.code,
          studentName: cert.studentName,
          courseTitle: cert.courseTitle,
          issuedAt: cert.issuedAt,
        },
      };
    },

    async createOrderCheckout(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const { courseId, couponCode } = ctx.request.body || {};
      if (!courseId) throw new ValidationError('courseId required');
      const course = await resolve(strapi, 'api::course.course', String(courseId));
      if (!course) throw new NotFoundError('Course not found');
      const amount = Math.max(0, Number(course.price || 0));
      const order = await strapi.db.query('api::order.order').create({
        data: {
          orderNumber: code('ORD'),
          amount,
          discount: 0,
          total: amount,
          currency: course.currency || 'USD',
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          couponCode: couponCode || null,
          customer: user.id,
          course: course.id,
        },
      });
      return { data: order };
    },

    async payOrder(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const order = await resolve(strapi, 'api::order.order', ctx.params.id);
      if (!order) throw new NotFoundError('Order not found');
      if (Number(order.customer) !== Number(user.id) && !isAdmin(user)) {
        const full = await strapi.db.query('api::order.order').findOne({
          where: { id: order.id },
          populate: { customer: true, course: true },
        });
        if (Number(full?.customer?.id) !== Number(user.id) && !isAdmin(user)) {
          throw new ForbiddenError('Not your order');
        }
      }
      const full = await strapi.db.query('api::order.order').findOne({
        where: { id: order.id },
        populate: { customer: true, course: true },
      });
      const payment = await strapi.db.query('api::payment.payment').create({
        data: {
          transactionId: code('TXN'),
          amount: full.total,
          currency: full.currency || 'USD',
          method: 'SIMULATED',
          gateway: 'internal',
          status: 'SUCCESS',
          paidAt: new Date().toISOString(),
          order: full.id,
          customer: user.id,
        },
      });
      await strapi.db.query('api::order.order').update({
        where: { id: full.id },
        data: { status: 'PAID', paymentStatus: 'PAID' },
      });
      if (full.course) {
        const existing = await strapi.db.query('api::enrollment.enrollment').findOne({
          where: { student: user.id, course: full.course.id },
        });
        if (!existing) {
          await strapi.db.query('api::enrollment.enrollment').create({
            data: {
              student: user.id,
              course: full.course.id,
              enrolledAt: new Date().toISOString(),
              isFreeEnrollment: Number(full.total) === 0,
              originalPrice: Number(full.amount || 0),
              amountPaid: Number(full.total || 0),
              couponCode: full.couponCode || null,
              currency: full.currency || 'USD',
            },
          });
        }
      }
      return { data: { orderId: full.id, payment } };
    },

    async listMyNotifications(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const rows = await strapi.db.query('api::notification.notification').findMany({
        where: { user: user.id },
        orderBy: { id: 'desc' },
        limit: 50,
      });
      return { data: rows };
    },

    async markNotificationRead(ctx: Ctx) {
      const user = await getAuthUser(ctx, strapi);
      const n = await resolve(strapi, 'api::notification.notification', ctx.params.id);
      if (!n) throw new NotFoundError('Notification not found');
      const updated = await strapi.db.query('api::notification.notification').update({
        where: { id: n.id },
        data: { isRead: true },
      });
      return { data: updated };
    },

    async listAnnouncements(ctx: Ctx) {
      const rows = await strapi.db.query('api::announcement.announcement').findMany({
        where: { isActive: true },
        orderBy: { id: 'desc' },
        limit: 20,
      });
      return { data: rows };
    },

    async adminGlobalSearch(ctx: Ctx) {
      await requireAdmin(ctx, strapi);
      const q = String(ctx.query.q || '').trim();
      if (!q) return { data: { users: [], courses: [], orders: [], tickets: [] } };
      const [users, courses, orders, tickets] = await Promise.all([
        strapi.db.query('plugin::users-permissions.user').findMany({
          where: {
            $or: [
              { email: { $containsi: q } },
              { name: { $containsi: q } },
            ],
          },
          limit: 10,
          populate: { role: true },
        }),
        strapi.db.query('api::course.course').findMany({
          where: { title: { $containsi: q } },
          limit: 10,
        }),
        strapi.db.query('api::order.order').findMany({
          where: { orderNumber: { $containsi: q } },
          limit: 10,
        }),
        strapi.db.query('api::support-ticket.support-ticket').findMany({
          where: {
            $or: [
              { ticketNumber: { $containsi: q } },
              { subject: { $containsi: q } },
            ],
          },
          limit: 10,
        }),
      ]);
      return {
        data: {
          users: users.map(sanitizeUser),
          courses,
          orders,
          tickets,
        },
      };
    },

    async adminReportsSummary(ctx: Ctx) {
      await requireAdmin(ctx, strapi);
      const [
        students,
        instructors,
        courses,
        enrollments,
        certificates,
        ordersPaid,
        ticketsOpen,
        lowStock,
        revenueRows,
      ] = await Promise.all([
        strapi.db.query('plugin::users-permissions.role').findOne({
          where: { name: ROLE_NAMES.STUDENT },
        }).then((r: any) =>
          r
            ? strapi.db.query('plugin::users-permissions.user').count({ where: { role: r.id } })
            : 0
        ),
        strapi.db.query('plugin::users-permissions.role').findOne({
          where: { name: ROLE_NAMES.INSTRUCTOR },
        }).then((r: any) =>
          r
            ? strapi.db.query('plugin::users-permissions.user').count({ where: { role: r.id } })
            : 0
        ),
        strapi.db.query('api::course.course').count(),
        strapi.db.query('api::enrollment.enrollment').count(),
        strapi.db.query('api::certificate.certificate').count(),
        strapi.db.query('api::order.order').count({ where: { status: 'PAID' } }).catch(() => 0),
        strapi.db
          .query('api::support-ticket.support-ticket')
          .count({ where: { status: 'OPEN' } })
          .catch(() => 0),
        strapi.db
          .query('api::inventory-item.inventory-item')
          .count({ where: { status: 'LOW_STOCK' } })
          .catch(() => 0),
        strapi.db.query('api::enrollment.enrollment').findMany({ select: ['amountPaid'] }),
      ]);
      const revenue = revenueRows.reduce(
        (s: number, r: any) => s + Number(r.amountPaid || 0),
        0
      );
      return {
        data: {
          students,
          instructors,
          courses,
          enrollments,
          certificates,
          ordersPaid,
          ticketsOpen,
          lowStock,
          revenue: Number(revenue.toFixed(2)),
        },
      };
    },

    async adminGetSettings(ctx: Ctx) {
      await requireStaff(ctx, strapi);
      const rows = await strapi.db.query('api::setting.setting').findMany();
      const map: Record<string, any> = {};
      for (const row of rows) map[row.key] = row.value;
      return {
        data: {
          organizationName: map.organizationName || 'CPS Academy',
          contactEmail: map.contactEmail || 'hello@cps.academy',
          currency: map.currency || 'USD',
          timezone: map.timezone || 'Asia/Dhaka',
          ...map,
        },
      };
    },

    async adminSaveSettings(ctx: Ctx) {
      const admin = await requireAdmin(ctx, strapi);
      const body = ctx.request.body || {};
      for (const [key, value] of Object.entries(body)) {
        const existing = await strapi.db.query('api::setting.setting').findOne({
          where: { key },
        });
        if (existing) {
          await strapi.db.query('api::setting.setting').update({
            where: { id: existing.id },
            data: { value },
          });
        } else {
          await strapi.db.query('api::setting.setting').create({
            data: { key, value, group: 'general' },
          });
        }
      }
      await audit(strapi, admin, 'settings.update', 'setting', 'general');
      return { data: { ok: true } };
    },
  };
}

type UidConfig = {
  uid: string;
  searchFields?: string[];
  populate?: any;
  prepareCreate?: (body: any, admin: any) => any;
  prepareUpdate?: (body: any, admin: any) => any;
};

const UID_MAP: Record<string, UidConfig> = {
  batches: {
    uid: 'api::batch.batch',
    searchFields: ['name'],
    populate: { course: true, instructor: true, students: true },
  },
  attendances: {
    uid: 'api::attendance.attendance',
    populate: { student: true, batch: true, course: true },
  },
  assignments: {
    uid: 'api::assignment.assignment',
    searchFields: ['title'],
    populate: { course: true, createdByUser: true },
    prepareCreate: (body, admin) => ({ ...body, createdByUser: admin.id }),
  },
  'question-bank': {
    uid: 'api::question-bank-item.question-bank-item',
    searchFields: ['question', 'tags'],
    populate: { course: true },
  },
  orders: {
    uid: 'api::order.order',
    searchFields: ['orderNumber', 'couponCode'],
    populate: { customer: true, course: true },
    prepareCreate: (body) => ({
      ...body,
      orderNumber: body.orderNumber || code('ORD'),
    }),
  },
  payments: {
    uid: 'api::payment.payment',
    searchFields: ['transactionId'],
    populate: { order: true, customer: true },
    prepareCreate: (body) => ({
      ...body,
      transactionId: body.transactionId || code('TXN'),
    }),
  },
  plans: {
    uid: 'api::plan.plan',
    searchFields: ['name', 'code'],
  },
  subscriptions: {
    uid: 'api::subscription.subscription',
    populate: { user: true, plan: true },
  },
  warehouses: {
    uid: 'api::warehouse.warehouse',
    searchFields: ['name', 'code'],
  },
  'inventory-items': {
    uid: 'api::inventory-item.inventory-item',
    searchFields: ['name', 'sku'],
    populate: { warehouse: true },
  },
  'stock-movements': {
    uid: 'api::stock-movement.stock-movement',
    populate: { item: true, warehouse: true, createdByUser: true },
  },
  announcements: {
    uid: 'api::announcement.announcement',
    searchFields: ['title'],
    populate: { course: true },
  },
  tickets: {
    uid: 'api::support-ticket.support-ticket',
    searchFields: ['ticketNumber', 'subject'],
    populate: { user: true, assignedTo: true },
    prepareCreate: (body, admin) => ({
      ...body,
      ticketNumber: body.ticketNumber || code('TKT'),
      user: body.user || admin.id,
    }),
  },
  reviews: {
    uid: 'api::review.review',
    populate: { student: true, course: true },
  },
  notifications: {
    uid: 'api::notification.notification',
    searchFields: ['title'],
    populate: { user: true },
  },
  'audit-logs': {
    uid: 'api::audit-log.audit-log',
    searchFields: ['action', 'entity'],
    populate: { user: true },
  },
};
