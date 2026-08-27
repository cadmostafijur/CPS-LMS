"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { bffFetch, ApiError } from "@/lib/api";

export type FieldDef =
  | { key: string; label: string; type: "text" | "number" | "textarea" | "datetime" | "boolean" }
  | { key: string; label: string; type: "select"; options: string[] }
  | {
      key: string;
      label: string;
      type: "relation";
      /** Resource endpoint under /api/lms/... that returns { data: [{ id, documentId, title|name }] } */
      optionsPath: string;
      labelKey?: string;
    };

type ColumnDef = {
  key: string;
  label: string;
  render?: (row: any) => ReactNode;
};

type Props = {
  title: string;
  description: string;
  uid: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  createDefaults?: Record<string, any>;
  readOnly?: boolean;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
};

function cellValue(row: any, key: string) {
  const parts = key.split(".");
  let cur = row;
  for (const p of parts) cur = cur?.[p];
  if (cur == null) return "—";
  if (typeof cur === "object") {
    return cur.name || cur.title || cur.email || cur.code || cur.orderNumber || String(cur.id);
  }
  if (typeof cur === "boolean") return cur ? "Yes" : "No";
  return String(cur);
}

export function AdminResourceManager({
  title,
  description,
  uid,
  columns,
  fields,
  createDefaults = {},
  readOnly = false,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
}: Props) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<any[]>([]);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [relationOptions, setRelationOptions] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});

  function load() {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("search", debounced);
        const res = await bffFetch<{ data: any[] }>(
          `/api/lms/admin/resources/${uid}?${params.toString()}`
        );
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : `Failed to load ${title}`);
      }
    });
  }

  async function loadRelationOptions() {
    const relationFields = fields.filter((f) => f.type === "relation");
    if (relationFields.length === 0) return;
    const next: Record<string, Array<{ value: string; label: string }>> = {};
    await Promise.all(
      relationFields.map(async (f) => {
        if (f.type !== "relation") return;
        try {
          const res = await bffFetch<{ data: any[] }>(f.optionsPath);
          next[f.key] = (res.data || []).map((row) => ({
            value: String(row.documentId || row.id),
            label: String(
              row[f.labelKey || "title"] ||
                row.name ||
                row.title ||
                row.email ||
                row.documentId ||
                row.id
            ),
          }));
        } catch {
          next[f.key] = [];
        }
      })
    );
    setRelationOptions(next);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, uid]);

  useEffect(() => {
    void loadRelationOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  function openCreate() {
    setEditing(null);
    setForm({ ...createDefaults });
    setOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    const next: Record<string, any> = {};
    for (const f of fields) {
      let v = row[f.key];
      if (f.type === "datetime" && v) v = String(v).slice(0, 16);
      if (f.type === "boolean") v = Boolean(v);
      if (f.type === "relation") {
        v = v?.documentId || v?.id || v || "";
      }
      next[f.key] = v ?? (f.type === "boolean" ? false : "");
    }
    setForm(next);
    setOpen(true);
  }

  async function save() {
    const payload: Record<string, any> = {};
    for (const f of fields) {
      let v = form[f.key];
      if (f.type === "number") v = v === "" || v == null ? null : Number(v);
      if (f.type === "datetime") v = v ? new Date(v).toISOString() : null;
      if (f.type === "boolean") v = Boolean(v);
      if (f.type === "text" || f.type === "textarea") v = v === "" ? null : v;
      if (f.type === "relation") v = v === "" || v == null ? null : v;
      payload[f.key] = v;
    }
    try {
      const id = editing?.documentId || editing?.id;
      if (editing) {
        await bffFetch(`/api/lms/admin/resources/${uid}/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Updated");
      } else {
        await bffFetch(`/api/lms/admin/resources/${uid}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Created");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget.documentId || deleteTarget.id;
      await bffFetch(`/api/lms/admin/resources/${uid}/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          !readOnly && allowCreate ? (
            <Button onClick={openCreate}>Add new</Button>
          ) : undefined
        }
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search…"
        className="sm:max-w-sm"
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              {!readOnly ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (readOnly ? 0 : 1)}
                  className="text-muted-foreground"
                >
                  No records yet.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((row) => (
              <TableRow key={String(row.documentId || row.id)}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    {c.render ? c.render(row) : cellValue(row, c.key)}
                  </TableCell>
                ))}
                {!readOnly ? (
                  <TableCell className="space-x-2 text-right">
                    {allowEdit ? (
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                    ) : null}
                    {allowDelete ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(row)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    rows={3}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={String(form[f.key] ?? "")}
                    onValueChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "boolean" ? (
                  <Select
                    value={form[f.key] ? "true" : "false"}
                    onValueChange={(v) => setForm((s) => ({ ...s, [f.key]: v === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : f.type === "relation" ? (
                  <Select
                    value={String(form[f.key] ?? "")}
                    onValueChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(relationOptions[f.key] || []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : f.type === "datetime" ? "datetime-local" : "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete record?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <Badge variant="secondary">—</Badge>;
  const ok = ["OPEN", "PAID", "SUCCESS", "ISSUED", "IN_STOCK", "ACTIVE", "PUBLISHED", "RESOLVED"].includes(
    value
  );
  const warn = ["PENDING", "LOW_STOCK", "DRAFT", "WAITING", "IN_PROGRESS"].includes(value);
  return (
    <Badge variant={ok ? "success" : warn ? "secondary" : "danger"}>{value}</Badge>
  );
}
