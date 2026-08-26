"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function OrdersManager() {
  return (
    <AdminResourceManager
      title="Orders"
      description="Checkout orders (simulated payments)."
      uid="orders"
      columns={[
        { key: "orderNumber", label: "Order #" },
        { key: "customer.email", label: "Customer" },
        { key: "course.title", label: "Course" },
        { key: "total", label: "Total" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge value={r.status} />,
        },
        {
          key: "paymentStatus",
          label: "Payment",
          render: (r) => <StatusBadge value={r.paymentStatus} />,
        },
      ]}
      fields={[
        { key: "amount", label: "Amount", type: "number" },
        { key: "discount", label: "Discount", type: "number" },
        { key: "total", label: "Total", type: "number" },
        { key: "currency", label: "Currency", type: "text" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["PENDING", "PAID", "CANCELLED", "REFUNDED"],
        },
        {
          key: "paymentStatus",
          label: "Payment status",
          type: "select",
          options: ["UNPAID", "PAID", "FAILED", "REFUNDED"],
        },
        { key: "couponCode", label: "Coupon", type: "text" },
      ]}
      createDefaults={{
        currency: "USD",
        status: "PENDING",
        paymentStatus: "UNPAID",
        discount: 0,
      }}
    />
  );
}
