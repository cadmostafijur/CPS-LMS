"use client";

import { AdminResourceManager } from "@/features/admin/admin-resource-manager";

export function AuditLogsManager() {
  return (
    <AdminResourceManager
      title="Audit logs"
      description="Admin action history (read-only)."
      uid="audit-logs"
      readOnly
      columns={[
        { key: "action", label: "Action" },
        { key: "entity", label: "Entity" },
        { key: "entityId", label: "Entity ID" },
        { key: "user.email", label: "User" },
      ]}
      fields={[]}
    />
  );
}
