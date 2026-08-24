import { apiFetch } from "@/lib/api";
import type {
  AdminDashboard,
  ApiDataResponse,
  ContentManagerDashboard,
  InstructorDashboard,
  StudentDashboard,
} from "@/types";

export async function getStudentDashboard(token?: string | null) {
  return apiFetch<ApiDataResponse<StudentDashboard>>(`/lms/dashboard/student`, {
    token,
  });
}

export async function getInstructorDashboard(token?: string | null) {
  return apiFetch<ApiDataResponse<InstructorDashboard>>(
    `/lms/dashboard/instructor`,
    { token }
  );
}

export async function getContentManagerDashboard(token?: string | null) {
  return apiFetch<ApiDataResponse<ContentManagerDashboard>>(
    `/lms/dashboard/content-manager`,
    { token }
  );
}

export async function getAdminDashboard(token?: string | null) {
  return apiFetch<ApiDataResponse<AdminDashboard>>(`/lms/dashboard/admin`, {
    token,
  });
}
