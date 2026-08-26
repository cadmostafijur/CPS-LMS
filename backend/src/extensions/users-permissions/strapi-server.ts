/**
 * Strapi 5: auth controller is a factory — wrap it, don't assign register directly.
 * Public registration always creates a Student.
 */
export default (plugin: any) => {
  const originalAuthFactory = plugin.controllers.auth;

  plugin.controllers.auth = ({ strapi }: { strapi: any }) => {
    const controller =
      typeof originalAuthFactory === 'function'
        ? originalAuthFactory({ strapi })
        : { ...originalAuthFactory };

    controller.register = async (ctx: any) => {
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
        where: { type: 'student' },
      });
      if (!studentRole) {
        return ctx.badRequest('Student role is not configured');
      }

      const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { $or: [{ email }, { username }] },
      });
      if (existing) {
        return ctx.badRequest('Email or username is already taken');
      }

      let user = await strapi.plugin('users-permissions').service('user').add({
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

      user = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          role: studentRole.id,
          name,
          confirmed: true,
          isActive: true,
        },
        populate: { role: true },
      });

      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      ctx.send({
        jwt,
        user: {
          id: user.id,
          documentId: user.documentId,
          name: user.name,
          email: user.email,
          role: user.role
            ? {
                id: user.role.id,
                documentId: user.role.documentId,
                name: user.role.name,
                type: user.role.type,
              }
            : null,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive,
        },
      });
    };

    return controller;
  };

  return plugin;
};
