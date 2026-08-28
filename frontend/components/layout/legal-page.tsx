import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/lib/session";

export async function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageHeader title={title} description={description} />
        <div className="prose prose-navy max-w-none text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-navy [&_p]:mt-3">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
