"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { bffFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
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
  const [showForm, setShowForm] = useState(modules.length === 0);
  const [formKey, setFormKey] = useState(0);

  async function createModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      order: modules.length,
    };
    if (!payload.title) {
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
      formEl.reset();
      setFormKey((k) => k + 1);
      setShowForm(false);
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
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            Group lessons into sections. Students unlock modules in order.
          </CardDescription>
        </div>
        {sorted.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            Add
            <ChevronDown
              className={cn("h-4 w-4 transition", showForm && "rotate-180")}
            />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.length === 0 ? (
          <EmptyState
            title="No modules yet"
            description="Add your first module — for example “Week 1” or “Introduction”."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {sorted.map((mod, index) => (
              <li
                key={String(mod.documentId || mod.id)}
                className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-navy">{mod.title}</p>
                  {mod.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {mod.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                    #{index + 1}
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
                </div>
              </li>
            ))}
          </ul>
        )}

        {showForm || sorted.length === 0 ? (
          <form
            key={formKey}
            className="space-y-3 rounded-xl border border-dashed border-orange/30 bg-orange/[0.03] p-4"
            onSubmit={createModule}
          >
            <p className="text-sm font-medium text-navy">New module</p>
            <div className="space-y-2">
              <Label htmlFor="module-title">Title</Label>
              <Input
                id="module-title"
                name="title"
                placeholder="e.g. Week 1 — Getting started"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-description">Description (optional)</Label>
              <Textarea
                id="module-description"
                name="description"
                rows={2}
                placeholder="What will students learn in this section?"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} size="sm">
                {loading ? "Adding…" : "Add module"}
              </Button>
              {sorted.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
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
