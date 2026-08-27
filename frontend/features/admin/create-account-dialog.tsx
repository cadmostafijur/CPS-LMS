"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_ROLES, ROLE_NAMES, type RoleName } from "@/lib/roles";
import { bffFetch, ApiError } from "@/lib/api";
import type { User } from "@/types";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let out = "Aa1!";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  defaultRole = ROLE_NAMES.STUDENT,
  lockRole = false,
  title = "Create account",
  description = "Create a login account and share the credentials with the person.",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: RoleName;
  lockRole?: boolean;
  title?: string;
  description?: string;
  onCreated?: (user: User) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: defaultRole,
  });
  const [saving, setSaving] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setForm({
      name: "",
      email: "",
      password: "",
      role: defaultRole,
    });
    setCreatedCreds(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function createUser() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await bffFetch<{ data: User }>("/api/lms/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      setCreatedCreds({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      onCreated?.(res.data);
      toast.success(`${form.role} account created`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials() {
    if (!createdCreds) return;
    const text = [
      `CPS Academy account`,
      `Role: ${createdCreds.role}`,
      `Name: ${createdCreds.name}`,
      `Email: ${createdCreds.email}`,
      `Password: ${createdCreds.password}`,
      `Login: /login`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Credentials copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {createdCreds ? (
          <>
            <DialogHeader>
              <DialogTitle>Account ready — share credentials</DialogTitle>
              <DialogDescription>
                Copy these once and send them securely. The password is not shown
                again after you close this dialog.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-xl border border-border bg-surface/80 p-4 font-mono text-sm">
              <p>
                <span className="text-muted-foreground">Role:</span> {createdCreds.role}
              </p>
              <p>
                <span className="text-muted-foreground">Name:</span> {createdCreds.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {createdCreds.email}
              </p>
              <p>
                <span className="text-muted-foreground">Password:</span>{" "}
                {createdCreds.password}
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
              <Button onClick={() => void copyCredentials()}>
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" /> Copy credentials
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="acct-name">Full name</Label>
                <Input
                  id="acct-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acct-email">Email</Label>
                <Input
                  id="acct-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acct-password">Temporary password</Label>
                <div className="flex gap-2">
                  <Input
                    id="acct-password"
                    type="text"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Min. 8 characters"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Generate password"
                    onClick={() =>
                      setForm((f) => ({ ...f, password: generatePassword() }))
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!lockRole ? (
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, role: value as RoleName }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Role: <span className="font-medium text-navy">{form.role}</span>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={saving} onClick={() => void createUser()}>
                {saving ? "Creating…" : "Create account"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
