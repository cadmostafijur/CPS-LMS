"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { bffFetch, ApiError } from "@/lib/api";
import type { CourseModule } from "@/types";

export function ModuleManager({
  courseId,
  modules,
}: {
  courseId: string | number;
  modules: CourseModule[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  async function createModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      order: Number(form.get("order") || modules.length),
    };
    if (!payload.title.trim()) {
      toast.error("Module title is required");
      return;
    }
    setLoading(true);
    try {
      await bffFetch(`/api/lms/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Module added");
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add module");
    } finally {
      setLoading(false);
    }
  }

  async function removeModule() {
    if (deleteId == null) return;
    try {
      await bffFetch(`/api/lms/modules/${deleteId}`, { method: "DELETE" });
      toast.success("Module deleted");
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const sorted = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-2">
          {sorted.map((mod) => (
            <li
              key={String(mod.documentId || mod.id)}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className="mr-2 text-muted-foreground">#{mod.order ?? 0}</span>
                {mod.title}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete module"
                onClick={() => setDeleteId(mod.documentId || mod.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>

        <form
          className="space-y-3 rounded-lg border border-dashed border-border p-4"
          onSubmit={createModule}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add module
          </p>
          <div className="space-y-2">
            <Label htmlFor="module-title">Title</Label>
            <Input id="module-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-description">Description</Label>
            <Textarea id="module-description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-order">Order</Label>
            <Input
              id="module-order"
              name="order"
              type="number"
              defaultValue={sorted.length}
            />
          </div>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Adding…" : "Add module"}
          </Button>
        </form>
      </CardContent>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete module?"
        description="Lessons in this module stay on the course but become unassigned."
        confirmLabel="Delete"
        destructive
        onConfirm={removeModule}
      />
    </Card>
  );
}
