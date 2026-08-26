"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/services/auth.service";
import { dashboardPathForRole, getRoleName } from "@/lib/roles";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get("name") || ""),
      username: String(form.get("username") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0] || "form")] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await register(parsed.data);
      toast.success("Your student account is ready");
      router.push(dashboardPathForRole(getRoleName(result.user)));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <p className="font-display text-2xl font-bold text-navy">Create account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Join CPS Academy as a student
        </p>
      </div>
      <div className="hidden lg:block">
        <p className="font-display text-3xl font-bold tracking-tight text-navy">
          Create your account
        </p>
        <p className="mt-2 text-muted-foreground">
          Public signup creates a Student account. Staff roles are invited by an
          admin.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" className="h-11" />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" autoComplete="username" className="h-11" />
          {errors.username ? (
            <p className="text-xs text-destructive">{errors.username}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" className="h-11" />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              className="h-11 pr-10"
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
        <Button type="submit" className="mt-2 h-11 w-full text-base" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-orange underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
