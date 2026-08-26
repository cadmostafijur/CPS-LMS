"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { bffFetch, ApiError } from "@/lib/api";
import type { User } from "@/types";

type Person = User & {
  enrollmentCount?: number;
  courseCount?: number;
  phone?: string | null;
};

export function PeopleAdminTable({
  role,
  title,
  description,
}: {
  role: "Student" | "Instructor";
  title: string;
  description: string;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<Person[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ role });
        if (debounced) params.set("search", debounced);
        const res = await bffFetch<{ data: Person[] }>(
          `/api/lms/admin/people?${params.toString()}`
        );
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load people");
      }
    });
  }, [debounced, role]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <PageHeader title={title} description={description} />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name or email…"
            className="sm:max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            {pending ? "Loading…" : `${items.length} ${role.toLowerCase()}${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface/80 hover:bg-surface/80">
              <TableHead>Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{role === "Student" ? "Enrollments" : "Courses"}</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No {role.toLowerCase()}s found.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((u) => {
              const name = u.name || u.username || "—";
              const initials = name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <TableRow key={String(u.id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-orange/15 text-xs font-semibold text-orange">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-navy">{name}</p>
                        {u.username ? (
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="font-display text-base font-semibold">
                    {role === "Student" ? u.enrollmentCount ?? 0 : u.courseCount ?? 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.blocked ? "danger" : "success"}>
                      {u.blocked ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
