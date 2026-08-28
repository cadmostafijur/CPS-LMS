"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** CPS Academy logo mark. */
export function BrandLogo({
  size = 36,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md bg-navy font-display text-xs font-bold text-orange",
          className
        )}
        style={{ width: size, height: size }}
        aria-label="CPS Academy"
      >
        CPS
      </span>
    );
  }

  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-md", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="CPS Academy"
        width={size}
        height={size}
        priority={priority}
        unoptimized
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
