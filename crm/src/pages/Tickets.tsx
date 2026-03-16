import { useState } from "react";
import { tickets, pipelineStages, priorities, type PipelineStage, type Priority } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Eye, Edit2, Calendar, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const typeColors: Record<string, string> = {
  "New Policy": "text-primary border-primary/20 bg-primary/5",
  "Renewal": "text-accent border-accent/20 bg-accent/5",
  "Adjustment": "text-purple-500 border-purple-500/20 bg-purple-500/5",
  "Cancellation": "text-destructive border-destructive/20 bg-destructive/5",
};

const stageStyles: Record<string, string> = {
  "Lead/Inquiry": "bg-primary/10 text-primary border-primary/20",
  "Document Collection": "bg-warning/10 text-warning border-warning/20",
  "Processing": "bg-info/10 text-info border-info/20",
  "Completed": "bg-success/10 text-success border-success/20",
  "Discarded Leads": "bg-muted text-muted-foreground border-border",
};

const priorityStyles: Record<Priority, string> = {
  "High": "bg-destructive/10 text-destructive border-destructive/20",
  "Medium": "bg-warning/10 text-warning border-warning/20",
  "Low": "bg-success/10 text-success border-success/20",
};

const Tickets = () => {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  // Using generic `any` for ticket lists since it's mock
  const [ticketList, setTicketList] = useState<any[]>(tickets);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  const navigate = useNavigate();

  const filtered = ticketList.filter(t => {
    const matchSearch = t.clientName.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || t.stage === stageFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStage && matchPriority;
  });

  const handleStageChange = (ticketId: string, newStage: PipelineStage) => {
    setTicketList(prev => prev.map(t => t.id === ticketId ? { ...t, stage: newStage } : t));
  };

  const handlePriorityChange = (ticketId: string, newPriority: Priority) => {
    setTicketList(prev => prev.map(t => t.id === ticketId ? { ...t, priority: newPriority } : t));
  };

  const openModal = (ticket: any, type: "view" | "edit") => {
    setSelectedTicket(ticket);
    setModalType(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Insurance Tickets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Monitor and manage all insurance requests in one place</p>
        </div>
        <Button onClick={() => navigate("/new-ticket")} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets by ID or client..."
            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[140px] h-9 bg-secondary/50 border-0"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {pipelineStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px] h-9 bg-secondary/50 border-0"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1 bg-secondary/20">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{filtered.length}</span> tickets found
      </div>

      {/* Table View */}
      {viewMode === "list" ? (
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Ticket Info</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Request Type</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden md:table-cell">Stage</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden sm:table-cell">Priority</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden lg:table-cell">Assigned To</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden md:table-cell">Created</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{ticket.clientName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-primary font-medium">#{ticket.id.split("-")[1]}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{ticket.clientEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${typeColors[ticket.type]}`}>
                          {ticket.type}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{ticket.insuranceType}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Select value={ticket.stage} onValueChange={(v) => handleStageChange(ticket.id, v as PipelineStage)}>
                        <SelectTrigger className={`h-8 w-[150px] text-xs font-medium rounded-full border ${stageStyles[ticket.stage]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelineStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Select value={ticket.priority} onValueChange={(v) => handlePriorityChange(ticket.id, v as Priority)}>
                        <SelectTrigger className={`h-8 w-[110px] text-xs font-medium rounded-full border ${priorityStyles[ticket.priority]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map(p => (
                            <SelectItem key={p} value={p}>
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${p === "High" ? "bg-destructive" : p === "Medium" ? "bg-warning" : "bg-success"}`} />
                                {p}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border shadow-sm">
                          <AvatarFallback className="text-[10px] bg-secondary font-medium">{ticket.assignedTo[6] || "A"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{ticket.assignedTo}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {ticket.createdDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openModal(ticket, "view")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openModal(ticket, "edit")}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-muted-foreground text-sm">No tickets found matching your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(ticket => (
            <Card key={ticket.id} className="border shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono font-medium text-primary px-2 py-1 bg-primary/10 rounded-md">#{ticket.id.split("-")[1]}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openModal(ticket, "view")}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openModal(ticket, "edit")}><Edit2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-1 truncate">{ticket.clientName}</h3>
                <p className="text-sm text-muted-foreground truncate mb-4">{ticket.clientEmail}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${typeColors[ticket.type]}`}>{ticket.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stage</span>
                    <Select value={ticket.stage} onValueChange={(v) => handleStageChange(ticket.id, v as PipelineStage)}>
                      <SelectTrigger className={`h-6 w-auto border-0 p-0 hover:bg-transparent ${stageStyles[ticket.stage]?.split(" ")[1]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelineStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Priority</span>
                    <Select value={ticket.priority} onValueChange={(v) => handlePriorityChange(ticket.id, v as Priority)}>
                      <SelectTrigger className={`h-6 w-auto border-0 p-0 hover:bg-transparent ${priorityStyles[ticket.priority]?.split(" ")[1]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground mt-auto">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px] bg-secondary">{ticket.assignedTo[6] || "A"}</AvatarFallback></Avatar>
                  <span className="font-medium">{ticket.assignedTo}</span>
                </div>
                <span>{ticket.createdDate}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {modalType === "view" ? "Ticket Details" : "Edit Ticket"}
            </DialogTitle>
            <DialogDescription>
              {modalType === "view" ? "Viewing details for the selected ticket." : "Make changes to the ticket information."}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="py-4 space-y-4">
              {modalType === "view" ? (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Client Name</span>
                    <span className="text-sm col-span-3">{selectedTicket.clientName}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Email</span>
                    <span className="text-sm col-span-3">{selectedTicket.clientEmail}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Type</span>
                    <span className="text-sm col-span-3 font-medium">{selectedTicket.type}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Insurance</span>
                    <span className="text-sm col-span-3">{selectedTicket.insuranceType}</span>
                  </div>
                </>
              ) : modalType === "edit" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Client Name</Label>
                    <Input defaultValue={selectedTicket.clientName} placeholder="Enter client name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input defaultValue={selectedTicket.clientEmail} placeholder="Enter email" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Type</Label>
                    <Select defaultValue={selectedTicket.type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["New Policy", "Renewal", "Adjustment", "Cancellation"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Insurance Type</Label>
                    <Input defaultValue={selectedTicket.insuranceType} placeholder="e.g. Home, Auto" />
                  </div>
                </>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Close</Button>
            {modalType === "edit" && <Button onClick={() => setModalType(null)}>Save changes</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;
