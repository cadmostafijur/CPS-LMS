"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function TicketsManager() {
  return (
    <AdminResourceManager
      title="Support tickets"
      description="Helpdesk tickets and status tracking."
      uid="tickets"
      columns={[
        { key: "ticketNumber", label: "Ticket #" },
        { key: "subject", label: "Subject" },
        {
          key: "priority",
          label: "Priority",
          render: (r) => <StatusBadge value={r.priority} />,
        },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "user.email", label: "User" },
      ]}
      fields={[
        { key: "subject", label: "Subject", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
        { key: "category", label: "Category", type: "text" },
        {
          key: "priority",
          label: "Priority",
          type: "select",
          options: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
        },
      ]}
      createDefaults={{ category: "general", priority: "MEDIUM", status: "OPEN" }}
    />
  );
}
