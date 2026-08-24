import { apiFetch } from "@/lib/api";
import type {
  ApiDataResponse,
  Course,
  CourseProgress,
  Enrollment,
} from "@/types";

export async function listPublishedCourses(search?: string) {
  const res = await apiFetch<ApiDataResponse<Course[]>>(`/lms/catalog`, {
    auth: false,
    searchParams: search ? { search } : undefined,
  });
  return res.data ?? [];
}

export async function getCourseBySlug(slug: string) {
  const res = await apiFetch<ApiDataResponse<Course>>(`/lms/catalog/${slug}`, {
    auth: false,
  });
  return res.data ?? null;
}

export async function getCourseById(id: string | number, token?: string | null) {
  const res = await apiFetch<ApiDataResponse<Course>>(
    `/lms/courses/${id}/player`,
    { token }
  );
  return res.data ?? null;
}

export async function enrollInCourse(courseId: string | number, token?: string | null) {
  return apiFetch<ApiDataResponse<Enrollment>>(`/lms/enroll/${courseId}`, {
    method: "POST",
    token,
  });
}

export async function getMyCourses(token?: string | null) {
  return apiFetch<ApiDataResponse<Enrollment[]>>(`/lms/my-courses`, { token });
}

export async function getCourseProgress(
  courseId: string | number,
  token?: string | null
) {
  return apiFetch<ApiDataResponse<CourseProgress>>(
    `/lms/courses/${courseId}/progress`,
    { token }
  );
}

export async function createCourse(
  data: Partial<Course> & { title: string; instructorId?: string | number },
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Course>>(`/lms/courses`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export async function updateCourse(
  id: string | number,
  data: Partial<Course> & { instructorId?: string | number },
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Course>>(`/lms/courses/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(id: string | number, token?: string | null) {
  return apiFetch<ApiDataResponse<{ id: number | string; documentId?: string }>>(
    `/lms/courses/${id}`,
    { method: "DELETE", token }
  );
}
