type RoleLike = {
  id?: number | string;
  documentId?: string;
  name?: string;
  type?: string;
} | null;

export type SanitizedUser = {
  id: number | string;
  documentId?: string;
  name?: string | null;
  email?: string | null;
  role?: RoleLike;
  avatarUrl?: string | null;
  isActive?: boolean | null;
};

export function sanitizeUser(user: Record<string, unknown> | null | undefined): SanitizedUser | null {
  if (!user) return null;

  const role = user.role as RoleLike | RoleLike[] | undefined;
  const normalizedRole = Array.isArray(role) ? role[0] ?? null : role ?? null;

  return {
    id: user.id as number | string,
    documentId: user.documentId as string | undefined,
    name: (user.name as string | null | undefined) ?? null,
    email: (user.email as string | null | undefined) ?? null,
    role: normalizedRole
      ? {
          id: normalizedRole.id,
          documentId: normalizedRole.documentId,
          name: normalizedRole.name,
          type: normalizedRole.type,
        }
      : null,
    avatarUrl: (user.avatarUrl as string | null | undefined) ?? null,
    isActive: (user.isActive as boolean | null | undefined) ?? null,
  };
}
