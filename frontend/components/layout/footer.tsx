import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { copy } from "@/lib/site-copy";
import {
  FOOTER_LINKS,
  SITE_NAME,
  SITE_TAGLINE,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  TRADE_LICENSE,
} from "@/lib/site-nav";

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-orange/40 hover:bg-white/5 hover:text-orange"
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr]">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-3 sm:gap-4">
              <BrandLogo
                size={48}
                className="rounded-lg ring-1 ring-white/15 sm:h-12 sm:w-12"
              />
              <div className="min-w-0">
                <span className="block font-display text-xl font-bold leading-tight text-white sm:text-2xl">
                  {SITE_NAME}
                </span>
                <span className="mt-1 block text-sm text-white/55">
                  Competitive programming academy
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
              {SITE_TAGLINE}
            </p>
            <p className="mt-4 text-xs text-white/50">
              {copy.footer.tradeLicense}: {TRADE_LICENSE}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SocialIcon href={SOCIAL_LINKS.linkedin} label="LinkedIn">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.42v6.32zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL_LINKS.facebook} label="Facebook">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.5h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.5h-2.79v8.44C19.61 23.09 24 18.09 24 12.07z" />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL_LINKS.youtube} label="YouTube">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.55 3.5 12 3.5 12 3.5s-7.55 0-9.39.58A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12C4.45 20.5 12 20.5 12 20.5s7.55 0 9.39-.58a3 3 0 0 0 2.11-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-white/90">
              {copy.footer.links}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-orange"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-1.5 text-sm text-white/60">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="block break-all transition-colors hover:text-orange"
              >
                {SUPPORT_EMAIL}
              </a>
              <a
                href="tel:+8801759261490"
                className="block transition-colors hover:text-orange"
              >
                {SUPPORT_PHONE}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 sm:mt-10">
          <Image
            src="/ssl-payment-banner.png"
            alt={copy.footer.paymentAlt}
            width={900}
            height={72}
            className="mx-auto h-8 max-w-lg object-contain opacity-70 brightness-110 contrast-90 sm:h-9 md:max-w-xl"
          />
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs leading-relaxed text-white/45 sm:py-5">
        © {new Date().getFullYear()} CPS Academy. {copy.footer.copyright}
      </div>
    </footer>
  );
}
