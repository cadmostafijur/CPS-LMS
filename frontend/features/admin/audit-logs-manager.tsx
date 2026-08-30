"use client";

import { useEffect, useState, useTransition } from "react";
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
import { toast } from "@/lib/notify";

type AuditRow = {
  id: number | string;
  action?: string | null;
  entity?: string | null;
  entityId?: string | null;
  meta?: { success?: boolean; error?: string } | null;
  createdAt?: string | null;
  user?: { email?: string | null; name?: string | null } | null;
};

function formatWhen(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function isFailed(row: AuditRow) {
  if (row.meta?.success === false) return true;
  return Boolean(row.action?.endsWith(".failed"));
}

export function AuditLogsManager() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("search", debounced);
        const res = await bffFetch<{ data: AuditRow[] }>(
          `/api/lms/admin/resources/audit-logs?${params.toString()}`
        );
        setItems(res.data || []);
        setLoadError(null);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to load audit logs";
        setLoadError(message);
        toast.error(message);
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Admin action history (read-only). Successful actions and failures are recorded here."
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search action, entity, or user…"
        className="sm:max-w-sm"
      />
      {loadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  {loadError
                    ? "Could not load audit logs."
                    : "No records yet. Admin actions (create, update, delete, enrollments, settings) will appear here."}
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((row) => {
              const failed = isFailed(row);
              return (
                <TableRow key={String(row.id)}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatWhen(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={failed ? "danger" : "success"}>
                      {failed ? "Failed" : "Success"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.action || "—"}</TableCell>
                  <TableCell>{row.entity || "—"}</TableCell>
                  <TableCell>{row.entityId || "—"}</TableCell>
                  <TableCell>
                    {row.user?.email || row.user?.name || "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {failed ? row.meta?.error || "Action failed" : "—"}
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
