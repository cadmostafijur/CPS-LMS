"use client";

import { useState } from "react";
import {
  partnerLogoFallbackUrl,
  partnerLogoUrl,
  type HiringPartner,
} from "@/lib/hiring-partners";

export function PartnerLogo({
  partner,
  size = 40,
}: {
  partner: HiringPartner;
  size?: number;
}) {
  const [src, setSrc] = useState(partnerLogoUrl(partner.domain));
  const [failed, setFailed] = useState(false);

  const initials = partner.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ width: size, height: size, backgroundColor: partner.color }}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${partner.name} logo`}
        width={size - 10}
        height={size - 10}
        className="object-contain"
        loading="lazy"
        onError={() => {
          if (src.includes("google.com")) {
            setSrc(partnerLogoFallbackUrl(partner.domain));
            return;
          }
          setFailed(true);
        }}
      />
    </div>
  );
}
