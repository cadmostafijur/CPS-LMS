"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function ReviewsManager() {
  return (
    <AdminResourceManager
      title="Reviews"
      description="Moderate course ratings and feedback."
      uid="reviews"
      columns={[
        { key: "course.title", label: "Course" },
        { key: "student.email", label: "Student" },
        { key: "rating", label: "Rating" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "body", label: "Body" },
      ]}
      fields={[
        { key: "rating", label: "Rating (1-5)", type: "number" },
        { key: "body", label: "Body", type: "textarea" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["PENDING", "APPROVED", "REJECTED", "HIDDEN"],
        },
      ]}
      createDefaults={{ rating: 5, status: "PENDING" }}
    />
  );
}
