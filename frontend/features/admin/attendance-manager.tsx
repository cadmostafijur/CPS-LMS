"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function AttendanceManager() {
  return (
    <AdminResourceManager
      title="Attendance"
      description="Mark present / absent / late for batch sessions."
      uid="attendances"
      columns={[
        { key: "date", label: "Date" },
        { key: "student.email", label: "Student" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "notes", label: "Notes" },
      ]}
      fields={[
        { key: "date", label: "Date (YYYY-MM-DD)", type: "text" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["PRESENT", "ABSENT", "LATE", "EXCUSED"],
        },
        { key: "notes", label: "Notes", type: "text" },
      ]}
      createDefaults={{ status: "PRESENT" }}
    />
  );
}
