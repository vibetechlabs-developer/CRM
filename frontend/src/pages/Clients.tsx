import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Mail, Phone, MapPin, Edit2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Client } from "@/lib/data";

const Clients = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      // Backend is mounted under /api/, and DRF router registers 'clients' there -> /api/clients/
      const response = await api.get("/api/clients/", {
        params: search ? { search } : undefined,
      });

      // Support both plain list responses and paginated `{ results: [...] }` responses
      const payload = response.data as any[] | { results?: any[] };

      const rawItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.results)
        ? payload.results
        : [];

      // Normalize backend payload shape to our `Client` type used in the UI
      const normalized: Client[] = rawItems.map((item) => {
        const firstName = item.first_name ?? "";
        const lastName = item.last_name ?? "";
        const fullName = `${firstName} ${lastName}`.trim() || item.name || "Unknown";

        // Backend numeric id
        const backendId = item.id != null ? String(item.id) : "";

        // Business client code
        const clientCode =
          (typeof item.client_id === "string" && item.client_id) || backendId;

        // Format created_at into a readable date, fallback to empty string
        let addedDate = "";
        if (item.created_at) {
          const d = new Date(item.created_at);
          if (!Number.isNaN(d.getTime())) {
            addedDate = d.toLocaleDateString(undefined, {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
          }
        }

        return {
          id: backendId,
          clientCode,
          name: fullName,
          firstName,
          lastName,
          email: item.email ?? "",
          phone: item.phone ?? "",
          address: item.address ?? "",
          // Backend will later provide real policy counts; default to 0 for now
          policies: typeof item.policies === "number" ? item.policies : 0,
          addedDate,
        };
      });

      return normalized;
    },
  });

  const [clientList, setClientList] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [actionType, setActionType] = useState<"view" | "edit" | null>(null);
  const [editClient, setEditClient] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
  } | null>(null);

  useEffect(() => {
    if (Array.isArray(data)) {
      setClientList(data);
    } else {
      setClientList([]);
    }
  }, [data]);

  const filtered: Client[] = Array.isArray(clientList) ? clientList : [];

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== "string") {
      return "?";
    }
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const addClientMutation = useMutation({
    mutationFn: async () => {
      // Backend expects first_name, last_name, email, phone, and optional address
      const payload = {
        first_name: newClient.first_name,
        last_name: newClient.last_name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
      };
      const response = await api.post("/api/clients/", payload);
      return response.data;
    },
    onSuccess: () => {
      // Refresh clients list after successful creation
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowAdd(false);
      setNewClient({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
      });
    },
  });

  const handleAddClient = () => {
    addClientMutation.mutate();
  };

  const openAction = (client: Client, type: "view" | "edit") => {
    setSelectedClient(client);
    setActionType(type);

    if (type === "edit") {
      const [firstNameFromName = "", ...restName] = client.name.split(" ");
      const lastNameFromName = restName.join(" ");

      setEditClient({
        first_name: client.firstName ?? firstNameFromName,
        last_name: client.lastName ?? lastNameFromName,
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
      });
    }
  };

  const updateClientMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !editClient) return;
      const payload = {
        first_name: editClient.first_name,
        last_name: editClient.last_name,
        email: editClient.email,
        phone: editClient.phone,
        address: editClient.address,
      };
      const response = await api.patch(`/api/clients/${selectedClient.id}/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setActionType(null);
      setSelectedClient(null);
      setEditClient(null);
    },
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your client database</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new client record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={newClient.first_name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, first_name: e.target.value })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={newClient.last_name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, last_name: e.target.value })
                  }
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                  placeholder="Enter email"
                  type="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Address</Label>
                <Input
                  value={newClient.address}
                  onChange={(e) =>
                    setNewClient({ ...newClient, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAdd(false)}
                  disabled={addClientMutation.status === "pending"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddClient}
                  className="flex-1"
                  disabled={
                    !newClient.first_name ||
                    !newClient.last_name ||
                    !newClient.email ||
                    addClientMutation.status === "pending"
                  }
                >
                  {addClientMutation.status === "pending" ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="pl-10" />
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isLoading ? (
          <span className="font-medium text-foreground">Loading clients...</span>
        ) : isError ? (
          <span className="font-medium text-destructive">Error loading clients</span>
        ) : (
          <>
            <span className="font-medium text-foreground">{filtered.length}</span> clients found
          </>
        )}
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Client</th>
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden lg:table-cell">Address</th>
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Policies</th>
                <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden md:table-cell">Added</th>
                <th className="text-right p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{client.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {client.clientCode ?? client.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />{client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[180px] truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{client.address || "—"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${client.policies > 0 ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                      {client.policies} {client.policies === 1 ? "Policy" : "Policies"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{client.addedDate}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openAction(client, "view")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openAction(client, "edit")}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground text-sm">No clients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={!!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setSelectedClient(null);
            setEditClient(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "view" ? "Client Details" : "Edit Client"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "view" ? "Viewing details for the selected client." : "Make changes to the client's information."}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="py-4 space-y-4">
              {actionType === "view" ? (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Name</span>
                    <span className="text-sm col-span-3 font-semibold">{selectedClient.name}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Email</span>
                    <span className="text-sm col-span-3">{selectedClient.email}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Phone</span>
                    <span className="text-sm col-span-3">{selectedClient.phone || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground mt-1">Address</span>
                    <span className="text-sm col-span-3">{selectedClient.address || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Policies</span>
                    <span className="text-sm col-span-3">
                      <span className="inline-flex items-center justify-center bg-secondary px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {selectedClient.policies}
                      </span>
                    </span>
                  </div>
                </>
              ) : actionType === "edit" && editClient ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={editClient.first_name}
                      onChange={(e) =>
                        setEditClient({ ...editClient, first_name: e.target.value })
                      }
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={editClient.last_name}
                      onChange={(e) =>
                        setEditClient({ ...editClient, last_name: e.target.value })
                      }
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input
                      value={editClient.email}
                      onChange={(e) =>
                        setEditClient({ ...editClient, email: e.target.value })
                      }
                      placeholder="Enter email"
                      type="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone</Label>
                    <Input
                      value={editClient.phone}
                      onChange={(e) =>
                        setEditClient({ ...editClient, phone: e.target.value })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Address</Label>
                    <Input
                      value={editClient.address}
                      onChange={(e) =>
                        setEditClient({ ...editClient, address: e.target.value })
                      }
                      placeholder="Enter address"
                    />
                  </div>
                </>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setSelectedClient(null);
                setEditClient(null);
              }}
            >
              Close
            </Button>
            {actionType === "edit" && editClient && (
              <Button
                onClick={() => updateClientMutation.mutate()}
                disabled={
                  updateClientMutation.status === "pending" ||
                  !editClient.first_name ||
                  !editClient.last_name ||
                  !editClient.email
                }
              >
                {updateClientMutation.status === "pending" ? "Saving..." : "Save changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
