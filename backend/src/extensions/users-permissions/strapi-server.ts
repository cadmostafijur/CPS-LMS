/**
 * Public registration always creates a Student. Role from the client is ignored.
 */
export default (plugin: any) => {
  plugin.controllers.auth.register = async (ctx: any) => {
    const body = ctx.request.body || {};
    const username = String(body.username || body.data?.username || '').trim();
    const email = String(body.email || body.data?.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || body.data?.password || '');
    const name = String(body.name || body.data?.name || username || email).trim();

    if (!username || !email || !password) {
      return ctx.badRequest('Username, email, and password are required');
    }

    if (password.length < 6) {
      return ctx.badRequest('Password must be at least 6 characters');
    }

    const studentRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: 'Student' },
    });

    if (!studentRole) {
      return ctx.badRequest('Student role is not configured');
    }

    const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: {
        $or: [{ email }, { username }],
      },
    });

    if (existing) {
      return ctx.badRequest('Email or username is already taken');
    }

    const user = await strapi.plugin('users-permissions').service('user').add({
      username,
      email,
      password,
      name,
      confirmed: true,
      blocked: false,
      isActive: true,
      provider: 'local',
      role: studentRole.id,
    });

    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

    const full = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: { role: true },
    });

    const role = full?.role
      ? {
          id: full.role.id,
          documentId: full.role.documentId,
          name: full.role.name,
          type: full.role.type,
        }
      : null;

    ctx.send({
      jwt,
      user: {
        id: full.id,
        documentId: full.documentId,
        name: full.name,
        email: full.email,
        role,
        avatarUrl: full.avatarUrl,
        isActive: full.isActive,
      },
    });
  };

  return plugin;
};
