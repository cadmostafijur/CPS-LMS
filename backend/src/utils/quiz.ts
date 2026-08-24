export type QuizOptionInput = {
  id?: number | string;
  documentId?: string;
  text?: string;
  isCorrect?: boolean;
};

export type QuizQuestionInput = {
  id?: number | string;
  documentId?: string;
  question?: string;
  order?: number;
  options?: QuizOptionInput[];
};

export type AnswerSubmission = {
  questionId: number | string;
  selectedOptionId: number | string;
};

export type GradedAnswer = {
  questionId: number | string;
  selectedOptionId: number | string;
  isCorrect: boolean;
};

export type GradeResult = {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: GradedAnswer[];
};

function matchesId(
  entity: { id?: number | string; documentId?: string } | null | undefined,
  id: number | string
): boolean {
  if (!entity) return false;
  return String(entity.id) === String(id) || entity.documentId === String(id);
}

/**
 * Strip isCorrect from options before sending quiz to students.
 */
export function sanitizeQuizForTake(quiz: {
  questions?: QuizQuestionInput[];
  [key: string]: unknown;
}) {
  const questions = (quiz.questions || []).map((q) => ({
    id: q.id,
    documentId: q.documentId,
    question: q.question,
    order: q.order,
    options: (q.options || []).map((o) => ({
      id: o.id,
      documentId: o.documentId,
      text: o.text,
    })),
  }));

  const { questions: _q, ...rest } = quiz;
  return { ...rest, questions };
}

/**
 * Server-side grading: validates option belongs to question and question to quiz.
 */
export function gradeQuizAnswers(
  questions: QuizQuestionInput[],
  submissions: AnswerSubmission[]
): GradeResult {
  const totalQuestions = questions.length;
  const answers: GradedAnswer[] = [];
  let score = 0;

  for (const submission of submissions) {
    const question = questions.find((q) => matchesId(q, submission.questionId));
    if (!question) {
      throw new Error(`Question ${submission.questionId} does not belong to this quiz`);
    }

    const option = (question.options || []).find((o) =>
      matchesId(o, submission.selectedOptionId)
    );
    if (!option) {
      throw new Error(
        `Option ${submission.selectedOptionId} does not belong to question ${submission.questionId}`
      );
    }

    const isCorrect = Boolean(option.isCorrect);
    if (isCorrect) score += 1;

    answers.push({
      questionId: submission.questionId,
      selectedOptionId: submission.selectedOptionId,
      isCorrect,
    });
  }

  const percentage =
    totalQuestions > 0
      ? Math.min(100, Math.round((score / totalQuestions) * 10000) / 100)
      : 0;

  return { score, totalQuestions, percentage, answers };
}
