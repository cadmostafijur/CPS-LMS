import { apiFetch } from "@/lib/api";
import type { ApiDataResponse, CourseProgressSummary, Lesson } from "@/types";

export async function createLesson(
  courseId: string | number,
  data: Partial<Lesson> & { title: string },
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Lesson>>(`/lms/courses/${courseId}/lessons`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export async function updateLesson(
  id: string | number,
  data: Partial<Lesson>,
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Lesson>>(`/lms/lessons/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export async function deleteLesson(id: string | number, token?: string | null) {
  return apiFetch<ApiDataResponse<{ id: number | string; documentId?: string }>>(
    `/lms/lessons/${id}`,
    { method: "DELETE", token }
  );
}

export async function completeLesson(
  lessonId: string | number,
  token?: string | null
) {
  return apiFetch<
    ApiDataResponse<{
      progress: unknown;
      courseProgress: CourseProgressSummary;
    }>
  >(`/lms/lessons/${lessonId}/complete`, {
    method: "POST",
    token,
  });
}
