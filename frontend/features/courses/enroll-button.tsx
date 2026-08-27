"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bffFetch, ApiError } from "@/lib/api";

function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function EnrollButton({
  courseId,
  enrolled,
  firstLessonId,
  isFree = true,
  price = 0,
  currency = "USD",
  canEnroll = true,
}: {
  courseId: string | number;
  enrolled: boolean;
  firstLessonId?: string | number | null;
  isFree?: boolean;
  price?: number;
  currency?: string;
  /** Permission matrix: only Student may enroll */
  canEnroll?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [couponCode, setCouponCode] = useState("");
  const [preview, setPreview] = useState<{
    amountDue: number;
    discount: number;
  } | null>(null);
  const learnHref = firstLessonId
    ? `/learn/${courseId}/${firstLessonId}`
    : `/student/my-courses`;
  const free = isFree || !(price > 0);

  if (!canEnroll) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface px-3 py-3 text-sm text-muted-foreground">
        <p>
          Enrollment is for <span className="font-medium text-navy">Student</span> accounts
          only. You are signed in with a staff role — use your dashboard to manage courses,
          or sign out and use a student login.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <Button asChild>
        <Link href={learnHref}>Continue learning</Link>
      </Button>
    );
  }

  async function applyCoupon() {
    if (!couponCode.trim()) {
      setPreview(null);
      return;
    }
    try {
      const res = await bffFetch<{
        data: { amountDue: number; discount: number };
      }>("/api/lms/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ courseId, couponCode }),
      });
      setPreview({
        amountDue: res.data.amountDue,
        discount: res.data.discount,
      });
      toast.success("Coupon applied");
    } catch (err) {
      setPreview(null);
      toast.error(err instanceof ApiError ? err.message : "Invalid coupon");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        {free ? (
          <p className="font-medium text-navy">Free course</p>
        ) : (
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Price{" "}
              <span className="font-semibold text-navy">
                {formatMoney(price, currency)}
              </span>
            </p>
            {preview ? (
              <p className="text-sm">
                After coupon:{" "}
                <span className="font-semibold text-orange">
                  {formatMoney(preview.amountDue, currency)}
                </span>{" "}
                <span className="text-muted-foreground">
                  (−{formatMoney(preview.discount, currency)})
                </span>
              </p>
            ) : null}
          </div>
        )}
      </div>

      {!free ? (
        <div className="space-y-2">
          <Label htmlFor="coupon">Coupon code</Label>
          <div className="flex gap-2">
            <Input
              id="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="SAVE10"
            />
            <Button type="button" variant="outline" onClick={() => void applyCoupon()}>
              Apply
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            try {
              await bffFetch(`/api/lms/enroll/${courseId}`, {
                method: "POST",
                body: JSON.stringify({
                  couponCode: free ? undefined : couponCode || undefined,
                }),
              });
              setIsEnrolled(true);
              toast.success(
                free ? "Enrolled successfully" : "Enrollment completed"
              );
              router.refresh();
            } catch (err) {
              if (err instanceof ApiError && err.status === 401) {
                router.push(`/login?next=/courses`);
                return;
              }
              const message =
                err instanceof ApiError ? err.message : "Enrollment failed";
              if (
                err instanceof ApiError &&
                (err.status === 403 || /forbidden/i.test(message))
              ) {
                toast.error(
                  /student/i.test(message)
                    ? message
                    : "Only Student accounts can enroll. Sign out and sign in as a student (or register a new student account)."
                );
                return;
              }
              toast.error(message);
            }
          });
        }}
      >
        {pending
          ? "Processing…"
          : free
            ? "Enroll now"
            : preview
              ? `Pay ${formatMoney(preview.amountDue, currency)} & enroll`
              : `Enroll · ${formatMoney(price, currency)}`}
      </Button>
      {!free ? (
        <p className="text-xs text-muted-foreground">
          Checkout is simulated in this LMS build — enrollment records the paid amount after coupons.
        </p>
      ) : null}
    </div>
  );
}
