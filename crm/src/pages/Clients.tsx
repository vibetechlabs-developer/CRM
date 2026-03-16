import { useState } from "react";
import { clients, Client } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Mail, Phone, MapPin, Edit2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const Clients = () => {
  const [search, setSearch] = useState("");
  const [clientList, setClientList] = useState<Client[]>(clients);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [actionType, setActionType] = useState<"view" | "edit" | null>(null);

  const filtered = clientList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleAddClient = () => {
    setNewClient({ name: "", email: "", phone: "", address: "" });
    setShowAdd(false);
  };

  const openAction = (client: Client, type: "view" | "edit") => {
    setSelectedClient(client);
    setActionType(type);
  };
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
            <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></Label>
                <Input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Enter full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                <Input value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="Enter email" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone</Label>
                <Input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Enter phone number" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Address</Label>
                <Input value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} placeholder="Enter address" />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={handleAddClient} className="flex-1" disabled={!newClient.name || !newClient.email}>Add Client</Button>
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
        <span className="font-medium text-foreground">{filtered.length}</span> clients found
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
                        <p className="text-xs text-muted-foreground font-mono">{client.id}</p>
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
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
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
              ) : actionType === "edit" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input defaultValue={selectedClient.name} placeholder="Enter full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input defaultValue={selectedClient.email} placeholder="Enter email" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone</Label>
                    <Input defaultValue={selectedClient.phone || ""} placeholder="Enter phone number" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Address</Label>
                    <Input defaultValue={selectedClient.address || ""} placeholder="Enter address" />
                  </div>
                </>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Close</Button>
            {actionType === "edit" && <Button onClick={() => setActionType(null)}>Save changes</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
