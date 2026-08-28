"use client";

import { useState } from "react";
import { Briefcase, Building2, Globe2, MapPin, TrendingUp } from "lucide-react";
import { PartnerLogo } from "@/components/shared/partner-logo";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/site-copy";
import {
  companiesByType,
  type HiringPartner,
  type JobType,
} from "@/lib/hiring-partners";

const stats = [
  { value: "6,000+", label: "Students placed", icon: TrendingUp },
  { value: "60+", label: "Countries", icon: Globe2 },
  { value: "2,000+", label: "Remote roles", icon: Briefcase },
] as const;

const tabMeta: Record<
  JobType,
  { label: string; icon: typeof Globe2; headline: string; sub: string }
> = {
  remote: {
    label: "Remote",
    icon: Globe2,
    headline: "Work from anywhere",
    sub: "Graduates land fully remote roles at product companies worldwide.",
  },
  local: {
    label: "Local",
    icon: MapPin,
    headline: "Top teams in Bangladesh",
    sub: "On-site and hybrid roles at leading local tech companies.",
  },
  international: {
    label: "International",
    icon: Building2,
    headline: "Global opportunities",
    sub: "Students placed across Asia, Europe, and beyond.",
  },
};

function CompanyCard({ partner }: { partner: HiringPartner }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-[#f6f8fb] p-3.5 transition hover:border-orange/25 hover:bg-white hover:shadow-sm">
      <PartnerLogo partner={partner} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy">{partner.name}</p>
        <p className="truncate text-xs text-muted-foreground">{partner.location}</p>
      </div>
    </div>
  );
}

export function PlacementShowcase() {
  const [active, setActive] = useState<JobType>("remote");
  const companies = companiesByType[active];
  const meta = tabMeta[active];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">
            {copy.home.placementsEyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {copy.home.placementsTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            {copy.home.placementsDesc}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-navy">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-border bg-[#f6f8fb]/80 p-4 sm:px-6">
            {(Object.keys(tabMeta) as JobType[]).map((key) => {
              const tab = tabMeta[key];
              const Icon = tab.icon;
              const selected = active === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActive(key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    selected
                      ? "border-orange bg-orange text-white shadow-sm shadow-orange/20"
                      : "border-border bg-white text-muted-foreground hover:border-orange/30 hover:text-navy"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label} jobs
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:gap-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange">
                {meta.label} placements
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-navy sm:text-2xl">
                {meta.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {meta.sub}
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hiring partners
              </p>
              <div key={active} className="grid gap-3 sm:grid-cols-2">
                {companies.map((partner) => (
                  <CompanyCard key={partner.id} partner={partner} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
