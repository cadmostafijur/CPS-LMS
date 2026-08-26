"use client";

import Image from "next/image";
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
  variant = "light",
}: {
  user?: AuthUser | null;
  variant?: "light" | "dark";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const role = getRoleName(user);
  const dash = dashboardPathForRole(role);
  const dark = variant === "dark";

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
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur",
        dark
          ? "border-white/10 bg-navy/80 text-white"
          : "border-border/60 bg-background/90"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="CPS Academy" width={36} height={36} priority />
          <span
            className={cn(
              "font-display text-lg font-bold tracking-tight",
              dark && "text-white"
            )}
          >
            CPS Academy
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                dark
                  ? "text-white/70 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
                pathname.startsWith(link.href) && (dark ? "text-gold" : "text-foreground")
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
                <Button
                  variant="ghost"
                  className={cn("gap-2 px-2", dark && "text-white hover:bg-white/10")}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gold text-navy text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-sm">
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
              <Button
                variant="ghost"
                className={cn(dark && "text-white hover:bg-white/10")}
                asChild
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button variant={dark ? "gold" : "default"} asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", dark && "text-white hover:bg-white/10")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {open ? (
        <div
          className={cn(
            "border-t px-4 py-4 md:hidden",
            dark ? "border-white/10" : "border-border"
          )}
        >
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("text-sm font-medium", dark && "text-white")}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href={dash}
                  className={cn(dark && "text-white")}
                  onClick={() => setOpen(false)}
                >
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
                <Link
                  href="/login"
                  className={cn(dark && "text-white")}
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className={cn(dark && "text-gold")}
                  onClick={() => setOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
