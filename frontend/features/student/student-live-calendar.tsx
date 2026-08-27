"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { LiveAttendButton } from "@/features/courses/live-attend-button";

type LiveRow = {
  id: string | number;
  documentId?: string;
  title: string;
  startsAt?: string;
  meetingUrl?: string;
  attended?: boolean;
  course?: { title?: string; slug?: string } | null;
};

export function StudentLiveCalendar() {
  const [items, setItems] = useState<LiveRow[]>([]);
  const [pending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: LiveRow[] }>("/api/lms/live-calendar");
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load calendar");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  if (!pending && items.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No live classes yet"
        description="When instructors schedule sessions on your enrolled courses, they appear here."
        action={
          <Button asChild>
            <Link href="/student/my-courses">My courses</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => {
        const id = s.documentId || s.id;
        const start = s.startsAt ? new Date(s.startsAt) : null;
        return (
          <li
            key={String(id)}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="font-semibold text-navy">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {s.course?.title || "Course"}
                {start ? ` · ${start.toLocaleString()}` : ""}
                {s.attended ? " · attended" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {s.meetingUrl ? (
                <Button asChild size="sm">
                  <a href={s.meetingUrl} target="_blank" rel="noreferrer">
                    Join
                  </a>
                </Button>
              ) : null}
              {!s.attended ? <LiveAttendButton sessionId={id} /> : null}
              {s.course?.slug ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/courses/${s.course.slug}#live`}>Course</Link>
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
