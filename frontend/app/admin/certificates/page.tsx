import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CertificatesAdminTable } from "@/features/admin/certificates-admin-table";
import { requireUser } from "@/lib/session";

export default async function AdminCertificatesPage() {
  const user = await requireUser("/admin/certificates");
  return (
    <DashboardShell user={user}>
      <CertificatesAdminTable />
    </DashboardShell>
  );
}
