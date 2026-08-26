import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";
import { BrandLogo } from "@/components/shared/brand-logo";

export const metadata = {
  title: "Create account",
  description: "Join CPS Academy",
};

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(249,115,22,0.12),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(11,18,32,0.05),transparent_40%)]" />
        <Link href="/" className="relative z-10 flex items-center gap-3 text-navy">
          <BrandLogo size={44} priority />
          <span className="font-display text-xl font-bold">CPS Academy</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl font-semibold text-navy">
            Start learning with CPS Academy
          </p>
          <p className="mt-3 text-muted-foreground">
            Create your account and enroll in courses built for real skills.
          </p>
        </div>
        <p className="relative z-10 text-sm text-muted-foreground">
          Structured software engineering education.
        </p>
      </div>
      <div className="flex items-center justify-center bg-white px-4 py-12">
        <RegisterForm />
      </div>
    </div>
  );
}
