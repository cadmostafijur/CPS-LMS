"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bffFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NotificationBell({ href }: { href: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffFetch<{
          data?: { isRead?: boolean }[];
          meta?: { unreadCount?: number };
        }>("/api/lms/notifications/me");
        if (cancelled) return;
        const count =
          res.meta?.unreadCount ??
          (res.data || []).filter((n) => !n.isRead).length;
        setUnread(Number(count) || 0);
      } catch {
        if (!cancelled) setUnread(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative shrink-0 text-navy hover:bg-navy/5"
      asChild
    >
      <Link href={href} aria-label="Notifications">
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
      </Link>
    </Button>
  );
}
