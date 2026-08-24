import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCourseProgress } from '../utils/progress';

describe('calculateCourseProgress', () => {
  it('returns 0 when total lessons is 0', () => {
    assert.equal(calculateCourseProgress(5, 0), 0);
  });

  it('calculates percentage', () => {
    assert.equal(calculateCourseProgress(1, 4), 25);
    assert.equal(calculateCourseProgress(2, 4), 50);
  });

  it('caps progress at 100', () => {
    assert.equal(calculateCourseProgress(10, 4), 100);
    assert.equal(calculateCourseProgress(4, 4), 100);
  });

  it('handles negative completed as zero contribution floor via Math.max', () => {
    assert.equal(calculateCourseProgress(-1, 4), 0);
  });
});
