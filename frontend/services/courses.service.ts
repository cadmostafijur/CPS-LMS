import { apiFetch, unwrapStrapiEntity, unwrapStrapiList } from "@/lib/api";
import type {
  ApiDataResponse,
  Course,
  CourseProgress,
  Enrollment,
} from "@/types";

export async function listPublishedCourses(search?: string) {
  const params: Record<string, string> = {
    "filters[status][$eq]": "PUBLISHED",
    populate: "*",
    "sort[0]": "createdAt:desc",
  };
  if (search) {
    params["filters[$or][0][title][$containsi]"] = search;
    params["filters[$or][1][shortDescription][$containsi]"] = search;
  }

  const res = await apiFetch<{ data: unknown[] }>(`/courses`, {
    auth: false,
    searchParams: params,
  });

  return unwrapStrapiList<Course>(res as never) as Course[];
}

export async function getCourseBySlug(slug: string) {
  const res = await apiFetch<{ data: unknown[] }>(`/courses`, {
    auth: false,
    searchParams: {
      "filters[slug][$eq]": slug,
      populate: "*",
    },
  });
  const list = unwrapStrapiList<Course>(res as never) as Course[];
  return list[0] ?? null;
}

export async function getCourseById(id: string | number, token?: string | null) {
  const res = await apiFetch<{ data: unknown }>(`/courses/${id}`, {
    token,
    searchParams: {
      populate: "*",
    },
  });
  return unwrapStrapiEntity<Course>(res as never) as Course | null;
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
