"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "@/lib/notify";
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
import type { Banner } from "@/types";

const emptyForm = {
  title: "",
  subtitle: "",
  ctaLabel: "Learn more",
  linkUrl: "/courses",
  imageUrl: "",
  placement: "BOTH" as Banner["placement"],
  isActive: true,
  sortOrder: 0,
};

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export function BannersAdminManager() {
  const [items, setItems] = useState<Banner[]>([]);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: Banner[] }>("/api/lms/admin/banners");
        setItems(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load banners");
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

  function openEdit(banner: Banner) {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      ctaLabel: banner.ctaLabel || "",
      linkUrl: banner.linkUrl || "",
      imageUrl: banner.imageUrl || "",
      placement: banner.placement || "BOTH",
      isActive: banner.isActive !== false,
      sortOrder: banner.sortOrder ?? 0,
    });
    setOpen(true);
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 1.5 MB. Compress it or use a URL instead.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
      toast.success("Image attached — save the banner to publish it.");
    } catch {
      toast.error("Could not read that image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editing) {
        await bffFetch(`/api/lms/admin/banners/${editing.documentId || editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        toast.success("Banner updated");
      } else {
        await bffFetch("/api/lms/admin/banners", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Banner created");
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
        `/api/lms/admin/banners/${deleteTarget.documentId || deleteTarget.id}`,
        { method: "DELETE" }
      );
      toast.success("Banner deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <PageHeader
          title="Banners"
          description="Promotional banners for the homepage and course catalog."
          actions={<Button onClick={openCreate}>Add banner</Button>}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface/80 hover:bg-surface/80">
              <TableHead>Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No banners yet. Add one with an uploaded image or image URL.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((banner) => (
              <TableRow key={String(banner.id)}>
                <TableCell>
                  {banner.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.imageUrl}
                      alt=""
                      className="h-12 w-20 rounded-md object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="flex h-12 w-20 items-center justify-center rounded-md bg-surface text-[10px] text-muted-foreground ring-1 ring-border">
                      No image
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-navy">{banner.title}</TableCell>
                <TableCell>{banner.placement}</TableCell>
                <TableCell>
                  <Badge variant={banner.isActive !== false ? "success" : "secondary"}>
                    {banner.isActive !== false ? "Active" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell>{banner.sortOrder ?? 0}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(banner)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(banner)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>CTA label</Label>
                <Input
                  value={form.ctaLabel}
                  onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-dashed border-border bg-surface/60 p-4">
              <Label>Banner image</Label>
              <p className="text-xs text-muted-foreground">
                Upload a file or paste an image URL. Max upload size 1.5 MB.
              </p>
              {form.imageUrl ? (
                <div className="relative overflow-hidden rounded-lg ring-1 ring-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Banner preview"
                    className="h-36 w-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute right-2 top-2 gap-1"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void onPickImage(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? "Reading…" : "Upload image"}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Or image URL</Label>
                <Input
                  placeholder="https://…"
                  value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Placement</Label>
                <Select
                  value={form.placement}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, placement: v as Banner["placement"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME">Home</SelectItem>
                    <SelectItem value="CATALOG">Catalog</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: Number(e.target.value || 0) }))
                  }
                />
              </div>
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
            <Button onClick={() => void save()}>Save banner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete banner?"
        description="This removes the banner from the site immediately."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void remove()}
      />
    </div>
  );
}
