"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";

type Msg = {
  id: string | number;
  body: string;
  createdAt?: string;
  sender?: { id?: string | number; name?: string | null; email?: string | null } | null;
  recipient?: { id?: string | number; name?: string | null; email?: string | null } | null;
};

type Contact = {
  id: string | number;
  documentId?: string;
  name?: string | null;
  email?: string | null;
  label: string;
};

export function StudentMessagesPanel({ myUserId }: { myUserId: string | number }) {
  const [items, setItems] = useState<Msg[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: Msg[] }>("/api/lms/messages");
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load messages");
      }
    });
  }

  useEffect(() => {
    load();
    // Prefill instructors from enrolled / taught courses when possible
    (async () => {
      try {
        const mine = await bffFetch<{ data: any[] }>("/api/lms/my-courses");
        const map = new Map<string, Contact>();
        for (const row of mine.data || []) {
          const course = row.course || row;
          const inst = course.instructor;
          if (!inst) continue;
          const id = String(inst.documentId || inst.id);
          if (!id || id === String(myUserId)) continue;
          map.set(id, {
            id: inst.documentId || inst.id,
            name: inst.name,
            email: inst.email,
            label: `${inst.name || inst.email || "Instructor"} · ${course.title || "Course"}`,
          });
        }
        setContacts([...map.values()]);
      } catch {
        setContacts([]);
      }
    })();
  }, [myUserId]);

  function send() {
    if (!recipientId.trim() || !body.trim()) {
      toast.error("Recipient and message required");
      return;
    }
    startTransition(async () => {
      try {
        await bffFetch("/api/lms/messages", {
          method: "POST",
          body: JSON.stringify({ recipientId, body }),
        });
        setBody("");
        toast.success("Message sent");
        load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Send failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        {contacts.length > 0 ? (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          >
            <option value="">Select instructor / contact…</option>
            {contacts.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            placeholder="Recipient user id or documentId"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          />
        )}
        {contacts.length > 0 ? (
          <Input
            placeholder="Or paste another user id…"
            value={
              contacts.some((c) => String(c.id) === recipientId) ? "" : recipientId
            }
            onChange={(e) => setRecipientId(e.target.value)}
          />
        ) : null}
        <Textarea
          placeholder="Write your message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="button" disabled={pending} onClick={send}>
          Send
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Start a conversation with your instructor."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((m) => {
            const fromMe = String(m.sender?.id) === String(myUserId);
            const other = fromMe ? m.recipient : m.sender;
            return (
              <li
                key={String(m.id)}
                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm shadow-sm"
              >
                <p className="text-xs text-muted-foreground">
                  {fromMe ? "You → " : ""}
                  {other?.name || other?.email || "User"}
                  {m.createdAt
                    ? ` · ${new Date(m.createdAt).toLocaleString()}`
                    : ""}
                </p>
                <p className="mt-1 text-navy">{m.body}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
