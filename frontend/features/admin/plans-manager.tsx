"use client";

import { AdminResourceManager } from "@/features/admin/admin-resource-manager";

export function PlansManager() {
  return (
    <AdminResourceManager
      title="Plans"
      description="Subscription plan catalog."
      uid="plans"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "price", label: "Price" },
        { key: "interval", label: "Interval" },
        { key: "isActive", label: "Active" },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "code", label: "Code", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "price", label: "Price", type: "number" },
        {
          key: "interval",
          label: "Interval",
          type: "select",
          options: ["MONTHLY", "YEARLY"],
        },
        { key: "isActive", label: "Active", type: "boolean" },
      ]}
      createDefaults={{ interval: "MONTHLY", isActive: true, price: 0 }}
    />
  );
}
