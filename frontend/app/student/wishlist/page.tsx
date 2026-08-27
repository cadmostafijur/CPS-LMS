import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { WishlistRemindButton } from "@/features/student/wishlist-remind-button";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default async function StudentWishlistPage() {
  const user = await requireUser("/student/wishlist");
  const token = await getTokenFromCookies();
  let items: any[] = [];
  try {
    const res = await apiFetch<{ data: any[] }>("/lms/wishlist", { token });
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Wishlist"
        description="Courses you saved for later."
        actions={
          <div className="flex flex-wrap gap-2">
            {items.length > 0 ? <WishlistRemindButton /> : null}
            <Button asChild variant="outline">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Wishlist is empty"
          description="Save courses from the catalog with the Wishlist button."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((w) => (
            <li
              key={String(w.documentId || w.id)}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <h3 className="font-display font-semibold text-navy">
                {w.course?.title || "Course"}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {w.course?.shortDescription}
              </p>
              {w.course?.slug ? (
                <Button asChild className="mt-4" size="sm">
                  <Link href={`/courses/${w.course.slug}`}>View course</Link>
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
