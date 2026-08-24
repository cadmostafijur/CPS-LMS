export function calculateCourseProgress(completedCount: number, totalLessons: number): number {
  if (!totalLessons || totalLessons <= 0) return 0;
  const raw = (Math.max(0, completedCount) / totalLessons) * 100;
  return Math.min(100, Math.round(raw * 100) / 100);
}
