import { apiFetch } from "@/lib/api";
import type { ApiDataResponse, BlogPost, BlogStatus } from "@/types";

export async function listPublishedBlog() {
  return apiFetch<ApiDataResponse<BlogPost[]>>(`/lms/blog`, { auth: false });
}

export async function getBlogBySlug(slug: string) {
  return apiFetch<ApiDataResponse<BlogPost>>(`/lms/blog/${slug}`, {
    auth: false,
  });
}

export async function manageBlog(token?: string | null) {
  return apiFetch<ApiDataResponse<BlogPost[]>>(`/lms/blog/manage`, { token });
}

export async function createBlog(
  data: {
    title: string;
    body?: string;
    excerpt?: string;
    coverImageUrl?: string;
    status?: BlogStatus;
  },
  token?: string | null
) {
  return apiFetch<ApiDataResponse<BlogPost>>(`/lms/blog`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export async function updateBlog(
  id: string | number,
  data: Partial<{
    title: string;
    body: string;
    excerpt: string;
    coverImageUrl: string;
    status: BlogStatus;
    publishedAt: string | null;
  }>,
  token?: string | null
) {
  return apiFetch<ApiDataResponse<BlogPost>>(`/lms/blog/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export async function deleteBlog(id: string | number, token?: string | null) {
  return apiFetch<ApiDataResponse<{ id: number | string; documentId?: string }>>(
    `/lms/blog/${id}`,
    { method: "DELETE", token }
  );
}
