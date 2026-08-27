"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";

export function LiveAttendButton({
  sessionId,
}: {
  sessionId: string | number;
}) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function mark() {
    startTransition(async () => {
      try {
        await bffFetch(`/api/lms/live-sessions/${sessionId}/attend`, {
          method: "POST",
        });
        setDone(true);
        toast.success("Attendance recorded");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not mark attendance");
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending || done}
      onClick={mark}
    >
      {done ? "Attended" : pending ? "Saving…" : "I'm here"}
    </Button>
  );
}
