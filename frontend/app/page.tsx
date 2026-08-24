import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-navy text-white">
      <Navbar user={user} />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl animate-soft-pulse" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-orange/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center">
          <Image
            src="/logo.png"
            alt="CPS Academy"
            width={112}
            height={112}
            priority
            className="animate-fade-up drop-shadow-[0_0_40px_rgba(245,197,24,0.35)]"
          />
          <p className="animate-fade-up mt-6 font-display text-4xl font-bold tracking-tight text-gold sm:text-5xl md:text-6xl">
            CPS Academy
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-2xl font-display text-2xl font-semibold text-white sm:text-3xl">
            Master skills with structured courses and real progress.
          </h1>
          <p className="animate-fade-up-delay mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            A modern learning platform built for students, instructors, and teams.
          </p>
          <div className="animate-fade-up-delay mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="gold" asChild>
              <Link href="/courses">
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href={user ? "/dashboard" : "/login"}>Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
