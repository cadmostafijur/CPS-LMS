"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Save, Shield } from "lucide-react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bffFetch, ApiError } from "@/lib/api";
import { getRoleName } from "@/lib/roles";
import type { AuthUser } from "@/types";

export function ProfileManager({ user }: { user: AuthUser }) {
  const router = useRouter();
  const role = getRoleName(user);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
  });

  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const initials =
    (form.name || user.email || "U")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await bffFetch("/api/lms/me", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim() || undefined,
          phone: form.phone.trim() || null,
          avatarUrl: form.avatarUrl.trim() || null,
        }),
      });
      toast.success("Profile saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setPwdSaving(true);
    try {
      await bffFetch("/api/lms/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pwd.currentPassword,
          newPassword: pwd.newPassword,
        }),
      });
      toast.success("Password updated");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-navy via-navy to-navy-2 px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-white/20">
            {form.avatarUrl ? <AvatarImage src={form.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-orange/20 text-lg font-semibold text-orange">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange">
              Your profile
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              {form.name || "Account"}
            </h1>
            <p className="mt-1 text-sm text-white/65">
              {user.email}
              {role ? ` · ${role}` : ""}
            </p>
          </div>
          {role ? (
            <Badge className="ml-auto bg-white/10 text-white hover:bg-white/15">{role}</Badge>
          ) : null}
        </div>
      </div>

      <PageHeader
        title="Account settings"
        description="Changes are saved to Strapi and stored in the database."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Profile details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void saveProfile(e)}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Email is your login identity and cannot be changed here.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  placeholder="+880…"
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={form.avatarUrl}
                  placeholder="https://…"
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                />
              </div>
              <Button type="submit" className="gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Shield className="h-4 w-4 text-orange" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void changePassword(e)}>
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    className="pr-10"
                    value={pwd.currentPassword}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label="Toggle current password"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    className="pr-10"
                    value={pwd.newPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label="Toggle new password"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={pwd.confirmPassword}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" variant="outline" disabled={pwdSaving}>
                {pwdSaving ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
