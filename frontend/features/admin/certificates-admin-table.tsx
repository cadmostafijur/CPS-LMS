"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
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

  useEffect(() => {
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
  }, [debounced]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="All course completion certificates issued on the platform."
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
              <TableHead>Issued</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !pending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No certificates yet.
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((cert) => (
              <TableRow key={String(cert.id)}>
                <TableCell className="font-mono text-xs">{cert.code}</TableCell>
                <TableCell>{cert.studentName}</TableCell>
                <TableCell>{cert.courseTitle}</TableCell>
                <TableCell>
                  {cert.issuedAt
                    ? new Date(cert.issuedAt).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/certificates/${cert.documentId || cert.id}`}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
