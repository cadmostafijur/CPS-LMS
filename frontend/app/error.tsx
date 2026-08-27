"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <BrandLogo size={48} className="mb-6 rounded-xl ring-1 ring-navy/10" />
      <h1 className="font-display text-2xl font-bold text-navy">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please try again. If this keeps happening, hard-refresh the page
        (Ctrl+Shift+R) or return home.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Digest: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
