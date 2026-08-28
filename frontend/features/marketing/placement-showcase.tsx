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

const placementMap: Record<JobType, PlacementCompany[]> = {
  remote: [
    { name: "WellDev", color: "#f97316", top: "16%", left: "58%" },
    { name: "Vivasoft", color: "#7c3aed", top: "48%", left: "22%" },
    { name: "SELISE", color: "#0ea5e9", top: "68%", left: "52%" },
    { name: "Brain Station 23", color: "#2563eb", top: "32%", left: "72%" },
  ],
  local: [
    { name: "Brain Station 23", color: "#2563eb", top: "20%", left: "65%" },
    { name: "Rokomari", color: "#16a34a", top: "42%", left: "30%" },
    { name: "Truck Lagbe", color: "#dc2626", top: "58%", left: "68%" },
    { name: "Chaldal", color: "#059669", top: "74%", left: "38%" },
    { name: "Vivasoft", color: "#7c3aed", top: "28%", left: "18%" },
  ],
  international: [
    { name: "WellDev", color: "#f97316", top: "18%", left: "55%" },
    { name: "SELISE", color: "#0ea5e9", top: "35%", left: "75%" },
    { name: "Brain Station 23", color: "#2563eb", top: "52%", left: "25%" },
    { name: "Vivasoft", color: "#7c3aed", top: "65%", left: "62%" },
    { name: "Rokomari", color: "#16a34a", top: "78%", left: "42%" },
  ],
};

const tabs: { id: JobType; label: string; icon: typeof Briefcase }[] = [
  { id: "remote", label: "Remote jobs", icon: Globe2 },
  { id: "local", label: "Local jobs", icon: MapPin },
  { id: "international", label: "International jobs", icon: Briefcase },
];

function CompanyBadge({ company }: { company: PlacementCompany }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-300"
      style={{ top: company.top, left: company.left }}
    >
      <div className="relative">
        <span
          className="absolute -left-1 -top-1 h-3 w-3 rounded-full blur-[2px]"
          style={{ backgroundColor: company.color }}
          aria-hidden
        />
        <span
          className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-white/20"
          style={{ backgroundColor: company.color }}
          aria-hidden
        />
        <div className="ml-3 mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a2332]/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
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
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1524] via-navy to-[#0a101c] shadow-[0_24px_80px_-24px_rgba(11,18,32,0.65)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              {copy.home.placementsEyebrow}
            </p>
            <p className="mt-4 font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
              <span className="text-orange">6,000+</span> students have secured jobs at
              companies across <span className="text-orange">60+</span> countries, and{" "}
              <span className="text-orange">2,000+</span> learners have landed remote
              roles.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
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
                        ? "border-orange/50 bg-orange/15 text-white"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "WellDev",
                "Rokomari",
                "Vivasoft",
                "Truck Lagbe",
                "Chaldal",
                "Brain Station 23",
              ].map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-emerald-500/15 bg-[#0a121f] sm:min-h-[300px]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(16, 185, 129, 0.12) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(16, 185, 129, 0.12) 1px, transparent 1px)
                `,
                backgroundSize: "32px 32px",
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]"
              aria-hidden
            />
            <svg
              className="absolute inset-0 h-full w-full text-emerald-400/20"
              viewBox="0 0 400 260"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <path
                d="M40 130 Q120 80 200 120 T360 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <path
                d="M60 180 Q180 140 280 170 T380 150"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            </svg>

            {companies.map((company) => (
              <CompanyBadge key={`${active}-${company.name}`} company={company} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
