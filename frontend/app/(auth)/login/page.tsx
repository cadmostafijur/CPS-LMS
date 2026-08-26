import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sign in",
  description: "Sign in to CPS Academy",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.12),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(11,18,32,0.05),transparent_40%)]" />
        <Link href="/" className="relative z-10 flex items-center gap-3 text-navy">
          <BrandLogo size={44} priority />
          <span className="font-display text-xl font-bold">CPS Academy</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl font-semibold text-navy">
            Continue your learning journey
          </p>
          <p className="mt-3 text-muted-foreground">
            Courses, quizzes, and progress — all in one modern platform.
          </p>
        </div>
        <p className="relative z-10 text-sm text-muted-foreground">
          Learn. Build. Level up.
        </p>
      </div>
      <div className="flex items-center justify-center bg-white px-4 py-12">
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
