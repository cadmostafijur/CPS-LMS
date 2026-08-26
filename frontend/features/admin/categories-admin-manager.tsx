"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bffFetch, ApiError } from "@/lib/api";
import type { CourseCategory } from "@/types";

const empty = { name: "", description: "", isActive: true };

export function CategoriesAdminManager() {
  const [items, setItems] = useState<CourseCategory[]>([]);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseCategory | null>(null);
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<CourseCategory | null>(null);

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: CourseCategory[] }>(
          "/api/lms/admin/categories"
        );
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      if (editing) {
        await bffFetch(
          `/api/lms/admin/categories/${editing.documentId || editing.id}`,
          { method: "PUT", body: JSON.stringify(form) }
        );
        toast.success("Category updated");
      } else {
        await bffFetch("/api/lms/admin/categories", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Category created");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await bffFetch(
        `/api/lms/admin/categories/${deleteTarget.documentId || deleteTarget.id}`,
        { method: "DELETE" }
      );
      toast.success("Category deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize courses for catalog browsing and filters."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setOpen(true);
            }}
          >
            Add category
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((cat) => (
              <TableRow key={String(cat.id)}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                <TableCell>{cat.courseCount ?? 0}</TableCell>
                <TableCell>
                  <Badge variant={cat.isActive !== false ? "success" : "secondary"}>
                    {cat.isActive !== false ? "Active" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(cat);
                      setForm({
                        name: cat.name,
                        description: cat.description || "",
                        isActive: cat.isActive !== false,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.isActive ? "active" : "off"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v === "active" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete category?"
        description="Courses in this category will become uncategorized."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void remove()}
      />
    </div>
  );
}
