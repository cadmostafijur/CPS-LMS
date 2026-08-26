"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { bffFetch, ApiError } from "@/lib/api";

type Summary = {
  students: number;
  instructors: number;
  courses: number;
  enrollments: number;
  certificates: number;
  ordersPaid: number;
  ticketsOpen: number;
  lowStock: number;
  revenue: number;
};

export function ReportsAdminView() {
  const [data, setData] = useState<Summary | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: Summary }>("/api/lms/admin/reports/summary");
        setData(res.data);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load reports");
      }
    });
  }, []);

  const cards = data
    ? [
        { label: "Students", value: data.students },
        { label: "Instructors", value: data.instructors },
        { label: "Courses", value: data.courses },
        { label: "Enrollments", value: data.enrollments },
        { label: "Certificates", value: data.certificates },
        { label: "Paid orders", value: data.ordersPaid },
        { label: "Open tickets", value: data.ticketsOpen },
        { label: "Low stock SKUs", value: data.lowStock },
        { label: "Revenue (sim)", value: `$${data.revenue}` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Cross-module snapshot for operations and commerce."
      />
      {pending && !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <StatsCard key={c.label} title={c.label} value={String(c.value)} />
          ))}
        </div>
      )}
    </div>
  );
}
