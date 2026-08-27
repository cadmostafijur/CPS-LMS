"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

export function CourseReviewsPanel({
  courseId,
  canReview,
  initialReviews = [],
}: {
  courseId: string | number;
  canReview: boolean;
  initialReviews?: Array<{
    id: string | number;
    rating: number;
    body?: string | null;
    student?: { name?: string | null } | null;
  }>;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: (typeof reviews)[0] }>(
          `/api/lms/courses/${courseId}/reviews`,
          { method: "POST", body: JSON.stringify({ rating, body }) }
        );
        setReviews((prev) => {
          const rest = prev.filter(
            (r) => String(r.id) !== String(res.data.id)
          );
          return [res.data, ...rest];
        });
        setBody("");
        toast.success("Review saved");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not save review");
      }
    });
  }

  return (
    <section id="reviews" className="mt-10 scroll-mt-24">
      <h2 className="font-display text-xl font-semibold text-navy">Reviews</h2>
      {canReview ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
                aria-label={`${n} stars`}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    n <= rating ? "fill-orange text-orange" : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience…"
          />
          <Button type="button" disabled={pending} onClick={submit}>
            Submit review
          </Button>
        </div>
      ) : null}
      <ul className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <li className="text-sm text-muted-foreground">No reviews yet.</li>
        ) : (
          reviews.map((r) => (
            <li
              key={String(r.id)}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
            >
              <p className="font-medium text-navy">
                {r.student?.name || "Student"} · {r.rating}/5
              </p>
              {r.body ? (
                <p className="mt-1 text-muted-foreground">{r.body}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
