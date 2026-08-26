"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { bffFetch, ApiError } from "@/lib/api";
import type { Certificate } from "@/types";

export function CertificatesAdminTable() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<Certificate[]>([]);
  const [pending, startTransition] = useTransition();
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);

  function load() {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("search", debounced);
        const res = await bffFetch<{ data: Certificate[] }>(
          `/api/lms/admin/certificates?${params.toString()}`
        );
        setItems(res.data || []);
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load certificates"
        );
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  async function confirmRevoke() {
    if (!revokeTarget) return;
    try {
      const id = revokeTarget.documentId || revokeTarget.id;
      await bffFetch(`/api/lms/admin/certificates/${id}/revoke`, { method: "POST" });
      toast.success("Certificate revoked");
      setRevokeTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Revoke failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Issued certificates — revoke or share the public verify link."
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search code, student, or course…"
        className="sm:max-w-sm"
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No certificates yet.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((cert) => {
              const revoked = cert.status === "REVOKED";
              return (
                <TableRow key={String(cert.id)}>
                  <TableCell className="font-mono text-xs">{cert.code}</TableCell>
                  <TableCell>{cert.studentName}</TableCell>
                  <TableCell>{cert.courseTitle}</TableCell>
                  <TableCell>
                    <Badge variant={revoked ? "danger" : "success"}>
                      {cert.status || "ISSUED"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cert.issuedAt
                      ? new Date(cert.issuedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/verify/${cert.code}`}>Verify</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/certificates/${cert.documentId || cert.id}`}>
                        View
                      </Link>
                    </Button>
                    {!revoked ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setRevokeTarget(cert)}
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(v) => !v && setRevokeTarget(null)}
        title="Revoke certificate?"
        description="Public verification will show this certificate as invalid."
        confirmLabel="Revoke"
        destructive
        onConfirm={confirmRevoke}
      />
    </div>
  );
}
