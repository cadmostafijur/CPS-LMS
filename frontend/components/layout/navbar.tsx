"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo size={36} priority />
          <span className="font-display text-lg font-bold tracking-tight text-navy">
            CPS Academy
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "text-navy"
                  : "text-muted-foreground hover:text-navy"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange/15 text-orange text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-sm text-navy">
                    {user.name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name || "Account"}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(dash)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleLogout()}>
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
                <Link href="/register">Join now</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={dash} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="text-left text-sm font-medium text-destructive"
                  onClick={() => void handleLogout()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="font-semibold text-orange"
                  onClick={() => setOpen(false)}
                >
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
