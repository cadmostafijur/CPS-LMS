export const SITE_NAME = "CPS Academy";

export const SITE_TAGLINE =
  "Structured competitive programming education — courses, practice, and progress tracking for serious learners.";

export const TRADE_LICENSE = "TRAD/CHTG/011455/2025";

export const SUPPORT_EMAIL = "support@cpsacademy.io";
export const SUPPORT_PHONE = "(+88) 01759261490";

export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/cps-academy/",
  facebook: "https://www.facebook.com/bd.cpsacademy",
  youtube: "https://www.youtube.com/@CPSAcademy",
} as const;

export type MainNavLink = {
  href: string;
  label: string;
};

export const MAIN_NAV_LINKS: MainNavLink[] = [
  { href: "/courses", label: "Courses" },
  { href: "/bootcamp", label: "Bootcamp" },
  { href: "/#success-stories", label: "Success Stories" },
];

export const FOOTER_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/bootcamp", label: "Bootcamp" },
  { href: "/#success-stories", label: "Success Stories" },
  { href: "/about", label: "About us" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refund", label: "Refund policy" },
  { href: "/terms", label: "Terms & conditions" },
] as const;

export function isMainNavLinkActive(href: string, pathname: string): boolean {
  if (href === "/courses") {
    return pathname === "/courses" || pathname.startsWith("/courses/");
  }
  if (href === "/bootcamp") {
    return pathname === "/bootcamp" || pathname.startsWith("/bootcamp/");
  }
  if (href === "/#success-stories") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
