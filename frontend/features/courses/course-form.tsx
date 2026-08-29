"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  DollarSign,
  Globe,
  ImageIcon,
  Settings2,
  Sparkles,
} from "lucide-react";
import { toast } from "@/lib/notify";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUrlField } from "@/components/shared/image-url-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { bffFetch, ApiError } from "@/lib/api";
import { revalidateStaffCoursePaths } from "@/features/courses/revalidate-staff-paths";
import { cn } from "@/lib/utils";
import type {
  Course,
  CourseCategory,
  CourseDifficulty,
  CourseStatus,
} from "@/types";

function FormSection({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
      >
        <div>
          <h3 className="font-display text-sm font-semibold text-navy">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-border px-4 pb-5 pt-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function CourseForm({
  course,
  redirectBase = "/instructor/courses",
  hideHeader = false,
}: {
  course?: Course | null;
  redirectBase?: string;
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [status, setStatus] = useState<CourseStatus>(course?.status || "DRAFT");
  const [isFree, setIsFree] = useState(
    course?.isFree !== false && !(Number(course?.price) > 0)
  );
  const [price, setPrice] = useState(String(course?.price ?? 0));
  const [discountPrice, setDiscountPrice] = useState(
    String(course?.discountPrice ?? "")
  );
  const [currency, setCurrency] = useState(course?.currency || "USD");
  const [difficulty, setDifficulty] = useState<CourseDifficulty>(
    course?.difficulty || "BEGINNER"
  );
  const [categoryId, setCategoryId] = useState(
    course?.category ? String(course.category.documentId || course.category.id) : "none"
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl || "");
  const [coverImageUrl, setCoverImageUrl] = useState(course?.coverImageUrl || "");

  useEffect(() => {
    bffFetch<{ data: CourseCategory[] }>("/api/lms/categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      shortDescription: String(form.get("shortDescription") || ""),
      description: String(form.get("description") || ""),
      thumbnailUrl: thumbnailUrl || String(form.get("thumbnailUrl") || ""),
      coverImageUrl: coverImageUrl || String(form.get("coverImageUrl") || ""),
      language: String(form.get("language") || "English"),
      requirements: String(form.get("requirements") || ""),
      outcomes: String(form.get("outcomes") || ""),
      tags: String(form.get("tags") || ""),
      seoTitle: String(form.get("seoTitle") || ""),
      seoDescription: String(form.get("seoDescription") || ""),
      publishedAt: (() => {
        const raw = String(form.get("publishedAt") || "");
        if (!raw) return null;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      })(),
      status,
      isFree,
      price: isFree ? 0 : Number(price || 0),
      discountPrice:
        !isFree && discountPrice !== "" ? Number(discountPrice) : null,
      currency,
      difficulty,
      categoryId: categoryId === "none" ? null : categoryId,
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
        await revalidateStaffCoursePaths(redirectBase);
        router.push(`${redirectBase}/${id}/edit`);
      } else {
        const created = await bffFetch<{ data: Course }>("/api/lms/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Course created");
        const id = created.data.documentId || created.data.id;
        await revalidateStaffCoursePaths(redirectBase);
        router.push(`${redirectBase}/${id}/edit`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeCourse() {
    if (!course) return;
    const id = course.documentId || course.id;
    setDeleting(true);
    try {
      await bffFetch(`/api/lms/courses/${id}`, { method: "DELETE" });
      toast.success("Course deleted");
      setConfirmDelete(false);
      await revalidateStaffCoursePaths(redirectBase);
      router.push(redirectBase);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const publishedLocal = course?.publishedAt
    ? new Date(course.publishedAt).toISOString().slice(0, 16)
    : "";

  return (
    <div className="space-y-6">
      {hideHeader ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="submit" form="course-form" disabled={loading || deleting}>
            {loading ? "Saving…" : course ? "Save changes" : "Create course"}
          </Button>
          {course ? (
            <Button
              type="button"
              variant="destructive"
              disabled={loading || deleting}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-orange/20 bg-gradient-to-r from-orange/10 via-white to-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange/15 text-orange">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange">
                  {course ? "Course editor" : "New course"}
                </p>
                <h2 className="font-display text-xl font-semibold text-navy">
                  {course ? course.title : "Build your course in clear steps"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course
                    ? "Update details here, then manage lessons and quizzes in the editor."
                    : "Start with the basics. You can add lessons and quizzes after saving."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" form="course-form" disabled={loading || deleting}>
                {loading ? "Saving…" : course ? "Save changes" : "Create course"}
              </Button>
              {course ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loading || deleting}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <form id="course-form" onSubmit={onSubmit}>
        <Tabs defaultValue="basics" className="space-y-5">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-border bg-white p-1.5 shadow-sm">
            <TabsTrigger value="basics" className="gap-1.5 rounded-xl px-3 py-2">
              <Sparkles className="h-3.5 w-3.5" />
              Basics
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-1.5 rounded-xl px-3 py-2">
              <ImageIcon className="h-3.5 w-3.5" />
              Media
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-1.5 rounded-xl px-3 py-2">
              <Settings2 className="h-3.5 w-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1.5 rounded-xl px-3 py-2">
              <DollarSign className="h-3.5 w-3.5" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5 rounded-xl px-3 py-2">
              <Globe className="h-3.5 w-3.5" />
              SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="mt-0 space-y-4">
            <FormSection title="Course identity" description="What students see first in the catalog.">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={course?.title || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short description</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={course?.shortDescription || ""}
                  placeholder="One line summary for cards and search"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Full description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={course?.description || ""}
                  rows={6}
                  placeholder="What will students learn? Who is this course for?"
                />
              </div>
            </FormSection>

            <FormSection title="Classification" description="Category, difficulty, and language.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem
                          key={String(cat.documentId || cat.id)}
                          value={String(cat.documentId || cat.id)}
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) => setDifficulty(v as CourseDifficulty)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    name="language"
                    defaultValue={course?.language || "English"}
                  />
                </div>
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="media" className="mt-0 space-y-4">
            <FormSection
              title="Visual assets"
              description="Thumbnail appears on cards. Cover image appears on the course page."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <ImageUrlField
                  name="thumbnailUrl"
                  label="Course thumbnail"
                  value={thumbnailUrl}
                  onChange={setThumbnailUrl}
                  hint="Recommended for catalog cards. Upload or paste a URL."
                />
                <ImageUrlField
                  name="coverImageUrl"
                  label="Cover image"
                  value={coverImageUrl}
                  onChange={setCoverImageUrl}
                  hint="Large banner on the course detail page."
                />
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="details" className="mt-0 space-y-4">
            <FormSection title="Publishing" description="Control visibility and schedule.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as CourseStatus)}>
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
                  <Label htmlFor="publishedAt">Publish at (optional)</Label>
                  <Input
                    id="publishedAt"
                    name="publishedAt"
                    type="datetime-local"
                    defaultValue={publishedLocal}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Learning details" description="Requirements, outcomes, and tags.">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  defaultValue={course?.requirements || ""}
                  rows={3}
                  placeholder="What should students know before starting?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcomes">Learning outcomes</Label>
                <Textarea
                  id="outcomes"
                  name="outcomes"
                  defaultValue={course?.outcomes || ""}
                  rows={3}
                  placeholder="What will students be able to do after finishing?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={(course as any)?.tags || ""}
                  placeholder="javascript, beginner, contest"
                />
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="pricing" className="mt-0 space-y-4">
            <FormSection title="Pricing model" description="Free courses enroll instantly. Paid courses need a price.">
              <div className="space-y-2">
                <Label>Pricing</Label>
                <Select value={isFree ? "free" : "paid"} onValueChange={(v) => setIsFree(v === "free")}>
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
                <div className="grid gap-4 sm:grid-cols-3">
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
                    <Label htmlFor="discountPrice">Discount price</Label>
                    <Input
                      id="discountPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
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
            </FormSection>
          </TabsContent>

          <TabsContent value="seo" className="mt-0 space-y-4">
            <FormSection title="Search & sharing" description="Optional metadata for search engines and social previews.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="seoTitle">SEO title</Label>
                  <Input
                    id="seoTitle"
                    name="seoTitle"
                    defaultValue={(course as any)?.seoTitle || ""}
                    placeholder="Custom title for Google and social cards"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="seoDescription">SEO description</Label>
                  <Textarea
                    id="seoDescription"
                    name="seoDescription"
                    defaultValue={(course as any)?.seoDescription || ""}
                    rows={3}
                    placeholder="Short summary for search results"
                  />
                </div>
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <Button type="submit" disabled={loading || deleting}>
            {loading ? "Saving…" : course ? "Save changes" : "Create course"}
          </Button>
          {course ? (
            <Button
              type="button"
              variant="destructive"
              disabled={loading || deleting}
              onClick={() => setConfirmDelete(true)}
            >
              Delete course
            </Button>
          ) : null}
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this course?"
        description="Lessons, quizzes, and related data for this course will be removed. This cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        destructive
        onConfirm={removeCourse}
      />
    </div>
  );
}
