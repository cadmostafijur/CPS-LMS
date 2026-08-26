import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, ClipboardCheck, ShieldCheck } from "lucide-react";
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
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <BrandLogo size={48} priority className="rounded-xl ring-1 ring-white/20" />
          <span className="font-display text-xl font-bold">CPS Academy</span>
        </Link>
        <div className="relative z-10 max-w-md space-y-6">
          <p className="font-display text-4xl font-bold leading-tight">
            Learn. Build. Compete.
          </p>
          <p className="text-base text-white/70">
            Structured software engineering courses with progress tracking,
            quizzes, and certificates.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            {[
              { icon: BookOpen, text: "Published course catalog" },
              { icon: ClipboardCheck, text: "Auto-graded quizzes" },
              { icon: ShieldCheck, text: "Role-based dashboards" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange/20 text-orange">
                  <item.icon className="h-4 w-4" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} CPS Academy
        </p>
      </aside>
      <div className="flex flex-col justify-center bg-gradient-to-b from-surface to-white px-4 py-12 sm:px-8">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandLogo size={40} priority className="rounded-lg" />
          <span className="font-display text-lg font-bold text-navy">CPS Academy</span>
        </div>
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
