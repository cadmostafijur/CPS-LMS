"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function BatchesManager() {
  return (
    <AdminResourceManager
      title="Batches"
      description="Cohorts tied to a course with capacity and schedule."
      uid="batches"
      columns={[
        { key: "name", label: "Name" },
        { key: "course.title", label: "Course" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "capacity", label: "Capacity" },
        { key: "startDate", label: "Start" },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "capacity", label: "Capacity", type: "number" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"],
        },
        { key: "schedule", label: "Schedule", type: "textarea" },
        { key: "startDate", label: "Start", type: "datetime" },
        { key: "endDate", label: "End", type: "datetime" },
      ]}
      createDefaults={{ capacity: 30, status: "OPEN" }}
    />
  );
}
