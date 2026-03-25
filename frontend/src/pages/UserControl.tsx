import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { KeyRound, ShieldAlert, ShieldCheck, Mail, Edit2, Trash2, Plus, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

const PERMISSION_OPTIONS = [
  "View Tickets",
  "Create Tickets",
  "Edit Clients",
  "Delete Records",
  "Manage Billing",
  "Export Data",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatUser = (user: any) => ({
   id: user.id,
   name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
   email: user.email,
   role: user.role === "ADMIN" ? "Admin" : (user.role === "MANAGER" ? "Manager" : "Agent"),
   permissions: user.permissions || [],
});

const UserControl = () => {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const { data: usersData = [], isLoading } = useQuery({
      queryKey: ["users"],
      queryFn: async () => {
          const res = await api.get("/api/users/");
          return Array.isArray(res.data) ? res.data : (res.data?.results || []);
      }
  });

  const users = usersData.map(formatUser);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"edit" | "access" | "delete" | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "AGENT" as "ADMIN" | "AGENT" | "MANAGER",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "Agent" as "Admin" | "Manager" | "Agent",
  });

  const canSubmitNewUser = useMemo(() => {
    return Boolean(
      newUser.username.trim() &&
      newUser.email.trim() &&
      newUser.password.trim() &&
      newUser.password.length >= 8
    );
  }, [newUser]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: newUser.username.trim(),
        first_name: newUser.first_name.trim(),
        last_name: newUser.last_name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        password: newUser.password,
      };
      const res = await api.post("/api/users/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("User created");
      setIsAddOpen(false);
      setNewUser({ username: "", first_name: "", last_name: "", email: "", role: "AGENT", password: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.password?.[0] ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        "Failed to create user";
      toast.error(msg);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      const [firstName, ...rest] = editForm.fullName.trim().split(/\s+/);
      const roleCode =
        editForm.role === "Admin"
          ? "ADMIN"
          : editForm.role === "Manager"
            ? "MANAGER"
            : "AGENT";
      const payload = {
        first_name: firstName || "",
        last_name: rest.join(" "),
        email: editForm.email.trim(),
        role: roleCode,
      };
      const res = await api.patch(`/api/users/${selectedUser.id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("User updated");
      setActionType(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.email?.[0] ||
        "Failed to update user";
      toast.error(msg);
    },
  });

  const [accessForm, setAccessForm] = useState<{ permissions: string[] }>({ permissions: [] });

  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      const payload = { permissions: accessForm.permissions };
      const res = await api.patch(`/api/users/${selectedUser.id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Permissions updated");
      setActionType(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        "Failed to update permissions";
      toast.error(msg);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openAction = (user: any, type: "edit" | "access" | "delete") => {
    setSelectedUser(user);
    setActionType(type);
  };

  useEffect(() => {
    if (!selectedUser || actionType !== "edit") return;
    setEditForm({
      fullName: selectedUser.name || "",
      email: selectedUser.email || "",
      role: (selectedUser.role || "Agent") as "Admin" | "Manager" | "Agent",
    });
  }, [selectedUser, actionType]);

  useEffect(() => {
    if (!selectedUser || actionType !== "access") return;
    setAccessForm({ permissions: selectedUser.permissions || [] });
  }, [selectedUser, actionType]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage system access, roles, and permissions</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex items-center gap-4 bg-primary/5 border-primary/20 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Users</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-destructive/5 border-destructive/20 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === "Admin").length}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Administrators</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 border shadow-sm">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === "Agent").length}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Agents</p>
          </div>
        </Card>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">User</th>
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Role</th>
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden sm:table-cell">Access Rights</th>
                <th className="text-right p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size="sm" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-sm text-muted-foreground">No users found.</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shadow-sm">
                        <AvatarFallback className={`text-xs font-semibold ${user.role === "Admin" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                          {user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${user.role === "Admin" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-accent/10 text-accent border border-accent/20"
                      }`}>
                      {user.role === "Admin" ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                      {user.permissions.length > 0 ? user.permissions.map(p => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full border bg-background font-medium text-muted-foreground shadow-sm">
                          {p}
                        </span>
                      )) : (
                        <span className="text-xs text-muted-foreground italic">No specific access</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openAction(user, "access")}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openAction(user, "edit")}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {/* User deletion is disabled for all roles; hide the delete action */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Dialog (Edit / Access) */}
      <Dialog open={actionType === "edit" || actionType === "access"} onOpenChange={() => setActionType(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "edit" ? "Edit User Profile" : "Manage Access Rights"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "edit" ? "Update user details and roles." : "Modify system permissions for this user."}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={selectedUser.role === "Admin" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}>
                    {selectedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Badge variant={selectedUser.role === "Admin" ? "destructive" : "default"} className="ml-auto">
                  {selectedUser.role}
                </Badge>
              </div>

              {actionType === "edit" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                      placeholder="Enter email"
                      type="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Role</Label>
                    <Select value={editForm.role} onValueChange={(v) => setEditForm((s) => ({ ...s, role: v as "Admin" | "Manager" | "Agent" }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {actionType === "access" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Current Permissions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map(p => {
                      const id = `perm-${p.replace(/\s+/g, "-").toLowerCase()}`;
                      const isChecked = accessForm.permissions.includes(p);
                      return (
                        <div key={p} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={id}
                            checked={isChecked}
                            onChange={(e) => {
                              const nextChecked = e.target.checked;
                              setAccessForm((s) => ({
                                ...s,
                                permissions: nextChecked
                                  ? Array.from(new Set([...s.permissions, p]))
                                  : s.permissions.filter((x) => x !== p),
                              }));
                            }}
                            className="rounded border-border"
                          />
                          <label htmlFor={id} className="text-sm select-none">{p}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (actionType === "edit") {
                  updateUserMutation.mutate();
                  return;
                }
                if (actionType === "access") {
                  updatePermissionsMutation.mutate();
                  return;
                }
                setActionType(null);
              }}
              disabled={updateUserMutation.isPending || updatePermissionsMutation.isPending}
            >
              {updateUserMutation.isPending || updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={actionType === "delete"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Remove User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{selectedUser?.name}</span>?
              This action cannot be undone and will permanently remove their access to the CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setActionType(null)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new agent/admin account.</DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">First name</Label>
                <Input value={newUser.first_name} onChange={(e) => setNewUser(s => ({ ...s, first_name: e.target.value }))} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Last name</Label>
                <Input value={newUser.last_name} onChange={(e) => setNewUser(s => ({ ...s, last_name: e.target.value }))} placeholder="Last name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Username</Label>
              <Input value={newUser.username} onChange={(e) => setNewUser(s => ({ ...s, username: e.target.value }))} placeholder="e.g. agent.john" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email</Label>
              <Input value={newUser.email} onChange={(e) => setNewUser(s => ({ ...s, email: e.target.value }))} placeholder="name@company.com" type="email" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser(s => ({ ...s, role: v as "ADMIN" | "AGENT" | "MANAGER" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Temporary password</Label>
              <Input value={newUser.password} onChange={(e) => setNewUser(s => ({ ...s, password: e.target.value }))} placeholder="Set a password" type="password" />
              <p className="text-xs text-muted-foreground">Minimum 8 characters. User can change it later.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={!canSubmitNewUser || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default UserControl;
