import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CPS Academy" width={40} height={40} />
          <div>
            <p className="font-display text-lg font-semibold">CPS Academy</p>
            <p className="text-sm text-white/60">Learn. Build. Level up.</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-white/70">
          <Link href="/courses" className="hover:text-gold">
            Courses
          </Link>
          <Link href="/blog" className="hover:text-gold">
            Blog
          </Link>
          <Link href="/login" className="hover:text-gold">
            Sign in
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} CPS Academy. All rights reserved.
      </div>
    </footer>
  );
}
