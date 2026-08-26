import type { Core } from '@strapi/strapi';
import { ROLE_NAMES } from '../utils/roles';

type RoleDef = { name: string; type: string; description: string };

const LMS_ROLES: RoleDef[] = [
  { name: ROLE_NAMES.ADMIN, type: 'lms-admin', description: 'LMS administrator' },
  {
    name: ROLE_NAMES.CONTENT_MANAGER,
    type: 'content-manager',
    description: 'Manages content and blog',
  },
  { name: ROLE_NAMES.INSTRUCTOR, type: 'instructor', description: 'Creates and teaches courses' },
  { name: ROLE_NAMES.STUDENT, type: 'student', description: 'Enrolls and learns' },
];

/** Actions enabled per role for custom LMS API + auth */
const ROLE_ACTIONS: Record<string, string[]> = {
  [ROLE_NAMES.ADMIN]: [
    'api::lms.lms.me',
    'api::lms.lms.enroll',
    'api::lms.lms.myCourses',
    'api::lms.lms.completeLesson',
    'api::lms.lms.courseProgress',
    'api::lms.lms.getCoursePlayer',
    'api::lms.lms.takeQuiz',
    'api::lms.lms.submitQuiz',
    'api::lms.lms.quizAttempts',
    'api::lms.lms.studentDashboard',
    'api::lms.lms.instructorDashboard',
    'api::lms.lms.contentManagerDashboard',
    'api::lms.lms.adminDashboard',
    'api::lms.lms.adminListUsers',
    'api::lms.lms.adminUpdateUserRole',
    'api::lms.lms.adminUpdateUserStatus',
    'api::lms.lms.listCatalog',
    'api::lms.lms.getCatalogCourse',
    'api::lms.lms.createCourse',
    'api::lms.lms.updateCourse',
    'api::lms.lms.deleteCourse',
    'api::lms.lms.createLesson',
    'api::lms.lms.updateLesson',
    'api::lms.lms.deleteLesson',
    'api::lms.lms.createQuiz',
    'api::lms.lms.updateQuiz',
    'api::lms.lms.deleteQuiz',
    'api::lms.lms.listBlog',
    'api::lms.lms.getBlogBySlug',
    'api::lms.lms.manageBlog',
    'api::lms.lms.createBlog',
    'api::lms.lms.updateBlog',
    'api::lms.lms.deleteBlog',
    'plugin::users-permissions.auth.callback',
    'plugin::users-permissions.auth.connect',
    'plugin::users-permissions.auth.emailConfirmation',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.resetPassword',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.user.me',
  ],
  [ROLE_NAMES.CONTENT_MANAGER]: [
    'api::lms.lms.me',
    'api::lms.lms.enroll',
    'api::lms.lms.myCourses',
    'api::lms.lms.completeLesson',
    'api::lms.lms.courseProgress',
    'api::lms.lms.getCoursePlayer',
    'api::lms.lms.takeQuiz',
    'api::lms.lms.submitQuiz',
    'api::lms.lms.quizAttempts',
    'api::lms.lms.studentDashboard',
    'api::lms.lms.instructorDashboard',
    'api::lms.lms.contentManagerDashboard',
    'api::lms.lms.listCatalog',
    'api::lms.lms.getCatalogCourse',
    'api::lms.lms.createCourse',
    'api::lms.lms.updateCourse',
    'api::lms.lms.deleteCourse',
    'api::lms.lms.createLesson',
    'api::lms.lms.updateLesson',
    'api::lms.lms.deleteLesson',
    'api::lms.lms.createQuiz',
    'api::lms.lms.updateQuiz',
    'api::lms.lms.deleteQuiz',
    'api::lms.lms.listBlog',
    'api::lms.lms.getBlogBySlug',
    'api::lms.lms.manageBlog',
    'api::lms.lms.createBlog',
    'api::lms.lms.updateBlog',
    'api::lms.lms.deleteBlog',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.user.me',
  ],
  [ROLE_NAMES.INSTRUCTOR]: [
    'api::lms.lms.me',
    'api::lms.lms.enroll',
    'api::lms.lms.myCourses',
    'api::lms.lms.completeLesson',
    'api::lms.lms.courseProgress',
    'api::lms.lms.getCoursePlayer',
    'api::lms.lms.takeQuiz',
    'api::lms.lms.submitQuiz',
    'api::lms.lms.quizAttempts',
    'api::lms.lms.studentDashboard',
    'api::lms.lms.instructorDashboard',
    'api::lms.lms.listCatalog',
    'api::lms.lms.getCatalogCourse',
    'api::lms.lms.createCourse',
    'api::lms.lms.updateCourse',
    'api::lms.lms.deleteCourse',
    'api::lms.lms.createLesson',
    'api::lms.lms.updateLesson',
    'api::lms.lms.deleteLesson',
    'api::lms.lms.createQuiz',
    'api::lms.lms.updateQuiz',
    'api::lms.lms.deleteQuiz',
    'api::lms.lms.listBlog',
    'api::lms.lms.getBlogBySlug',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.user.me',
  ],
  [ROLE_NAMES.STUDENT]: [
    'api::lms.lms.me',
    'api::lms.lms.enroll',
    'api::lms.lms.myCourses',
    'api::lms.lms.completeLesson',
    'api::lms.lms.courseProgress',
    'api::lms.lms.getCoursePlayer',
    'api::lms.lms.takeQuiz',
    'api::lms.lms.submitQuiz',
    'api::lms.lms.quizAttempts',
    'api::lms.lms.studentDashboard',
    'api::lms.lms.listCatalog',
    'api::lms.lms.getCatalogCourse',
    'api::lms.lms.listBlog',
    'api::lms.lms.getBlogBySlug',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.user.me',
  ],
};

const PUBLIC_ACTIONS = [
  'api::lms.lms.listCatalog',
  'api::lms.lms.getCatalogCourse',
  'api::lms.lms.listBlog',
  'api::lms.lms.getBlogBySlug',
  'plugin::users-permissions.auth.callback',
  'plugin::users-permissions.auth.connect',
  'plugin::users-permissions.auth.emailConfirmation',
  'plugin::users-permissions.auth.forgotPassword',
  'plugin::users-permissions.auth.resetPassword',
  'plugin::users-permissions.auth.register',
  'plugin::users-permissions.auth.sendEmailConfirmation',
];

async function ensurePermission(strapi: Core.Strapi, roleId: number, action: string) {
  const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
    where: { action, role: roleId },
  });
  if (!existing) {
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: roleId },
    });
  }
}

export async function ensureLmsRoles(strapi: Core.Strapi) {
  const roleMap: Record<string, any> = {};

  for (const def of LMS_ROLES) {
    let role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: def.name },
    });
    if (!role) {
      role = await strapi.db.query('plugin::users-permissions.role').create({
        data: {
          name: def.name,
          description: def.description,
          type: def.type,
        },
      });
      strapi.log.info(`[LMS] Created role: ${def.name}`);
    }
    roleMap[def.name] = role;
  }

  // Public role permissions
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (publicRole) {
    for (const action of PUBLIC_ACTIONS) {
      await ensurePermission(strapi, publicRole.id, action);
    }
  }

  // Also keep default authenticated role usable for me/auth
  const authenticated = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });
  if (authenticated) {
    for (const action of ROLE_ACTIONS[ROLE_NAMES.STUDENT]) {
      await ensurePermission(strapi, authenticated.id, action);
    }
  }

  for (const [roleName, actions] of Object.entries(ROLE_ACTIONS)) {
    const role = roleMap[roleName];
    if (!role) continue;
    for (const action of actions) {
      await ensurePermission(strapi, role.id, action);
    }
  }

  return roleMap;
}
