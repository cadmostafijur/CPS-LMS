import { Award, BookOpen, Users } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

export function TrustStrip({ courseCount = 0 }: { courseCount?: number }) {
  const stats = [
    { icon: BookOpen, label: courseCount > 0 ? `${courseCount} courses` : "Courses catalog" },
    { icon: Users, label: "Learner-first platform" },
    { icon: Award, label: "Progress & certificates" },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/80 bg-white/90 px-5 py-4 shadow-[0_8px_30px_-12px_rgba(11,18,32,0.15)] backdrop-blur-sm sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <BrandLogo size={32} className="shrink-0 rounded-lg ring-1 ring-navy/10" />
          <p className="text-sm leading-snug text-muted-foreground">
            Trusted by learners preparing for{" "}
            <span className="font-medium text-navy">software engineering</span> interviews
            and contests
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {stats.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/80"
            >
              <item.icon className="h-3.5 w-3.5 text-orange" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
