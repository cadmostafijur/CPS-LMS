"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { bffFetch, ApiError } from "@/lib/api";
import type { Coupon } from "@/types";

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENT" as Coupon["discountType"],
  discountValue: 10,
  isActive: true,
  maxUses: "" as string | number,
  minAmount: 0,
  expiresAt: "",
};

export function CouponsAdminManager() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: Coupon[] }>("/api/lms/admin/coupons");
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load coupons");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      isActive: coupon.isActive !== false,
      maxUses: coupon.maxUses ?? "",
      minAmount: coupon.minAmount ?? 0,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : "",
    });
    setOpen(true);
  }

  async function save() {
    const payload = {
      code: form.code,
      description: form.description || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      isActive: form.isActive,
      maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      minAmount: Number(form.minAmount || 0),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    try {
      if (editing) {
        await bffFetch(`/api/lms/admin/coupons/${editing.documentId || editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Coupon updated");
      } else {
        await bffFetch("/api/lms/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Coupon created");
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
        `/api/lms/admin/coupons/${deleteTarget.documentId || deleteTarget.id}`,
        { method: "DELETE" }
      );
      toast.success("Coupon deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Discount codes for paid course enrollments."
        actions={<Button onClick={openCreate}>Add coupon</Button>}
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No coupons yet.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((coupon) => (
              <TableRow key={String(coupon.id)}>
                <TableCell className="font-mono text-sm">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.discountType === "FIXED"
                    ? `$${coupon.discountValue}`
                    : `${coupon.discountValue}%`}
                </TableCell>
                <TableCell>
                  {coupon.usedCount ?? 0}
                  {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive !== false ? "success" : "secondary"}>
                    {coupon.isActive !== false ? "Active" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(coupon)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(coupon)}
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
            <DialogTitle>{editing ? "Edit coupon" : "New coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      discountType: v as Coupon["discountType"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percent</SelectItem>
                    <SelectItem value="FIXED">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discountValue: Number(e.target.value || 0) }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Max uses (optional)</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min amount</Label>
                <Input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minAmount: Number(e.target.value || 0) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expires at</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.isActive ? "active" : "off"}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "active" }))}
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
        title="Delete coupon?"
        description={`Remove ${deleteTarget?.code}? Existing enrollments keep their recorded discount.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => void remove()}
      />
    </div>
  );
}
