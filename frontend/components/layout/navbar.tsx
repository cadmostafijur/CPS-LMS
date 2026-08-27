"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, LayoutDashboard, X, UserRound } from "lucide-react";
import { useState } from "react";
import { toast, notify } from "@/lib/notify";
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
import { logout } from "@/services/auth.service";
import { dashboardPathForRole, getRoleName } from "@/lib/roles";
import type { AuthUser } from "@/types";
import { cn } from "@/lib/utils";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/blog", label: "Blog" },
];

export function Navbar({
  user,
}: {
  user?: AuthUser | null;
  /** @deprecated Light header is always used */
  variant?: "light" | "dark";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const role = getRoleName(user);
  const dash = dashboardPathForRole(role);
  const isDashboard =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/content-manager");

  async function handleLogout() {
    const ok = await notify.confirm({
      title: "Sign out?",
      text: "You will need to sign in again to access your dashboard.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
      destructive: true,
    });
    if (!ok) return;
    try {
      await logout();
      toast.success("You have signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  const initials =
    (user?.name || user?.email || "U")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex h-[4.25rem] items-center justify-between gap-3 px-4",
          isDashboard ? "max-w-[1400px]" : "max-w-6xl"
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-1 transition-opacity hover:opacity-90"
        >
          <BrandLogo size={42} priority className="rounded-lg shadow-sm ring-1 ring-navy/10" />
          <span className="font-display text-lg font-bold tracking-tight text-navy sm:text-xl">
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
                    ? "bg-orange/10 text-navy"
                    : "text-muted-foreground hover:bg-navy/5 hover:text-navy"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-border bg-white px-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange/15 text-xs text-orange">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm text-navy sm:inline">
                    {user.name || user.email}
                  </span>
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
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
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
                <button
                  type="button"
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-destructive hover:bg-destructive/5"
                  onClick={() => {
                    setOpen(false);
                    void handleLogout();
                  }}
                >
                  Sign out
                </button>
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
