"use client";

import { useState } from "react";
import { Briefcase, Globe2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/site-copy";

type JobType = "remote" | "local" | "international";

type PlacementCompany = {
  name: string;
  color: string;
  top: string;
  left: string;
};

const ALL_COMPANIES = [
  "WellDev",
  "Rokomari",
  "Vivasoft",
  "Truck Lagbe",
  "Chaldal",
  "CholoBD",
  "Brain Station 23",
] as const;

const placementMap: Record<JobType, PlacementCompany[]> = {
  remote: [
    { name: "WellDev", color: "#f97316", top: "34%", left: "52%" },
    { name: "Vivasoft", color: "#7c3aed", top: "48%", left: "72%" },
    { name: "SELISE", color: "#0ea5e9", top: "30%", left: "46%" },
    { name: "Brain Station 23", color: "#2563eb", top: "44%", left: "68%" },
    { name: "CholoBD", color: "#db2777", top: "52%", left: "74%" },
  ],
  local: [
    { name: "Brain Station 23", color: "#2563eb", top: "46%", left: "71%" },
    { name: "Rokomari", color: "#16a34a", top: "50%", left: "69%" },
    { name: "Truck Lagbe", color: "#dc2626", top: "48%", left: "73%" },
    { name: "Chaldal", color: "#059669", top: "52%", left: "70%" },
    { name: "CholoBD", color: "#db2777", top: "47%", left: "75%" },
    { name: "Vivasoft", color: "#7c3aed", top: "45%", left: "67%" },
  ],
  international: [
    { name: "WellDev", color: "#f97316", top: "32%", left: "50%" },
    { name: "SELISE", color: "#0ea5e9", top: "28%", left: "48%" },
    { name: "Brain Station 23", color: "#2563eb", top: "46%", left: "71%" },
    { name: "Vivasoft", color: "#7c3aed", top: "44%", left: "68%" },
    { name: "Rokomari", color: "#16a34a", top: "38%", left: "22%" },
    { name: "CholoBD", color: "#db2777", top: "50%", left: "74%" },
  ],
};

const tabs: { id: JobType; label: string; icon: typeof Briefcase }[] = [
  { id: "remote", label: "Remote jobs", icon: Globe2 },
  { id: "local", label: "Local jobs", icon: MapPin },
  { id: "international", label: "International jobs", icon: Briefcase },
];

function WorldMap() {
  return (
    <svg
      viewBox="0 0 800 420"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="mapGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0b1220" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="420" fill="url(#mapGlow)" />
      {/* Simplified continent silhouettes */}
      <g fill="#10b981" fillOpacity="0.22" stroke="#34d399" strokeOpacity="0.35" strokeWidth="0.8">
        <path d="M120 95c35-18 78-12 108 8 22 16 28 42 18 68-14 36-52 58-88 52-40-6-62-42-48-78 8-20 22-38 10-50z" />
        <path d="M155 195c28-8 52 4 62 28 10 28-6 58-34 68-30 12-64-4-72-32-8-30 14-58 44-64z" />
        <path d="M330 72c42-14 88-6 118 18 32 26 38 64 20 96-18 34-58 54-98 48-48-8-78-48-62-88 10-24 32-58 22-74z" />
        <path d="M355 175c22-6 48 2 58 22 12 24-4 52-30 60-28 10-58-6-64-30-6-26 16-46 36-52z" />
        <path d="M455 68c55-10 115 6 148 42 38 42 32 98-14 128-48 32-118 28-158-12-42-42-38-108 8-142 28-22 62-32 16-16z" />
        <path d="M520 195c38-6 72 12 82 44 12 36-12 72-48 82-40 12-82-10-88-44-6-38 24-72 54-82z" />
        <path d="M600 255c32-4 58 14 64 40 8 32-18 58-50 62-34 4-64-20-66-50-2-32 26-58 52-52z" />
      </g>
      {/* Grid meridians */}
      <g stroke="#34d399" strokeOpacity="0.12" fill="none" strokeWidth="0.6">
        {[160, 240, 320, 400, 480, 560, 640].map((x) => (
          <line key={`v${x}`} x1={x} y1="20" x2={x} y2="400" />
        ))}
        {[80, 140, 200, 260, 320].map((y) => (
          <line key={`h${y}`} x1="40" y1={y} x2="760" y2={y} />
        ))}
        <ellipse cx="400" cy="210" rx="340" ry="165" />
        <ellipse cx="400" cy="210" rx="260" ry="120" />
        <ellipse cx="400" cy="210" rx="170" ry="78" />
      </g>
      {/* Connection arcs */}
      <g stroke="#34d399" strokeOpacity="0.25" fill="none" strokeWidth="1" strokeDasharray="5 7">
        <path d="M520 175 Q400 120 280 155" />
        <path d="M560 190 Q480 100 400 130" />
        <path d="M570 210 Q650 160 720 185" />
      </g>
    </svg>
  );
}

function CompanyBadge({ company }: { company: PlacementCompany }) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{ top: company.top, left: company.left }}
    >
      <div className="relative flex items-center gap-1.5">
        <span
          className="absolute -left-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full opacity-80"
          style={{ backgroundColor: company.color, boxShadow: `0 0 12px ${company.color}` }}
          aria-hidden
        />
        <span
          className="relative h-2.5 w-2.5 rounded-full ring-2 ring-white/30"
          style={{ backgroundColor: company.color }}
          aria-hidden
        />
        <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-navy/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: company.color }}
          >
            {company.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="whitespace-nowrap text-xs font-semibold text-white">
            {company.name}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PlacementShowcase() {
  const [active, setActive] = useState<JobType>("remote");
  const companies = placementMap[active];

  return (
    <section className="border-y border-border bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              {copy.home.placementsEyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              {copy.home.placementsTitle}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              <span className="font-semibold text-navy">6,000+</span> students have
              secured jobs at companies across{" "}
              <span className="font-semibold text-navy">60+ countries</span>, and{" "}
              <span className="font-semibold text-navy">2,000+</span> learners have landed{" "}
              <span className="font-semibold text-orange">remote roles</span>.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {copy.home.placementsDesc}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActive(tab.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                      selected
                        ? "border-orange bg-orange/10 text-navy"
                        : "border-border bg-white text-muted-foreground hover:border-orange/30 hover:text-navy"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {ALL_COMPANIES.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-border bg-[#f6f8fb] px-3 py-1 text-xs font-medium text-navy/80"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-navy/20 bg-gradient-to-b from-[#0f1a2e] to-navy shadow-[0_20px_60px_-20px_rgba(11,18,32,0.45)] sm:min-h-[340px]">
            <WorldMap />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(249,115,22,0.08),transparent_55%)]"
              aria-hidden
            />
            {companies.map((company) => (
              <CompanyBadge key={`${active}-${company.name}`} company={company} />
            ))}
            <p className="absolute bottom-3 left-4 text-[10px] font-medium uppercase tracking-wider text-emerald-400/50">
              Global placement map
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
