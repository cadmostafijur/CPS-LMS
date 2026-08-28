import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Join now" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/student/dashboard", label: "Student dashboard" },
      { href: "/courses", label: "Browse catalog" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={40} className="rounded-lg ring-1 ring-white/15" />
            <span className="font-display text-lg font-semibold">CPS Academy</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            Structured courses, progress tracking, and auto-graded quizzes for
            aspiring software engineers.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-display text-sm font-semibold text-white/90">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-orange"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} CPS Academy. All rights reserved.
      </div>
    </footer>
  );
}
