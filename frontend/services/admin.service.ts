import { apiFetch } from "@/lib/api";
import type { ApiListResponse, RoleName, User } from "@/types";

export async function listUsers(
  params: {
    search?: string;
    role?: string;
    isActive?: string | boolean;
    page?: number;
    pageSize?: number;
  } = {},
  token?: string | null
) {
  return apiFetch<ApiListResponse<User[]>>(`/lms/admin/users`, {
    token,
    searchParams: {
      search: params.search,
      role: params.role,
      isActive:
        params.isActive === undefined || params.isActive === ""
          ? undefined
          : String(params.isActive),
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function updateUserRole(
  userId: string | number,
  role: RoleName,
  confirmSelfRoleChange = false,
  token?: string | null
) {
  return apiFetch<{ data: User }>(`/lms/admin/users/${userId}/role`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ role, confirmSelfRoleChange }),
  });
}

export async function updateUserStatus(
  userId: string | number,
  isActive: boolean,
  token?: string | null
) {
  return apiFetch<{ data: User }>(`/lms/admin/users/${userId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ isActive }),
  });
}
