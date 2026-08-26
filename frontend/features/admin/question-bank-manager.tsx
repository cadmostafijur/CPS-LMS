"use client";

import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";

export function QuestionBankManager() {
  return (
    <AdminResourceManager
      title="Question bank"
      description="Reusable assessment questions."
      uid="question-bank"
      columns={[
        { key: "question", label: "Question" },
        { key: "questionType", label: "Type" },
        {
          key: "difficulty",
          label: "Difficulty",
          render: (r) => <StatusBadge value={r.difficulty} />,
        },
        { key: "marks", label: "Marks" },
        { key: "tags", label: "Tags" },
      ]}
      fields={[
        { key: "question", label: "Question", type: "textarea" },
        {
          key: "questionType",
          label: "Type",
          type: "select",
          options: ["SINGLE", "MULTI", "TRUE_FALSE", "SHORT"],
        },
        { key: "correctAnswer", label: "Correct answer", type: "text" },
        { key: "explanation", label: "Explanation", type: "textarea" },
        { key: "marks", label: "Marks", type: "number" },
        {
          key: "difficulty",
          label: "Difficulty",
          type: "select",
          options: ["EASY", "MEDIUM", "HARD"],
        },
        { key: "tags", label: "Tags", type: "text" },
      ]}
      createDefaults={{ questionType: "SINGLE", marks: 1, difficulty: "MEDIUM" }}
    />
  );
}
