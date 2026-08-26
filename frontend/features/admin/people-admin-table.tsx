"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
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
      <PageHeader title={title} description={description} />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search name or email…"
        className="sm:max-w-sm"
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{role === "Student" ? "Enrollments" : "Courses"}</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No {role.toLowerCase()}s found.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((u) => (
              <TableRow key={String(u.id)}>
                <TableCell className="font-medium">
                  {u.name || u.username || "—"}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {role === "Student" ? u.enrollmentCount ?? 0 : u.courseCount ?? 0}
                </TableCell>
                <TableCell>
                  <Badge variant={u.blocked ? "danger" : "success"}>
                    {u.blocked ? "Banned" : "Active"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
