"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: ROLE_NAMES.STUDENT as RoleName,
  });

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

  async function toggleBan(user: User) {
    const active = user.isActive ?? !user.blocked;
    const next = !active;
    try {
      await bffFetch(`/api/lms/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      });
      toast.success(next ? "User unbanned" : "User banned");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Status update failed");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await bffFetch(`/api/lms/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("User deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function createUser() {
    try {
      await bffFetch(`/api/lms/admin/users`, {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      toast.success("User created");
      setCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: ROLE_NAMES.STUDENT,
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const isSelfChange =
    roleChange && String(roleChange.user.id) === String(currentUserId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Create accounts for any role, ban, or permanently delete users."
        actions={
          <Button onClick={() => setCreateOpen(true)}>Create user</Button>
        }
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
            <SelectItem value="false">Banned</SelectItem>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const active = user.isActive ?? !user.blocked;
              const isSelf = String(user.id) === String(currentUserId);
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
                      {active ? "Active" : "Banned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || isSelf}
                        onClick={() => void toggleBan(user)}
                      >
                        {active ? "Ban" : "Unban"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending || isSelf}
                        onClick={() => setDeleteTarget(user)}
                      >
                        Delete
                      </Button>
                    </div>
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

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user permanently?"
        description={`This removes ${deleteTarget?.email} and their enrollments, progress, and certificates. This cannot be undone.`}
        confirmLabel="Delete user"
        destructive
        onConfirm={() => void confirmDelete()}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              Create a real account for any role (Admin, Content Manager, Instructor, or Student).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Full name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) =>
                  setCreateForm((f) => ({ ...f, role: value as RoleName }))
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createUser()}>Create account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
