export const ROLE_NAMES = {
  ADMIN: 'Admin',
  CONTENT_MANAGER: 'Content Manager',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export type RoleLike = {
  name?: string | null;
} | null;

export type UserWithRole = {
  id?: number | string;
  documentId?: string;
  role?: RoleLike | RoleLike[];
  [key: string]: unknown;
} | null | undefined;

function normalizeRole(user: UserWithRole): string | null {
  if (!user?.role) return null;
  const role = Array.isArray(user.role) ? user.role[0] : user.role;
  return role?.name ?? null;
}

export function getRoleName(user: UserWithRole): string | null {
  return normalizeRole(user);
}

export function hasAnyRole(user: UserWithRole, roles: string[]): boolean {
  const name = getRoleName(user);
  if (!name) return false;
  return roles.includes(name);
}

export function isAdmin(user: UserWithRole): boolean {
  return getRoleName(user) === ROLE_NAMES.ADMIN;
}

export function isContentManager(user: UserWithRole): boolean {
  return getRoleName(user) === ROLE_NAMES.CONTENT_MANAGER;
}

export function isInstructor(user: UserWithRole): boolean {
  return getRoleName(user) === ROLE_NAMES.INSTRUCTOR;
}

export function isStudent(user: UserWithRole): boolean {
  return getRoleName(user) === ROLE_NAMES.STUDENT;
}
