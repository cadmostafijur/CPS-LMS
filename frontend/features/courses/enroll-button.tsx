"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bffFetch, ApiError } from "@/lib/api";

export function EnrollButton({
  courseId,
  enrolled,
  firstLessonId,
}: {
  courseId: string | number;
  enrolled: boolean;
  firstLessonId?: string | number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const learnHref = firstLessonId
    ? `/learn/${courseId}/${firstLessonId}`
    : `/student/my-courses`;

  if (isEnrolled) {
    return (
      <Button asChild>
        <Link href={learnHref}>Continue learning</Link>
      </Button>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await bffFetch(`/api/lms/enroll/${courseId}`, { method: "POST" });
            setIsEnrolled(true);
            toast.success("Enrolled successfully");
            router.refresh();
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              router.push(`/login?next=/courses`);
              return;
            }
            toast.error(
              err instanceof ApiError ? err.message : "Enrollment failed"
            );
          }
        });
      }}
    >
      {pending ? "Enrolling…" : "Enroll now"}
    </Button>
  );
}
