"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";

export function WishlistRemindButton() {
  const [pending, startTransition] = useTransition();

  function remind() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: { reminded: number } }>(
          "/api/lms/wishlist/remind",
          { method: "POST" }
        );
        toast.success(
          res.data.reminded
            ? `Sent ${res.data.reminded} reminder(s) to Notifications`
            : "No wishlist items to remind"
        );
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Reminders failed");
      }
    });
  }

  return (
    <Button type="button" variant="outline" disabled={pending} onClick={remind}>
      {pending ? "Sending…" : "Send reminders"}
    </Button>
  );
}
