"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

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

type CourseRow = {
  course?: {
    title?: string | null;
    instructor?: {
      documentId?: string;
      id?: string | number;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
  title?: string | null;
  instructor?: {
    documentId?: string;
    id?: string | number;
    name?: string | null;
    email?: string | null;
  } | null;
};

export function StudentMessagesPanel({ myUserId }: { myUserId: string | number }) {
  const [items, setItems] = useState<Msg[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [customRecipientId, setCustomRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement>(null);

  const effectiveRecipientId = recipientId || customRecipientId;

  const selectedContact = useMemo(
    () => contacts.find((c) => String(c.id) === recipientId),
    [contacts, recipientId]
  );

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
    (async () => {
      try {
        const mine = await bffFetch<{ data: CourseRow[] }>("/api/lms/my-courses");
        const map = new Map<string, Contact>();
        for (const row of mine.data || []) {
          const course = row.course || row;
          const inst = course.instructor;
          if (!inst) continue;
          const id = String(inst.documentId || inst.id);
          if (!id || id === String(myUserId)) continue;
          map.set(id, {
            id: inst.documentId || inst.id || id,
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

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [items.length]);

  function send() {
    if (!effectiveRecipientId.trim() || !body.trim()) {
      toast.error("Choose a recipient and write a message");
      return;
    }
    startTransition(async () => {
      try {
        await bffFetch("/api/lms/messages", {
          method: "POST",
          body: JSON.stringify({ recipientId: effectiveRecipientId, body }),
        });
        setBody("");
        toast.success("Message sent");
        load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Send failed");
      }
    });
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border/80 bg-surface/40 px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <Label htmlFor="message-recipient">To</Label>
            {contacts.length > 0 ? (
              <Select
                value={recipientId || undefined}
                onValueChange={(value) => {
                  setRecipientId(value);
                  setCustomRecipientId("");
                }}
              >
                <SelectTrigger id="message-recipient" className="bg-white">
                  <SelectValue placeholder="Select instructor or contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="message-recipient"
                placeholder="Recipient user id"
                value={customRecipientId}
                onChange={(e) => setCustomRecipientId(e.target.value)}
              />
            )}
          </div>

          {contacts.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="message-custom-recipient">Or user id</Label>
              <Input
                id="message-custom-recipient"
                placeholder="Paste another user id (optional)"
                value={customRecipientId}
                onChange={(e) => {
                  setCustomRecipientId(e.target.value);
                  if (e.target.value) setRecipientId("");
                }}
              />
            </div>
          ) : null}
        </div>

        {selectedContact ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Messaging{" "}
            <span className="font-medium text-navy">
              {selectedContact.name || selectedContact.email || "contact"}
            </span>
          </p>
        ) : null}
      </div>

      <div
        ref={threadRef}
        className="min-h-[280px] max-h-[min(52vh,520px)] overflow-y-auto bg-[linear-gradient(180deg,#fafbfc_0%,#ffffff_100%)] px-4 py-5 sm:px-5"
      >
        {items.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Start a conversation with your instructor."
            className="border-0 bg-transparent py-10 shadow-none"
          />
        ) : (
          <ul className="space-y-3">
            {items.map((m) => {
              const fromMe = String(m.sender?.id) === String(myUserId);
              const other = fromMe ? m.recipient : m.sender;
              return (
                <li
                  key={String(m.id)}
                  className={cn("flex", fromMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                      fromMe
                        ? "rounded-br-md bg-orange text-white"
                        : "rounded-bl-md border border-border bg-white text-navy"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-medium",
                        fromMe ? "text-white/80" : "text-muted-foreground"
                      )}
                    >
                      {fromMe ? "You" : other?.name || other?.email || "User"}
                      {m.createdAt
                        ? ` · ${new Date(m.createdAt).toLocaleString()}`
                        : ""}
                    </p>
                    <p className={cn("mt-1 whitespace-pre-wrap", fromMe ? "text-white" : "")}>
                      {m.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border/80 bg-white px-4 py-4 sm:px-5">
        <Label htmlFor="message-body" className="sr-only">
          Message
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Textarea
            id="message-body"
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onComposerKeyDown}
            rows={3}
            className="min-h-[88px] resize-none bg-surface/30 sm:min-h-[72px] sm:flex-1"
          />
          <Button
            type="button"
            disabled={pending || !body.trim() || !effectiveRecipientId.trim()}
            onClick={send}
            className="shrink-0 gap-2 sm:min-w-[120px]"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
}
