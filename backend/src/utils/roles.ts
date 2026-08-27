export const ROLE_NAMES = {
  ADMIN: 'Admin',
  CONTENT_MANAGER: 'Content Manager',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export type RoleLike = {
  name?: string | null;
  type?: string | null;
} | null;

export type UserWithRole = {
  id?: number | string;
  documentId?: string;
  role?: RoleLike | RoleLike[];
  [key: string]: unknown;
} | null | undefined;

const ROLE_ALIASES: Record<string, RoleName> = {
  admin: ROLE_NAMES.ADMIN,
  'lms-admin': ROLE_NAMES.ADMIN,
  'content manager': ROLE_NAMES.CONTENT_MANAGER,
  'content-manager': ROLE_NAMES.CONTENT_MANAGER,
  instructor: ROLE_NAMES.INSTRUCTOR,
  student: ROLE_NAMES.STUDENT,
  authenticated: ROLE_NAMES.STUDENT,
};

export function normalizeRoleName(raw: string | null | undefined): RoleName | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if ((Object.values(ROLE_NAMES) as string[]).includes(value)) {
    return value as RoleName;
  }
  return ROLE_ALIASES[value.toLowerCase()] ?? null;
}

function normalizeRole(user: UserWithRole): RoleName | null {
  if (!user?.role) return null;
  const role = Array.isArray(user.role) ? user.role[0] : user.role;
  return normalizeRoleName(role?.name || role?.type || null);
}

export function getRoleName(user: UserWithRole): RoleName | null {
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
