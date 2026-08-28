import { cn } from "@/lib/utils";

/** Crisp vector CPS mark — replaces low-res raster logo in footer and large displays. */
export function BrandMark({
  size = 48,
  className,
  "aria-label": ariaLabel = "CPS Academy",
}: {
  size?: number;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={ariaLabel}
    >
      <rect width="48" height="48" rx="10" fill="#0B1220" />
      <path
        d="M14 16c0-3.5 2.5-6 6-6 2.2 0 4 .9 5.1 2.4"
        stroke="#F5B800"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M34 16c0-3.5-2.5-6-6-6-2.2 0-4 .9-5.1 2.4"
        stroke="#F5B800"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14 32c0 3.5 2.5 6 6 6 2.2 0 4-.9 5.1-2.4"
        stroke="#F5B800"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M34 32c0 3.5-2.5 6-6 6-2.2 0-4-.9-5.1-2.4"
        stroke="#F5B800"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="2.2" fill="white" />
      <circle cx="28" cy="22" r="2.2" fill="white" />
      <path
        d="M22 28c1.2 1.4 2.8 2.2 4 2.2s2.8-.8 4-2.2"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 14v20M30 14v20"
        stroke="#F5B800"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
