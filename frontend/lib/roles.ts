export const ROLE_NAMES = {
  ADMIN: "Admin",
  CONTENT_MANAGER: "Content Manager",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export type RoleLike = {
  id?: number | string;
  documentId?: string;
  name?: string | null;
  type?: string | null;
} | null;

export type UserWithRole = {
  id?: number | string;
  role?: RoleLike | RoleLike[];
} | null | undefined;

const ROLE_ALIASES: Record<string, RoleName> = {
  admin: ROLE_NAMES.ADMIN,
  "lms-admin": ROLE_NAMES.ADMIN,
  "content manager": ROLE_NAMES.CONTENT_MANAGER,
  "content-manager": ROLE_NAMES.CONTENT_MANAGER,
  instructor: ROLE_NAMES.INSTRUCTOR,
  student: ROLE_NAMES.STUDENT,
  authenticated: ROLE_NAMES.STUDENT,
};

export function normalizeRoleName(raw: string | null | undefined): RoleName | null {
  if (!raw) return null;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value).trim();
  } catch {
    /* keep raw */
  }
  if ((Object.values(ROLE_NAMES) as string[]).includes(value)) {
    return value as RoleName;
  }
  return ROLE_ALIASES[value.toLowerCase()] ?? null;
}

export function getRoleName(user: UserWithRole): RoleName | string | null {
  if (!user?.role) return null;
  const role = Array.isArray(user.role) ? user.role[0] : user.role;
  return normalizeRoleName(role?.name || role?.type || null);
}

export function hasRole(user: UserWithRole, roles: string[]): boolean {
  const name = getRoleName(user);
  return name ? roles.includes(name) : false;
}

export function isAdmin(user: UserWithRole) {
  return getRoleName(user) === ROLE_NAMES.ADMIN;
}

export function isContentManager(user: UserWithRole) {
  return getRoleName(user) === ROLE_NAMES.CONTENT_MANAGER;
}

export function isInstructor(user: UserWithRole) {
  return getRoleName(user) === ROLE_NAMES.INSTRUCTOR;
}

export function isStudent(user: UserWithRole) {
  return getRoleName(user) === ROLE_NAMES.STUDENT;
}

export function dashboardPathForRole(role: string | null | undefined): string {
  switch (normalizeRoleName(role)) {
    case ROLE_NAMES.ADMIN:
      return "/admin/dashboard";
    case ROLE_NAMES.CONTENT_MANAGER:
      return "/content-manager/dashboard";
    case ROLE_NAMES.INSTRUCTOR:
      return "/instructor/dashboard";
    case ROLE_NAMES.STUDENT:
      return "/student/dashboard";
    default:
      return "/profile";
  }
}

export function notificationsPathForRole(
  role: string | null | undefined
): string | null {
  switch (normalizeRoleName(role)) {
    case ROLE_NAMES.ADMIN:
      return "/admin/inbox";
    case ROLE_NAMES.STUDENT:
      return "/student/notifications";
    case ROLE_NAMES.INSTRUCTOR:
      return "/instructor/notifications";
    case ROLE_NAMES.CONTENT_MANAGER:
      return "/content-manager/notifications";
    default:
      return null;
  }
}

export function pathAllowedForRole(
  pathname: string,
  role: string | null | undefined
): boolean {
  const allowed = rolesAllowedForPath(pathname);
  if (!allowed) return true;
  const normalized = normalizeRoleName(role);
  return Boolean(normalized && allowed.includes(normalized));
}

export function rolesAllowedForPath(pathname: string): RoleName[] | null {
  if (pathname.startsWith("/admin")) return [ROLE_NAMES.ADMIN];
  if (pathname.startsWith("/content-manager")) {
    return [ROLE_NAMES.ADMIN, ROLE_NAMES.CONTENT_MANAGER];
  }
  if (pathname.startsWith("/instructor")) {
    return [ROLE_NAMES.ADMIN, ROLE_NAMES.CONTENT_MANAGER, ROLE_NAMES.INSTRUCTOR];
  }
  // Student learning surfaces — matrix: Student only
  if (
    pathname.startsWith("/student") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/quizzes")
  ) {
    return [ROLE_NAMES.STUDENT];
  }
  if (pathname.startsWith("/certificates")) {
    return [ROLE_NAMES.STUDENT, ROLE_NAMES.ADMIN];
  }
  if (pathname.startsWith("/profile") || pathname === "/dashboard") {
    return [
      ROLE_NAMES.ADMIN,
      ROLE_NAMES.CONTENT_MANAGER,
      ROLE_NAMES.INSTRUCTOR,
      ROLE_NAMES.STUDENT,
    ];
  }
  return null;
}

export const ALL_ROLES: RoleName[] = [
  ROLE_NAMES.ADMIN,
  ROLE_NAMES.CONTENT_MANAGER,
  ROLE_NAMES.INSTRUCTOR,
  ROLE_NAMES.STUDENT,
];
