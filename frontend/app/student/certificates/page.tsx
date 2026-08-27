import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getMyCertificates } from "@/services/admin.service";

export default async function StudentCertificatesPage() {
  const user = await requireUser("/student/certificates");
  const token = await getTokenFromCookies();
  const { data } = await getMyCertificates(token).catch(() => ({ data: [] as never[] }));
  const certs = data || [];

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Certificates"
        description="Certificates earned when you complete a course."
      />
      {certs.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Finish all lessons in a course to earn a certificate."
          action={
            <Button asChild>
              <Link href="/student/my-courses">My courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((cert) => (
            <Card key={String(cert.id)}>
              <CardHeader>
                <CardTitle className="text-base">{cert.courseTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Issued{" "}
                  {cert.issuedAt
                    ? new Date(cert.issuedAt).toLocaleDateString()
                    : "—"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {cert.code}
                </p>
                <Button asChild className="w-full">
                  <Link href={`/certificates/${cert.documentId || cert.id}`}>
                    View certificate
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
