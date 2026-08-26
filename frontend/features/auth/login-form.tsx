"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/auth.service";
import { dashboardPathForRole, getRoleName } from "@/lib/roles";
import { ApiError } from "@/lib/api";

const schema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const values = { identifier, password };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await login(parsed.data.identifier, parsed.data.password);
      toast.success("Welcome back to CPS Academy");
      const role = getRoleName(result.user);
      router.push(next || dashboardPathForRole(role));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <p className="font-display text-2xl font-bold text-navy">Sign in</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Access your CPS Academy workspace
        </p>
      </div>
      <div className="hidden lg:block">
        <p className="font-display text-3xl font-bold tracking-tight text-navy">
          Welcome back
        </p>
        <p className="mt-2 text-muted-foreground">
          Sign in with your CPS Academy account to continue learning or managing
          the platform.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="identifier">Email or username</Label>
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            placeholder="you@example.com"
            className="h-11"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          {errors.identifier ? (
            <p className="text-xs text-destructive">{errors.identifier}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password}</p>
          ) : null}
        </div>
        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New student?{" "}
        <Link
          href="/register"
          className="font-semibold text-orange underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
