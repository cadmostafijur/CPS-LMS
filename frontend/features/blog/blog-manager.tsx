"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { bffFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { BlogPost, BlogStatus } from "@/types";

export function BlogManager({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      excerpt: String(form.get("excerpt") || ""),
      body: String(form.get("body") || ""),
      coverImageUrl: String(form.get("coverImageUrl") || ""),
      status,
    };
    if (!payload.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await bffFetch(`/api/lms/blog/${editing.documentId || editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Post updated");
      } else {
        await bffFetch("/api/lms/blog", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Post created");
      }
      setEditing(null);
      e.currentTarget.reset();
      setStatus("DRAFT");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (deleteId == null) return;
    try {
      await bffFetch(`/api/lms/blog/${deleteId}`, { method: "DELETE" });
      toast.success("Post deleted");
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit post" : "New post"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save} key={editing ? String(editing.id) : "new"}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={editing?.title || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" name="excerpt" defaultValue={editing?.excerpt || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" name="body" rows={8} defaultValue={editing?.body || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover image URL</Label>
              <Input
                id="coverImageUrl"
                name="coverImageUrl"
                defaultValue={editing?.coverImageUrl || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BlogStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : editing ? "Update" : "Create"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setStatus("DRAFT");
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-card">
        {posts.length === 0 ? (
          <EmptyState className="border-0" title="No posts" description="Create your first blog post." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={String(post.documentId || post.id)}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "PUBLISHED" ? "success" : "warning"}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(post.publishedAt)}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(post);
                        setStatus(post.status);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(post.documentId || post.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete blog post?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}
