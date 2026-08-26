import { apiFetch } from "@/lib/api";
import type {
  ApiDataResponse,
  ApiListResponse,
  Certificate,
  RoleName,
  User,
} from "@/types";

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

export async function createUser(
  payload: {
    name: string;
    email: string;
    password: string;
    role: RoleName;
    username?: string;
  },
  token?: string | null
) {
  return apiFetch<{ data: User }>(`/lms/admin/users`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(
  userId: string | number,
  token?: string | null
) {
  return apiFetch<{ data: { id: string | number; deleted: boolean } }>(
    `/lms/admin/users/${userId}`,
    {
      method: "DELETE",
      token,
    }
  );
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

export async function listAdminCertificates(
  params: { search?: string; page?: number; pageSize?: number } = {},
  token?: string | null
) {
  return apiFetch<ApiListResponse<Certificate[]>>(`/lms/admin/certificates`, {
    token,
    searchParams: {
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function listAdminEnrollments(
  params: { search?: string; page?: number; pageSize?: number } = {},
  token?: string | null
) {
  return apiFetch<
    ApiListResponse<
      Array<{
        id: number | string;
        documentId?: string;
        enrolledAt?: string;
        completedAt?: string | null;
        progress?: { percentage: number };
        student?: User | null;
        course?: { id: number | string; title?: string; slug?: string } | null;
      }>
    >
  >(`/lms/admin/enrollments`, {
    token,
    searchParams: {
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function getMyCertificates(token?: string | null) {
  return apiFetch<ApiDataResponse<Certificate[]>>(`/lms/certificates/me`, {
    token,
  });
}

export async function getCertificate(
  id: string | number,
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Certificate>>(`/lms/certificates/${id}`, {
    token,
  });
}
