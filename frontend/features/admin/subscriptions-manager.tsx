"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function SubscriptionsManager() {
  return (
    <AdminResourceManager
      title="Subscriptions"
      description="User plan subscriptions."
      uid="subscriptions"
      columns={[
        { key: "user.email", label: "User" },
        { key: "plan.name", label: "Plan" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "startDate", label: "Starts" },
        { key: "renewalDate", label: "Renews" },
      ]}
      fields={[
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED", "EXPIRED"],
        },
        { key: "startDate", label: "Starts", type: "datetime" },
        { key: "renewalDate", label: "Renews", type: "datetime" },
      ]}
      createDefaults={{ status: "ACTIVE" }}
    />
  );
}
