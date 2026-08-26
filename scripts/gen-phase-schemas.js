const fs = require("fs");
const path = require("path");

function writeCT(api, singular, plural, display, attrs) {
  const base = path.join("backend/src/api", api);
  const ctDir = path.join(base, "content-types", singular);
  fs.mkdirSync(ctDir, { recursive: true });
  for (const folder of ["routes", "controllers", "services"]) {
    fs.mkdirSync(path.join(base, folder), { recursive: true });
  }
  const schema = {
    kind: "collectionType",
    collectionName: plural.replace(/-/g, "_"),
    info: {
      singularName: singular,
      pluralName: plural,
      displayName: display,
      description: display,
    },
    options: { draftAndPublish: false },
    attributes: attrs,
  };
  fs.writeFileSync(path.join(ctDir, "schema.json"), JSON.stringify(schema, null, 2));
  const uid = `api::${singular}.${singular}`;
  const factories = {
    routes: "createCoreRouter",
    controllers: "createCoreController",
    services: "createCoreService",
  };
  for (const [folder, factory] of Object.entries(factories)) {
    const body = `import { factories } from '@strapi/strapi';\nexport default factories.${factory}('${uid}');\n`;
    fs.writeFileSync(path.join(base, folder, `${singular}.ts`), body);
  }
}

writeCT("batch", "batch", "batches", "Batch", {
  name: { type: "string", required: true },
  startDate: { type: "datetime" },
  endDate: { type: "datetime" },
  capacity: { type: "integer", default: 30 },
  status: {
    type: "enumeration",
    enum: ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"],
    default: "OPEN",
  },
  schedule: { type: "text" },
  course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
  instructor: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
  students: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::users-permissions.user",
  },
});

writeCT("attendance", "attendance", "attendances", "Attendance", {
  date: { type: "date", required: true },
  status: {
    type: "enumeration",
    enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED"],
    default: "PRESENT",
  },
  notes: { type: "string" },
  student: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
  batch: { type: "relation", relation: "manyToOne", target: "api::batch.batch" },
  course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
});

writeCT("assignment", "assignment", "assignments", "Assignment", {
  title: { type: "string", required: true },
  description: { type: "text" },
  dueDate: { type: "datetime" },
  maxMarks: { type: "integer", default: 100 },
  status: {
    type: "enumeration",
    enum: ["DRAFT", "PUBLISHED", "CLOSED"],
    default: "DRAFT",
  },
  course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
  createdByUser: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
});

writeCT(
  "assignment-submission",
  "assignment-submission",
  "assignment-submissions",
  "Assignment Submission",
  {
    content: { type: "text" },
    fileUrl: { type: "string" },
    score: { type: "decimal" },
    feedback: { type: "text" },
    status: {
      type: "enumeration",
      enum: ["SUBMITTED", "LATE", "GRADED", "RETURNED"],
      default: "SUBMITTED",
    },
    submittedAt: { type: "datetime" },
    assignment: {
      type: "relation",
      relation: "manyToOne",
      target: "api::assignment.assignment",
    },
    student: {
      type: "relation",
      relation: "manyToOne",
      target: "plugin::users-permissions.user",
    },
  }
);

writeCT(
  "question-bank-item",
  "question-bank-item",
  "question-bank-items",
  "Question Bank Item",
  {
    question: { type: "text", required: true },
    questionType: {
      type: "enumeration",
      enum: ["SINGLE", "MULTI", "TRUE_FALSE", "SHORT"],
      default: "SINGLE",
    },
    options: { type: "json" },
    correctAnswer: { type: "text" },
    explanation: { type: "text" },
    marks: { type: "integer", default: 1 },
    difficulty: {
      type: "enumeration",
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    tags: { type: "string" },
    course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
  }
);

writeCT("order", "order", "orders", "Order", {
  orderNumber: { type: "string", required: true, unique: true },
  amount: { type: "decimal", required: true },
  discount: { type: "decimal", default: 0 },
  total: { type: "decimal", required: true },
  currency: { type: "string", default: "USD" },
  status: {
    type: "enumeration",
    enum: ["PENDING", "PAID", "CANCELLED", "REFUNDED"],
    default: "PENDING",
  },
  paymentStatus: {
    type: "enumeration",
    enum: ["UNPAID", "PAID", "FAILED", "REFUNDED"],
    default: "UNPAID",
  },
  couponCode: { type: "string" },
  customer: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
  course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
});

writeCT("payment", "payment", "payments", "Payment", {
  transactionId: { type: "string", required: true, unique: true },
  amount: { type: "decimal", required: true },
  currency: { type: "string", default: "USD" },
  method: { type: "string", default: "SIMULATED" },
  gateway: { type: "string", default: "internal" },
  status: {
    type: "enumeration",
    enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
    default: "PENDING",
  },
  paidAt: { type: "datetime" },
  order: { type: "relation", relation: "manyToOne", target: "api::order.order" },
  customer: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
});

writeCT("plan", "plan", "plans", "Plan", {
  name: { type: "string", required: true },
  code: { type: "string", required: true, unique: true },
  description: { type: "text" },
  price: { type: "decimal", required: true },
  interval: {
    type: "enumeration",
    enum: ["MONTHLY", "YEARLY"],
    default: "MONTHLY",
  },
  isActive: { type: "boolean", default: true },
});

writeCT("subscription", "subscription", "subscriptions", "Subscription", {
  status: {
    type: "enumeration",
    enum: ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED", "EXPIRED"],
    default: "ACTIVE",
  },
  startDate: { type: "datetime" },
  renewalDate: { type: "datetime" },
  user: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
  plan: { type: "relation", relation: "manyToOne", target: "api::plan.plan" },
});

writeCT("warehouse", "warehouse", "warehouses", "Warehouse", {
  name: { type: "string", required: true },
  code: { type: "string", required: true, unique: true },
  address: { type: "text" },
  managerName: { type: "string" },
  phone: { type: "string" },
  isActive: { type: "boolean", default: true },
});

writeCT("inventory-item", "inventory-item", "inventory-items", "Inventory Item", {
  name: { type: "string", required: true },
  sku: { type: "string", required: true, unique: true },
  description: { type: "text" },
  unit: { type: "string", default: "pcs" },
  costPrice: { type: "decimal", default: 0 },
  sellingPrice: { type: "decimal", default: 0 },
  quantity: { type: "integer", default: 0 },
  minStock: { type: "integer", default: 5 },
  reorderLevel: { type: "integer", default: 10 },
  status: {
    type: "enumeration",
    enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"],
    default: "IN_STOCK",
  },
  warehouse: {
    type: "relation",
    relation: "manyToOne",
    target: "api::warehouse.warehouse",
  },
});

writeCT("stock-movement", "stock-movement", "stock-movements", "Stock Movement", {
  type: {
    type: "enumeration",
    enum: ["IN", "OUT", "ADJUSTMENT", "TRANSFER"],
    default: "IN",
  },
  quantity: { type: "integer", required: true },
  previousQuantity: { type: "integer" },
  newQuantity: { type: "integer" },
  reason: { type: "string" },
  reference: { type: "string" },
  item: {
    type: "relation",
    relation: "manyToOne",
    target: "api::inventory-item.inventory-item",
  },
  warehouse: {
    type: "relation",
    relation: "manyToOne",
    target: "api::warehouse.warehouse",
  },
  createdByUser: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
});

writeCT("announcement", "announcement", "announcements", "Announcement", {
  title: { type: "string", required: true },
  content: { type: "text", required: true },
  audience: {
    type: "enumeration",
    enum: ["EVERYONE", "STUDENTS", "INSTRUCTORS"],
    default: "EVERYONE",
  },
  isActive: { type: "boolean", default: true },
  publishAt: { type: "datetime" },
  expiresAt: { type: "datetime" },
  course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
});

writeCT("support-ticket", "support-ticket", "support-tickets", "Support Ticket", {
  ticketNumber: { type: "string", required: true, unique: true },
  subject: { type: "string", required: true },
  body: { type: "text" },
  category: { type: "string", default: "general" },
  priority: {
    type: "enumeration",
    enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    default: "MEDIUM",
  },
  status: {
    type: "enumeration",
    enum: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
    default: "OPEN",
  },
  user: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
  assignedTo: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
});

writeCT("review", "review", "reviews", "Review", {
  rating: { type: "integer", required: true },
  body: { type: "text" },
  status: {
    type: "enumeration",
    enum: ["PENDING", "APPROVED", "REJECTED", "HIDDEN"],
    default: "PENDING",
  },
  student: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
  course: { type: "relation", relation: "manyToOne", target: "api::course.course" },
});

writeCT("notification", "notification", "notifications", "Notification", {
  title: { type: "string", required: true },
  body: { type: "text" },
  type: { type: "string", default: "system" },
  isRead: { type: "boolean", default: false },
  linkUrl: { type: "string" },
  user: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
});

writeCT("audit-log", "audit-log", "audit-logs", "Audit Log", {
  action: { type: "string", required: true },
  entity: { type: "string" },
  entityId: { type: "string" },
  meta: { type: "json" },
  ip: { type: "string" },
  user: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::users-permissions.user",
  },
});

writeCT("setting", "setting", "settings", "Setting", {
  key: { type: "string", required: true, unique: true },
  value: { type: "json" },
  group: { type: "string", default: "general" },
});

console.log("schemas written ok");
