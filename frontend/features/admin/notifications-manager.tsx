"use client";

import { AdminResourceManager } from "@/features/admin/admin-resource-manager";

export function NotificationsManager() {
  return (
    <AdminResourceManager
      title="Notifications"
      description="In-app notification records."
      uid="notifications"
      columns={[
        { key: "title", label: "Title" },
        { key: "user.email", label: "User" },
        { key: "type", label: "Type" },
        { key: "isRead", label: "Read" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
        { key: "type", label: "Type", type: "text" },
        { key: "linkUrl", label: "Link URL", type: "text" },
        { key: "isRead", label: "Read", type: "boolean" },
      ]}
      createDefaults={{ type: "system", isRead: false }}
    />
  );
}
