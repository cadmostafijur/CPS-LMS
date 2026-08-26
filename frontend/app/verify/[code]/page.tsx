import Link from "next/link";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

type VerifyResult = {
  valid: boolean;
  status: string;
  code: string;
  studentName?: string;
  courseTitle?: string;
  issuedAt?: string;
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  let data: VerifyResult | null = null;
  let error: string | null = null;

  try {
    const res = await apiFetch<{ data: VerifyResult }>(
      `/lms/certificates/verify/${encodeURIComponent(code)}`,
      { auth: false }
    );
    data = res.data;
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Certificate not found";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy/5 via-white to-orange/5">
      <Navbar user={user} />
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <Award className="mb-4 h-12 w-12 text-orange" />
        <h1 className="font-display text-3xl font-bold text-navy">
          Certificate verification
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public check for CPS Academy completion certificates.
        </p>

        {error ? (
          <div className="mt-10 space-y-3 rounded-2xl border border-border bg-white p-8 shadow-sm">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="font-medium text-navy">Not found</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="font-mono text-xs text-muted-foreground">{code}</p>
          </div>
        ) : data ? (
          <div className="mt-10 w-full space-y-4 rounded-2xl border border-border bg-white p-8 shadow-sm">
            {data.valid ? (
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
            )}
            <Badge variant={data.valid ? "success" : "danger"}>
              {data.valid ? "Valid" : data.status || "Invalid"}
            </Badge>
            <div className="space-y-1 text-left text-sm">
              <Row label="Code" value={data.code} mono />
              <Row label="Student" value={data.studentName || "—"} />
              <Row label="Course" value={data.courseTitle || "—"} />
              <Row
                label="Issued"
                value={
                  data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : "—"
                }
              />
            </div>
          </div>
        ) : null}

        <Button asChild variant="outline" className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium text-navy"}>
        {value}
      </span>
    </div>
  );
}
