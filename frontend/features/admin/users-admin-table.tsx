"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { ALL_ROLES, ROLE_NAMES, type RoleName } from "@/lib/roles";
import { bffFetch, ApiError } from "@/lib/api";
import type { User } from "@/types";

export function UsersAdminTable({ currentUserId }: { currentUserId: string | number }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [pending, startTransition] = useTransition();
  const [roleChange, setRoleChange] = useState<{
    user: User;
    role: RoleName;
  } | null>(null);

  function load() {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (debounced) params.set("search", debounced);
        if (role !== "all") params.set("role", role);
        if (status !== "all") params.set("isActive", status);
        const res = await bffFetch<{ data: User[] }>(
          `/api/lms/admin/users?${params.toString()}`
        );
        setUsers(res.data || []);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load users");
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, role, status]);

  async function applyRoleChange(confirmSelf = false) {
    if (!roleChange) return;
    try {
      await bffFetch(`/api/lms/admin/users/${roleChange.user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role: roleChange.role,
          confirmSelfRoleChange: confirmSelf,
        }),
      });
      toast.success("Role updated");
      setRoleChange(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Role update failed");
    }
  }

  async function toggleStatus(user: User) {
    const next = !(user.isActive ?? !user.blocked);
    try {
      await bffFetch(`/api/lms/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      });
      toast.success(next ? "User activated" : "User deactivated");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Status update failed");
    }
  }

  const isSelfChange =
    roleChange && String(roleChange.user.id) === String(currentUserId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search, change roles, and activate or deactivate accounts."
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name or email…"
          className="sm:max-w-sm"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const active = user.isActive ?? !user.blocked;
              return (
                <TableRow key={String(user.id)}>
                  <TableCell>
                    <div className="font-medium">{user.name || user.username || "—"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role?.name || ROLE_NAMES.STUDENT}
                      onValueChange={(value) =>
                        setRoleChange({ user, role: value as RoleName })
                      }
                    >
                      <SelectTrigger className="w-44">
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
                  </TableCell>
                  <TableCell>
                    <Badge variant={active ? "success" : "danger"}>
                      {active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending || String(user.id) === String(currentUserId)}
                      onClick={() => void toggleStatus(user)}
                    >
                      {active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={roleChange != null}
        onOpenChange={(open) => !open && setRoleChange(null)}
        title={isSelfChange ? "Change your own role?" : "Change user role?"}
        description={
          isSelfChange
            ? "Changing your Admin role can lock you out. Confirm only if you understand the risk."
            : `Set ${roleChange?.user.email} to ${roleChange?.role}?`
        }
        confirmLabel={isSelfChange ? "Yes, change my role" : "Confirm"}
        onConfirm={() => applyRoleChange(Boolean(isSelfChange))}
      />
    </div>
  );
}
