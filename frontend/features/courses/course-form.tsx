"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bffFetch, ApiError } from "@/lib/api";
import type { Course, CourseStatus } from "@/types";

export function CourseForm({
  course,
  redirectBase = "/instructor/courses",
}: {
  course?: Course | null;
  redirectBase?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CourseStatus>(course?.status || "DRAFT");
  const [isFree, setIsFree] = useState(course?.isFree !== false && !(Number(course?.price) > 0));
  const [price, setPrice] = useState(String(course?.price ?? 0));
  const [currency, setCurrency] = useState(course?.currency || "USD");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      shortDescription: String(form.get("shortDescription") || ""),
      description: String(form.get("description") || ""),
      thumbnailUrl: String(form.get("thumbnailUrl") || ""),
      status,
      isFree,
      price: isFree ? 0 : Number(price || 0),
      currency,
    };
    if (!payload.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!isFree && !(payload.price > 0)) {
      toast.error("Paid courses need a price greater than 0");
      return;
    }

    setLoading(true);
    try {
      if (course) {
        const id = course.documentId || course.id;
        await bffFetch(`/api/lms/courses/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Course updated");
        router.push(`${redirectBase}/${id}/edit`);
      } else {
        const created = await bffFetch<{ data: Course }>("/api/lms/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Course created");
        const id = created.data.documentId || created.data.id;
        router.push(`${redirectBase}/${id}/edit`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course ? "Edit course" : "New course"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={course?.title || ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short description</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={course?.shortDescription || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={course?.description || ""}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              name="thumbnailUrl"
              defaultValue={course?.thumbnailUrl || ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as CourseStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pricing</Label>
            <Select
              value={isFree ? "free" : "paid"}
              onValueChange={(v) => setIsFree(v === "free")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isFree ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : course ? "Save changes" : "Create course"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
