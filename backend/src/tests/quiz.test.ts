import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gradeQuizAnswers, sanitizeQuizForTake } from '../utils/quiz';

describe('quiz helpers', () => {
  const questions = [
    {
      id: 1,
      question: 'Q1',
      options: [
        { id: 10, text: 'A', isCorrect: true },
        { id: 11, text: 'B', isCorrect: false },
      ],
    },
    {
      id: 2,
      documentId: 'q2',
      question: 'Q2',
      options: [
        { id: 20, text: 'C', isCorrect: false },
        { id: 21, documentId: 'opt-d', text: 'D', isCorrect: true },
      ],
    },
  ];

  it('sanitizeQuizForTake strips isCorrect', () => {
    const sanitized = sanitizeQuizForTake({ id: 99, title: 'Quiz', questions });
    assert.equal(sanitized.title, 'Quiz');
    for (const q of sanitized.questions) {
      for (const o of q.options || []) {
        assert.equal('isCorrect' in o, false);
      }
    }
  });

  it('grades correct answers', () => {
    const result = gradeQuizAnswers(questions, [
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 'q2', selectedOptionId: 'opt-d' },
    ]);
    assert.equal(result.score, 2);
    assert.equal(result.totalQuestions, 2);
    assert.equal(result.percentage, 100);
  });

  it('grades mixed answers', () => {
    const result = gradeQuizAnswers(questions, [
      { questionId: 1, selectedOptionId: 11 },
      { questionId: 2, selectedOptionId: 21 },
    ]);
    assert.equal(result.score, 1);
    assert.equal(result.percentage, 50);
  });

  it('rejects option that does not belong to question', () => {
    assert.throws(
      () =>
        gradeQuizAnswers(questions, [{ questionId: 1, selectedOptionId: 21 }]),
      /does not belong to question/
    );
  });

  it('rejects question that does not belong to quiz', () => {
    assert.throws(
      () =>
        gradeQuizAnswers(questions, [{ questionId: 999, selectedOptionId: 10 }]),
      /does not belong to this quiz/
    );
  });
});
