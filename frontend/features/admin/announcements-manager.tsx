"use client";

import { AdminResourceManager } from "@/features/admin/admin-resource-manager";

export function AnnouncementsManager() {
  return (
    <AdminResourceManager
      title="Announcements"
      description="Platform-wide or audience-targeted messages."
      uid="announcements"
      columns={[
        { key: "title", label: "Title" },
        { key: "audience", label: "Audience" },
        { key: "isActive", label: "Active" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "content", label: "Content", type: "textarea" },
        {
          key: "audience",
          label: "Audience",
          type: "select",
          options: ["EVERYONE", "STUDENTS", "INSTRUCTORS"],
        },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "publishAt", label: "Publish at", type: "datetime" },
        { key: "expiresAt", label: "Expires", type: "datetime" },
      ]}
      createDefaults={{ audience: "EVERYONE", isActive: true }}
    />
  );
}
