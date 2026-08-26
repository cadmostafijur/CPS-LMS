"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/notify";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bffFetch, ApiError } from "@/lib/api";

export function SettingsAdminForm() {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    organizationName: "CPS Academy",
    contactEmail: "hello@cps.academy",
    currency: "USD",
    timezone: "Asia/Dhaka",
  });

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await bffFetch<{ data: typeof form }>("/api/lms/admin/settings");
        setForm((s) => ({ ...s, ...res.data }));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load settings");
      }
    });
  }, []);

  async function save() {
    try {
      await bffFetch("/api/lms/admin/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization defaults for branding, currency, and contact."
        actions={
          <Button onClick={save} disabled={pending}>
            Save
          </Button>
        }
      />
      <div className="grid max-w-xl gap-4 rounded-xl border border-border bg-card p-6">
        {(
          [
            ["organizationName", "Organization name"],
            ["contactEmail", "Contact email"],
            ["currency", "Currency"],
            ["timezone", "Timezone"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={form[key]}
              onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
