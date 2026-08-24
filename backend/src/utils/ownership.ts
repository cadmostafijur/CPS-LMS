import { errors } from '@strapi/utils';
import {
  isAdmin,
  isContentManager,
  isInstructor,
  type UserWithRole,
} from './roles';

const { ForbiddenError } = errors;

type RelUser = {
  id?: number | string;
  documentId?: string;
} | null;

type CourseLike = {
  instructor?: RelUser;
  createdByUser?: RelUser;
  [key: string]: unknown;
} | null;

type BlogLike = {
  author?: RelUser;
  [key: string]: unknown;
} | null;

function sameUser(a: RelUser | UserWithRole, b: RelUser | UserWithRole): boolean {
  if (!a || !b) return false;
  if (a.id != null && b.id != null && String(a.id) === String(b.id)) return true;
  if (a.documentId && b.documentId && a.documentId === b.documentId) return true;
  return false;
}

export function canManageCourse(user: UserWithRole, course: CourseLike): boolean {
  if (!user || !course) return false;
  if (isAdmin(user) || isContentManager(user)) return true;
  if (isInstructor(user)) {
    return sameUser(user, course.instructor) || sameUser(user, course.createdByUser);
  }
  return false;
}

export function assertCourseOwnerOrManager(user: UserWithRole, course: CourseLike) {
  if (!canManageCourse(user, course)) {
    throw new ForbiddenError('You do not have permission to manage this course');
  }
}

export function canManageBlog(user: UserWithRole, _post?: BlogLike): boolean {
  if (!user) return false;
  // Admin and Content Manager can manage all blog posts per permission matrix
  return isAdmin(user) || isContentManager(user);
}
