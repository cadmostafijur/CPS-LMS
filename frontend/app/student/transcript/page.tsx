import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { TranscriptDownload } from "@/features/student/transcript-download";
import type { StudentTranscript } from "@/types";

export default async function StudentTranscriptPage() {
  const user = await requireUser("/student/transcript");
  const token = await getTokenFromCookies();
  let data: StudentTranscript | null = null;
  try {
    const res = await apiFetch<{ data: StudentTranscript }>("/lms/transcript", { token });
    data = res.data;
  } catch {
    data = null;
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Transcript / gradebook"
        description="Your course progress and best quiz scores."
        actions={data ? <TranscriptDownload payload={data} /> : null}
      />
      {!data ? (
        <p className="text-sm text-muted-foreground">Could not load transcript.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Best quiz</th>
                <th className="px-4 py-3 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {(data.courses || []).map((c) => (
                <tr key={c.courseSlug || c.courseTitle} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{c.courseTitle}</td>
                  <td className="px-4 py-3">
                    {c.progressPercent}% ({c.completedLessons}/{c.totalLessons})
                  </td>
                  <td className="px-4 py-3">
                    {c.bestQuizPercent != null ? `${c.bestQuizPercent}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.completedAt
                      ? new Date(c.completedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
