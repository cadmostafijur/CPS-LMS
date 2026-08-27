import type { Lesson, ModuleGate } from "@/types";

function moduleKey(mod: { id?: string | number; documentId?: string } | null | undefined) {
  if (!mod) return "";
  return String(mod.documentId || mod.id);
}

/** First incomplete lesson (prefer unlocked modules), else first lesson. */
export function continueLessonHref(
  courseId: string | number,
  lessons: Lesson[] | undefined | null,
  completedIds?: Array<string | number> | null,
  moduleGates?: ModuleGate[] | null
): string | null {
  const sorted = [...(lessons || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!sorted.length) return null;

  const done = new Set((completedIds || []).map(String));
  const unlocked = new Set(
    (moduleGates || [])
      .filter((g) => g.unlocked)
      .map((g) => String(g.moduleDocumentId || g.moduleId))
  );
  const hasGates = (moduleGates || []).length > 0;

  const isUnlocked = (lesson: Lesson) => {
    if (!hasGates || !lesson.module) return true;
    const key = moduleKey(lesson.module);
    return !key || unlocked.has(key);
  };

  const next = sorted.find((l) => {
    const id = String(l.documentId || l.id);
    return isUnlocked(l) && !done.has(id);
  });
  const target = next || sorted.find(isUnlocked) || sorted[0];
  return `/learn/${courseId}/${target.documentId || target.id}`;
}
