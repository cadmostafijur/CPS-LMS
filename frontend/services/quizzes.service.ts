import { apiFetch } from "@/lib/api";
import type { ApiDataResponse, Quiz, QuizAttempt } from "@/types";

export type QuizQuestionInput = {
  question: string;
  order?: number;
  options: Array<{ text: string; isCorrect?: boolean }>;
};

export async function takeQuiz(quizId: string | number, token?: string | null) {
  return apiFetch<ApiDataResponse<Quiz>>(`/lms/quizzes/${quizId}/take`, {
    token,
  });
}

export async function submitQuiz(
  quizId: string | number,
  answers: Array<{ questionId: string | number; selectedOptionId: string | number }>,
  token?: string | null
) {
  return apiFetch<ApiDataResponse<QuizAttempt>>(`/lms/quizzes/${quizId}/submit`, {
    method: "POST",
    token,
    body: JSON.stringify({ answers }),
  });
}

export async function getQuizAttempts(
  quizId: string | number,
  token?: string | null
) {
  return apiFetch<ApiDataResponse<QuizAttempt[]>>(
    `/lms/quizzes/${quizId}/attempts`,
    { token }
  );
}

export async function createQuiz(
  courseId: string | number,
  data: {
    title: string;
    description?: string;
    questions?: QuizQuestionInput[];
  },
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Quiz>>(`/lms/courses/${courseId}/quizzes`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export async function updateQuiz(
  id: string | number,
  data: {
    title?: string;
    description?: string;
    questions?: QuizQuestionInput[];
  },
  token?: string | null
) {
  return apiFetch<ApiDataResponse<Quiz>>(`/lms/quizzes/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export async function deleteQuiz(id: string | number, token?: string | null) {
  return apiFetch<ApiDataResponse<{ id: number | string; documentId?: string }>>(
    `/lms/quizzes/${id}`,
    { method: "DELETE", token }
  );
}
