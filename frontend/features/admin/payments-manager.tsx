"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function PaymentsManager() {
  return (
    <AdminResourceManager
      title="Payments"
      description="Payment transactions linked to orders."
      uid="payments"
      columns={[
        { key: "transactionId", label: "Txn" },
        { key: "amount", label: "Amount" },
        { key: "method", label: "Method" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        { key: "customer.email", label: "Customer" },
      ]}
      fields={[
        { key: "amount", label: "Amount", type: "number" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "method", label: "Method", type: "text" },
        { key: "gateway", label: "Gateway", type: "text" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
        },
      ]}
      createDefaults={{
        currency: "USD",
        method: "SIMULATED",
        gateway: "internal",
        status: "SUCCESS",
      }}
    />
  );
}
