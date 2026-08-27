"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function AssignmentsManager() {
  return (
    <AdminResourceManager
      title="Assignments"
      description="Homework linked to a course. Students submit from their Assignments page; instructors grade submissions."
      uid="assignments"
      columns={[
        { key: "title", label: "Title" },
        { key: "course.title", label: "Course" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "maxMarks", label: "Marks" },
        { key: "dueDate", label: "Due" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        {
          key: "course",
          label: "Course",
          type: "relation",
          optionsPath: "/api/lms/staff/courses",
          labelKey: "title",
        },
        { key: "maxMarks", label: "Max marks", type: "number" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["DRAFT", "PUBLISHED", "CLOSED"],
        },
        { key: "dueDate", label: "Due date", type: "datetime" },
      ]}
      createDefaults={{ maxMarks: 100, status: "DRAFT" }}
    />
  );
}
