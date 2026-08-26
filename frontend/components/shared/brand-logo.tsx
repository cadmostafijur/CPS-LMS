import Image from "next/image";
import { cn } from "@/lib/utils";

/** CPS Academy mark — logo already includes navy ground; don't double-frame it. */
export function BrandLogo({
  size = 36,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
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
        className="h-full w-full object-contain"
      />
    </span>
  );
}
