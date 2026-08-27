"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";

export function InstructorCourseExtras({
  courseId,
}: {
  courseId: string | number;
}) {
  const [pending, startTransition] = useTransition();
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [liveTitle, setLiveTitle] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [liveAt, setLiveAt] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);

  function loadAnalytics() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: any }>(
          `/api/lms/courses/${courseId}/analytics`
        );
        setAnalytics(res.data);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Analytics failed");
      }
    });
  }

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  function postAnnouncement() {
    startTransition(async () => {
      try {
        await bffFetch(`/api/lms/courses/${courseId}/announcements`, {
          method: "POST",
          body: JSON.stringify({ title: annTitle, content: annBody }),
        });
        setAnnTitle("");
        setAnnBody("");
        toast.success("Announcement sent to enrolled students");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed");
      }
    });
  }

  function createLive() {
    startTransition(async () => {
      try {
        await bffFetch(`/api/lms/courses/${courseId}/live-sessions`, {
          method: "POST",
          body: JSON.stringify({
            title: liveTitle,
            meetingUrl: liveUrl,
            startsAt: liveAt ? new Date(liveAt).toISOString() : undefined,
          }),
        });
        setLiveTitle("");
        setLiveUrl("");
        setLiveAt("");
        toast.success("Live class scheduled");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-navy">
          Announce to enrolled students
        </h3>
        <div className="mt-3 space-y-2">
          <Label>Title</Label>
          <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
          <Label>Message</Label>
          <Textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} />
          <Button type="button" disabled={pending} onClick={postAnnouncement}>
            Send announcement
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-navy">
          Schedule live class
        </h3>
        <div className="mt-3 space-y-2">
          <Label>Title</Label>
          <Input value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} />
          <Label>Meeting URL (Zoom / Meet)</Label>
          <Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
          <Label>Starts at</Label>
          <Input
            type="datetime-local"
            value={liveAt}
            onChange={(e) => setLiveAt(e.target.value)}
          />
          <Button type="button" disabled={pending} onClick={createLive}>
            Create live session
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <h3 className="mr-auto font-display text-lg font-semibold text-navy">
            Course analytics
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={loadAnalytics}>
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              startTransition(async () => {
                try {
                  const res = await bffFetch<{
                    data: { filename: string; csv: string };
                  }>(`/api/lms/courses/${courseId}/grades.csv`);
                  const blob = new Blob([res.data.csv], {
                    type: "text/csv;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = res.data.filename || "grades.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  toast.error(
                    err instanceof ApiError ? err.message : "CSV export failed"
                  );
                }
              });
            }}
          >
            Export grades CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              startTransition(async () => {
                try {
                  const res = await bffFetch<{
                    data: { documentId?: string; id?: string | number };
                  }>(`/api/lms/courses/${courseId}/clone`, { method: "POST" });
                  toast.success("Course cloned as draft");
                  window.location.href = `/instructor/courses/${res.data.documentId || res.data.id}/edit`;
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "Clone failed");
                }
              });
            }}
          >
            Clone course
          </Button>
        </div>
        {analytics ? (
          <div className="mt-4 space-y-4 text-sm">
            <p>
              Enrollments:{" "}
              <span className="font-semibold text-navy">
                {analytics.enrollmentCount}
              </span>
            </p>
            {analytics.difficultyHint ? (
              <p className="text-muted-foreground">{analytics.difficultyHint}</p>
            ) : null}
            <div>
              <p className="font-medium text-navy">Lesson completion / drop-off</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {(analytics.lessonStats || []).map((l: any) => (
                  <li key={String(l.lessonId)}>
                    {l.title}: {l.completionRate}% completed
                    {l.dropOffRate != null ? ` · ${l.dropOffRate}% drop-off` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-navy">Quiz averages</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {(analytics.quizStats || []).map((q: any) => (
                  <li key={String(q.quizId)}>
                    {q.title}:{" "}
                    {q.averagePercent != null ? `${q.averagePercent}%` : "—"} (
                    {q.attemptCount} attempts
                    {q.passRate != null ? ` · ${q.passRate}% pass` : ""})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        )}
      </section>
    </div>
  );
}
