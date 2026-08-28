"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, notify } from "@/lib/notify";
import { logout } from "@/services/auth.service";
import { copy } from "@/lib/site-copy";
import { cn } from "@/lib/utils";

type SignOutOptions = {
  onSignedOut?: () => void;
};

export function useSignOut({ onSignedOut }: SignOutOptions = {}) {
  const router = useRouter();

  return async function handleLogout() {
    const ok = await notify.confirm({
      title: copy.nav.signOutConfirm,
      text: "You will need to sign in again to access your dashboard.",
      confirmLabel: copy.nav.signOut,
      cancelLabel: "Stay signed in",
      destructive: true,
    });
    if (!ok) return;
    try {
      await logout();
      toast.success("You have signed out");
      onSignedOut?.();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  };
}

type SignOutButtonProps = SignOutOptions & {
  variant?: "icon" | "menu" | "sidebar";
  className?: string;
};

export function SignOutButton({
  variant = "icon",
  className,
  onSignedOut,
}: SignOutButtonProps) {
  const handleLogout = useSignOut({ onSignedOut });

  if (variant === "menu") {
    return (
      <button
        type="button"
        className={cn(
          "rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-destructive hover:bg-destructive/5",
          className
        )}
        onClick={() => void handleLogout()}
      >
        {copy.nav.signOut}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/5",
          className
        )}
        onClick={() => void handleLogout()}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{copy.nav.signOut}</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 shrink-0 text-navy hover:bg-navy/5",
        className
      )}
      onClick={() => void handleLogout()}
      aria-label={copy.nav.signOut}
      title={copy.nav.signOut}
    >
      <LogOut className="h-5 w-5" strokeWidth={2} />
    </Button>
  );
}
