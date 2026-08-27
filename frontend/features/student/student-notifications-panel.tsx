"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

export type StudentNotification = {
  id: number | string;
  documentId?: string;
  title: string;
  body?: string | null;
  type?: string | null;
  isRead?: boolean;
  linkUrl?: string | null;
  createdAt?: string;
};

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function StudentNotificationsPanel({
  initialItems,
  initialUnread,
}: {
  initialItems: StudentNotification[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [pending, startTransition] = useTransition();

  function markOne(id: string | number) {
    startTransition(async () => {
      try {
        await bffFetch(`/api/lms/notifications/${id}/read`, { method: "POST" });
        setItems((prev) =>
          prev.map((n) =>
            String(n.id) === String(id) || String(n.documentId) === String(id)
              ? { ...n, isRead: true }
              : n
          )
        );
        setUnread((c) => Math.max(0, c - 1));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not mark as read");
      }
    });
  }

  function markAll() {
    startTransition(async () => {
      try {
        await bffFetch(`/api/lms/notifications/read-all`, { method: "POST" });
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
        toast.success("All notifications marked as read");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not update");
      }
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="You’ll get alerts when you enroll, finish quizzes, or earn certificates."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? (
            <>
              <span className="font-semibold text-orange">{unread}</span> unread
            </>
          ) : (
            "You’re all caught up"
          )}
        </p>
        {unread > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={markAll}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {items.map((n) => {
          const key = String(n.documentId || n.id);
          const unreadItem = !n.isRead;
          return (
            <li
              key={key}
              className={cn(
                "rounded-2xl border bg-white p-4 shadow-sm transition-colors",
                unreadItem ? "border-orange/30 bg-orange/[0.03]" : "border-border/80"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {unreadItem ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-orange" />
                    ) : null}
                    <p className="font-display text-sm font-semibold text-navy">
                      {n.title}
                    </p>
                    {n.type ? (
                      <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {n.type}
                      </span>
                    ) : null}
                  </div>
                  {n.body ? (
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatWhen(n.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {n.linkUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={n.linkUrl}>
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                  {unreadItem ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => markOne(n.documentId || n.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
