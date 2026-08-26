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

export function getRoleName(user: UserWithRole): RoleName | string | null {
  if (!user?.role) return null;
  const role = Array.isArray(user.role) ? user.role[0] : user.role;
  return role?.name ?? null;
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
  switch (role) {
    case ROLE_NAMES.ADMIN:
      return "/admin/dashboard";
    case ROLE_NAMES.CONTENT_MANAGER:
      return "/content-manager/dashboard";
    case ROLE_NAMES.INSTRUCTOR:
      return "/instructor/dashboard";
    case ROLE_NAMES.STUDENT:
      return "/student/dashboard";
    default:
      return "/student/dashboard";
  }
}

export function rolesAllowedForPath(pathname: string): RoleName[] | null {
  if (pathname.startsWith("/admin")) return [ROLE_NAMES.ADMIN];
  if (pathname.startsWith("/content-manager")) {
    return [ROLE_NAMES.ADMIN, ROLE_NAMES.CONTENT_MANAGER];
  }
  if (pathname.startsWith("/instructor")) {
    return [ROLE_NAMES.ADMIN, ROLE_NAMES.CONTENT_MANAGER, ROLE_NAMES.INSTRUCTOR];
  }
  if (pathname.startsWith("/student")) {
    return [
      ROLE_NAMES.ADMIN,
      ROLE_NAMES.CONTENT_MANAGER,
      ROLE_NAMES.INSTRUCTOR,
      ROLE_NAMES.STUDENT,
    ];
  }
  if (
    pathname.startsWith("/learn") ||
    pathname.startsWith("/quizzes") ||
    pathname.startsWith("/certificates") ||
    pathname === "/dashboard"
  ) {
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
