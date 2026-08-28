import Link from "next/link";
import { GraduationCap, LineChart, Users } from "lucide-react";
import { RegisterForm } from "@/features/auth/register-form";
import { BrandLogo } from "@/components/shared/brand-logo";

export const metadata = {
  title: "Create account",
  description: "Join CPS Academy",
};

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <BrandLogo size={48} priority className="rounded-xl ring-1 ring-white/20" />
          <span className="font-display text-xl font-bold">CPS Academy</span>
        </Link>
        <div className="relative z-10 max-w-md space-y-6">
          <p className="font-display text-4xl font-bold leading-tight">
            Start your student journey
          </p>
          <p className="text-base text-white/70">
            Enroll in courses, track lessons, take quizzes, and earn certificates.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            {[
              { icon: GraduationCap, text: "Student dashboard on day one" },
              { icon: LineChart, text: "Live progress across courses" },
              { icon: Users, text: "Learn with CPS Academy instructors" },
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
        <p className="relative z-10 pb-2 text-sm text-white/50">
          © {new Date().getFullYear()} CPS Academy
        </p>
      </aside>
      <div className="flex flex-col justify-center bg-gradient-to-b from-surface to-white px-4 py-12 sm:px-8">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandLogo size={40} priority className="rounded-lg" />
          <span className="font-display text-lg font-bold text-navy">CPS Academy</span>
        </div>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
