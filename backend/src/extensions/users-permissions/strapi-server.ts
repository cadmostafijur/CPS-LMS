/**
 * Force public registration to Student role; never accept role from body.
 */
export default (plugin: any) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx: any) => {
    const body = ctx.request.body || {};

    // Strip any role / elevated fields from the request
    delete body.role;
    delete body.roles;
    if (body.data) {
      delete body.data.role;
      delete body.data.roles;
    }

    const studentRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: 'Student' },
    });

    if (!studentRole) {
      return ctx.badRequest('Student role is not configured');
    }

    // Normalize payload for users-permissions register
    const payload = body.data ? { ...body, data: { ...body.data } } : { ...body };

    if (payload.data) {
      payload.data.role = studentRole.id;
      payload.data.isActive = true;
      if (!payload.data.name && payload.data.username) {
        payload.data.name = payload.data.username;
      }
    } else {
      payload.role = studentRole.id;
      payload.isActive = true;
      if (!payload.name && payload.username) {
        payload.name = payload.username;
      }
    }

    ctx.request.body = payload;

    // Prefer calling original after sanitizing; then enforce role/isActive post-create
    await originalRegister(ctx);

    // Harden: if a user was created, ensure Student + isActive
    try {
      const email = payload.email || payload.data?.email;
      if (email) {
        const created = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { email: String(email).toLowerCase() },
        });
        if (created) {
          await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: created.id },
            data: {
              role: studentRole.id,
              isActive: true,
            },
          });
        }
      }
    } catch {
      // non-fatal — registration response already sent
    }
  };

  return plugin;
};
