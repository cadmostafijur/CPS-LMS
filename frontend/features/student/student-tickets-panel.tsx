"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { formatDate } from "@/lib/utils";
import type { SupportTicket } from "@/types";

export function StudentTicketsPanel({ initialItems = [] }: { initialItems?: SupportTicket[] }) {
  const [items, setItems] = useState(initialItems);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: SupportTicket }>("/api/lms/tickets/me", {
          method: "POST",
          body: JSON.stringify({ subject, body }),
        });
        setItems((prev) => [res.data, ...prev]);
        setSubject("");
        setBody("");
        toast.success("Ticket submitted");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not create ticket");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="t-sub">Subject</Label>
          <Input
            id="t-sub"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Payment issue, course access…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-body">Details</Label>
          <Textarea
            id="t-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the problem"
          />
        </div>
        <Button type="button" disabled={pending} onClick={create}>
          Submit ticket
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No tickets yet"
          description="Open a ticket if you need help from support."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li
              key={String(t.documentId || t.id)}
              className="rounded-2xl border border-border bg-white p-4 text-sm shadow-sm"
            >
              <p className="font-display font-semibold text-navy">
                {t.ticketNumber} · {t.subject}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.status} · {t.priority} · {formatDate(t.createdAt)}
              </p>
              {t.body ? (
                <p className="mt-2 text-muted-foreground">{t.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
