"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LayoutDashboard, X, UserRound, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/shared/brand-logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SignOutButton, useSignOut } from "@/components/layout/sign-out-button";
import {
  dashboardPathForRole,
  getRoleName,
  notificationsPathForRole,
} from "@/lib/roles";
import type { AuthUser } from "@/types";
import { cn } from "@/lib/utils";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/blog", label: "Blog" },
];

export function Navbar({
  user,
  overHero = false,
}: {
  user?: AuthUser | null;
  /** Light header on dark hero image */
  overHero?: boolean;
  /** @deprecated Light header is always used */
  variant?: "light" | "dark";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const role = getRoleName(user);
  const dash = dashboardPathForRole(role);
  const notificationsHref = notificationsPathForRole(role);
  const handleSignOut = useSignOut({ onSignedOut: () => setOpen(false) });
  const isDashboard =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/content-manager");

  const initials =
    (user?.name || user?.email || "U")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 backdrop-blur-md",
        overHero
          ? "border-b border-white/10 bg-navy/50"
          : "border-b border-border/70 bg-white/95"
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 items-center gap-4 px-4 sm:px-6",
          isDashboard ? "max-w-[1400px]" : "max-w-6xl"
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-1 transition-opacity hover:opacity-90"
        >
          <BrandLogo
            size={36}
            priority
            className={cn(
              "rounded-lg shadow-sm",
              overHero ? "ring-1 ring-white/20" : "ring-1 ring-navy/10"
            )}
          />
          <span
            className={cn(
              "font-display text-lg font-bold tracking-tight sm:text-xl",
              overHero ? "text-white" : "text-navy"
            )}
          >
            CPS Academy
          </span>
        </Link>

        {!isDashboard ? (
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? overHero
                      ? "bg-white/15 text-white"
                      : "bg-orange/10 text-navy"
                    : overHero
                      ? "text-white/80 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-navy/5 hover:text-navy"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              {notificationsHref ? (
                <NotificationBell
                  href={notificationsHref}
                  className={overHero ? "text-white hover:bg-white/10" : undefined}
                />
              ) : null}
              <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-full p-0",
                        overHero
                          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                          : "border-border bg-white"
                      )}
                      aria-label={`${user.name || user.email || "Account"} menu`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className={cn(
                            "text-xs",
                            overHero ? "bg-white/20 text-white" : "bg-orange/15 text-orange"
                          )}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.name || "Account"}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {role} · {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(dash)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <UserRound className="mr-2 h-4 w-4" />
                      My profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => void handleSignOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="ghost"
                asChild
                className={overHero ? "text-white hover:bg-white/10 hover:text-white" : undefined}
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className={overHero ? "bg-orange text-white hover:bg-orange/90" : undefined}>
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn("md:hidden", overHero && "text-white hover:bg-white/10")}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {!isDashboard
              ? links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))
              : null}
            {user ? (
              <>
                <Link
                  href={dash}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  My profile
                </Link>
                {notificationsHref ? (
                  <Link
                    href={notificationsHref}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    Notifications
                  </Link>
                ) : null}
                <SignOutButton
                  variant="menu"
                  className="mt-1"
                  onSignedOut={() => setOpen(false)}
                />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-orange"
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
