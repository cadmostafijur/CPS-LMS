"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function TranscriptDownload({ payload }: { payload: any }) {
  function download() {
    const lines = [
      "course,progress_percent,completed_lessons,total_lessons,best_quiz_percent,completed_at",
      ...(payload.courses || []).map(
        (c: any) =>
          `"${c.courseTitle}",${c.progressPercent},${c.completedLessons},${c.totalLessons},${c.bestQuizPercent ?? ""},${c.completedAt ?? ""}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cps-transcript.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={download}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
