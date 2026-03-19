import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import {
  pipelineStages,
  priorities,
  type BackendTicket,
  type BackendTicketNote,
  type BackendUser,
  type PipelineStage,
  type Priority,
  type TicketRow,
  formatBackendTicket,
  getPriorityBackendCode,
  getStatusBackendCode,
} from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Edit2, Calendar, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketGrid } from "@/components/tickets/TicketGrid";
import { TicketActionModals } from "@/components/tickets/TicketActionModals";
import { normalizeListResponse } from "@/lib/normalize";

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
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const queryClient = useQueryClient();

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);
  const [noteText, setNoteText] = useState("");

  const navigate = useNavigate();

  const { data: ticketsData = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      return await fetchAllPages("/api/tickets/");
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Record<string, unknown> }) => {
      const response = await api.patch(`/api/tickets/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setModalType(null); // Close modal on success if editing
    },
  });

  const selectedTicketId = selectedTicket?.id;
  const notesEnabled = !!selectedTicketId && modalType === "view";

  const { data: notes = [], isLoading: isNotesLoading } = useQuery({
    queryKey: ["ticket-notes", selectedTicketId],
    enabled: notesEnabled,
    queryFn: async () => {
      const res = await api.get(`/api/tickets/${selectedTicketId}/notes/`);
      return (Array.isArray(res.data) ? res.data : []) as BackendTicketNote[];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const text = noteText.trim();
      if (!text) return;
      const res = await api.post(`/api/tickets/${selectedTicketId}/notes/`, { content: text });
      return res.data;
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["ticket-notes", selectedTicketId] });
    },
  });
  const rawTickets: BackendTicket[] = normalizeListResponse<BackendTicket>(ticketsData);
  const formattedTickets = useMemo(() => rawTickets.map(formatBackendTicket), [rawTickets]);

  const { data: usersData = [] } = useQuery({
    queryKey: ["users"],
    enabled: user?.role === "ADMIN",
    queryFn: async () => {
      const res = await api.get("/api/users/");
      return (Array.isArray(res.data) ? res.data : (res.data?.results || [])) as BackendUser[];
    },
  });

  const agents = usersData.filter((u) => u.role === "AGENT");

  const filtered = formattedTickets.filter((t) => {
    const matchSearch =
      t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      String(t.ticket_no).toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || String(t.stage) === stageFilter;
    const matchPriority = priorityFilter === "all" || String(t.priority) === priorityFilter;
    return matchSearch && matchStage && matchPriority;
  });

  const handleStageChange = (ticketId: number, newStage: PipelineStage) => {
    updateTicketMutation.mutate({ id: ticketId, data: { status: getStatusBackendCode(newStage) } });
  };

  const handlePriorityChange = (ticketId: number, newPriority: Priority) => {
    updateTicketMutation.mutate({ id: ticketId, data: { priority: getPriorityBackendCode(newPriority) } });
  };

  const openModal = (ticket: TicketRow, type: "view" | "edit") => {
    setSelectedTicket(ticket);
    setModalType(type);
    setNoteText("");
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
        <TicketList
          tickets={filtered}
          isLoading={isLoading}
          typeColors={typeColors}
          stageStyles={stageStyles}
          priorityStyles={priorityStyles}
          onStageChange={handleStageChange}
          onPriorityChange={handlePriorityChange}
          onView={(t) => openModal(t, "view")}
          onEdit={(t) => openModal(t, "edit")}
        />
      ) : (
        /* Grid View */
        <TicketGrid
          tickets={filtered}
          isLoading={isLoading}
          typeColors={typeColors}
          stageStyles={stageStyles}
          priorityStyles={priorityStyles}
          onStageChange={handleStageChange}
          onPriorityChange={handlePriorityChange}
          onView={(t) => openModal(t, "view")}
          onEdit={(t) => openModal(t, "edit")}
        />
      )}

      <TicketActionModals
        modalType={modalType}
        setModalType={setModalType}
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        userRole={user?.role}
        agents={agents}
        notes={notes}
        isNotesLoading={isNotesLoading}
        noteText={noteText}
        setNoteText={setNoteText}
        isAddingNote={addNoteMutation.isPending}
        onAddNote={() => addNoteMutation.mutate()}
        onSaveAdminAssignment={(ticketId, assignedToId) =>
          updateTicketMutation.mutate({
            id: ticketId,
            data: { assigned_to: assignedToId },
          })
        }
        isSaving={updateTicketMutation.isPending}
      />
    </div>
  );
};

export default Tickets;
