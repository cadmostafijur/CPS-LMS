"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { bffFetch, ApiError } from "@/lib/api";

type SearchResult = {
  users: any[];
  courses: any[];
  orders: any[];
  tickets: any[];
};

export function GlobalSearchAdmin() {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q);
  const [data, setData] = useState<SearchResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!debounced.trim()) {
      setData(null);
      return;
    }
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: SearchResult }>(
          `/api/lms/admin/search?q=${encodeURIComponent(debounced)}`
        );
        setData(res.data);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Search failed");
      }
    });
  }, [debounced]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        description="Find users, courses, orders, and support tickets."
      />
      <SearchInput
        value={q}
        onChange={setQ}
        placeholder="Type at least 2 characters…"
        className="sm:max-w-md"
      />
      {pending ? <p className="text-sm text-muted-foreground">Searching…</p> : null}
      {data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ResultBlock
            title="Users"
            items={data.users.map((u) => ({
              id: u.id,
              label: u.name || u.username || u.email,
              sub: u.email,
              href: "/admin/users",
            }))}
          />
          <ResultBlock
            title="Courses"
            items={data.courses.map((c) => ({
              id: c.id,
              label: c.title,
              sub: c.slug,
              href: `/admin/courses/${c.documentId || c.id}`,
            }))}
          />
          <ResultBlock
            title="Orders"
            items={data.orders.map((o) => ({
              id: o.id,
              label: o.orderNumber,
              sub: o.status,
              href: "/admin/orders",
            }))}
          />
          <ResultBlock
            title="Tickets"
            items={data.tickets.map((t) => ({
              id: t.id,
              label: t.subject,
              sub: t.ticketNumber,
              href: "/admin/tickets",
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}

function ResultBlock({
  title,
  items,
}: {
  title: string;
  items: { id: any; label: string; sub?: string; href: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={String(item.id)}>
              <Link href={item.href} className="block rounded-lg px-2 py-1.5 hover:bg-orange/5">
                <div className="text-sm font-medium">{item.label}</div>
                {item.sub ? (
                  <div className="text-xs text-muted-foreground">{item.sub}</div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
