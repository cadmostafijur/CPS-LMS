"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { bffFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { StudentNotification } from "@/features/student/student-notifications-panel";

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function NotificationMenu({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bffFetch<{
        data?: StudentNotification[];
        meta?: { unreadCount?: number };
      }>("/api/lms/notifications/me");
      const list = res.data || [];
      setItems(list);
      setUnread(
        Number(
          res.meta?.unreadCount ?? list.filter((n) => !n.isRead).length
        ) || 0
      );
    } catch {
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const preview = items.slice(0, 5);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative shrink-0 text-navy hover:bg-navy/5", className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center",
                "rounded-full bg-orange px-1 text-[10px] font-bold leading-none text-white"
              )}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold text-navy">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You’re all caught up"}
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : preview.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet. You’ll see enrollments, assignments, quizzes, and
              announcements here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {preview.map((n) => {
                const key = String(n.documentId || n.id);
                const content = (
                  <>
                    <div className="flex items-start gap-2">
                      {!n.isRead ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange" />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-navy">
                          {n.title}
                        </p>
                        {n.body ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatWhen(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </>
                );

                return (
                  <li key={key}>
                    {n.linkUrl ? (
                      <Link
                        href={n.linkUrl}
                        className="block px-4 py-3 transition-colors hover:bg-surface"
                        onClick={() => setOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" className="h-9 w-full justify-center text-orange">
            <Link href={href} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
