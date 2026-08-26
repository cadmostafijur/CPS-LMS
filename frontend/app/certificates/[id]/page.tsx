import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getCertificate } from "@/services/admin.service";
import { PrintButton } from "@/features/certificates/print-button";

type Props = { params: Promise<{ id: string }> };

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  await requireUser(`/certificates/${id}`);
  const token = await getTokenFromCookies();
  const { data: cert } = await getCertificate(id, token).catch(() => ({
    data: null,
  }));
  if (!cert) notFound();

  const issued = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-surface px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between print:hidden">
        <Button asChild variant="outline">
          <Link href="/student/certificates">Back</Link>
        </Button>
        <PrintButton />
      </div>

      <article className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border-2 border-navy/20 bg-white px-8 py-12 shadow-sm print:border-navy print:shadow-none md:px-16 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(11,18,32,0.06),transparent_45%)]" />
        <div className="relative text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <BrandLogo size={48} />
            <span className="font-display text-2xl font-bold text-navy">
              CPS Academy
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">
            Certificate of Completion
          </p>
          <h1 className="mt-6 font-display text-3xl font-bold text-navy md:text-4xl">
            {cert.studentName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            has successfully completed the course
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-navy md:text-3xl">
            {cert.courseTitle}
          </p>
          <div className="mx-auto mt-10 flex max-w-lg flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide">Issued</p>
              <p className="font-medium text-foreground">{issued}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wide">Certificate ID</p>
              <p className="font-mono text-xs font-medium text-foreground">
                {cert.code}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
