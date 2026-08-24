import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sign in",
  description: "Sign in to CPS Academy",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,197,24,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.2),transparent_40%)]" />
        <Link href="/" className="relative z-10 flex items-center gap-3 text-white">
          <Image src="/logo.png" alt="CPS Academy" width={44} height={44} />
          <span className="font-display text-xl font-bold">CPS Academy</span>
        </Link>
        <div className="relative z-10 max-w-md text-white">
          <p className="font-display text-3xl font-semibold">
            Continue your learning journey
          </p>
          <p className="mt-3 text-white/70">
            Courses, quizzes, and progress — all in one modern platform.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/40">Learn. Build. Level up.</p>
      </div>
      <div className="flex items-center justify-center bg-surface px-4 py-12">
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
