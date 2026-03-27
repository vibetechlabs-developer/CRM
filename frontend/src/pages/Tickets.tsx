import { useMemo, useState, useEffect } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  "New Policy": "text-primary border-primary/20 bg-primary/5",
  "Renewal": "text-accent border-accent/20 bg-accent/5",
  "Adjustment": "text-purple-500 border-purple-500/20 bg-purple-500/5",
  "Cancellation": "text-destructive border-destructive/20 bg-destructive/5",
  "Changes": "text-purple-500 border-purple-500/20 bg-purple-500/5",
  "Customer Issue": "text-purple-500 border-purple-500/20 bg-purple-500/5",
};

function useDebouncedValue<T>(value: T, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

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

const requestTypeOptions = [
  { label: "New Policy", value: "NEW" },
  { label: "Renewal", value: "RENEWAL" },
  { label: "Adjustment", value: "ADJUSTMENT" },
  { label: "Customer Issue", value: "CUSTOMER_ISSUE" },
  { label: "Cancellation", value: "CANCELLATION" },
];

const Tickets = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    ticketId: number;
    fromStage: PipelineStage | string;
    toStage: PipelineStage;
  } | null>(null);

  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", page, debouncedSearch, stageFilter, priorityFilter, requestTypeFilter, assignedToFilter],
    queryFn: async () => {
      const statusParam = stageFilter !== "all" ? getStatusBackendCode(stageFilter) : undefined;
      const priorityParam = priorityFilter !== "all" ? getPriorityBackendCode(priorityFilter) : undefined;
      const requestTypeParam = requestTypeFilter !== "all" ? requestTypeFilter : undefined;
      const assignedToParam = user?.role === "ADMIN" && assignedToFilter !== "all"
        ? Number(assignedToFilter)
        : undefined;
      
      const response = await api.get("/api/tickets/", {
        params: {
          page,
          search: debouncedSearch || undefined,
          status: statusParam,
          priority: priorityParam,
          ticket_type: requestTypeParam,
          assigned_to: assignedToParam,
          ordering: "-created_at"
        }
      });
      
      const payload = response.data;
      const rawItems = Array.isArray(payload) ? payload : (payload.results || []);
      const totalCount = !Array.isArray(payload) && typeof payload.count === "number" ? payload.count : rawItems.length;
      
      return { items: rawItems, totalCount };
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Record<string, unknown> }) => {
      const response = await api.patch(`/api/tickets/${id}/`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] });
      
      queryClient.setQueriesData({ queryKey: ["tickets"] }, (old: any) => {
        if (!old) return old;
        if (old.items) {
          return { ...old, items: old.items.map((t: any) => String(t.id) === String(id) ? { ...t, ...data } : t) };
        }
        if (Array.isArray(old)) {
          return old.map((t: any) => String(t.id) === String(id) ? { ...t, ...data } : t);
        }
        return old;
      });
      
      return {};
    },
    onSuccess: () => {
      setModalType(null); // Close modal on success if editing
    },
    onError: (err, variables, context: any) => {
      // optimistic rollback omitted for simplicity on paginated queries
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
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
    onMutate: async () => {
      const text = noteText.trim();
      if (!text) return;
      await queryClient.cancelQueries({ queryKey: ["ticket-notes", selectedTicketId] });
      const previousNotes = queryClient.getQueryData(["ticket-notes", selectedTicketId]);
      
      queryClient.setQueryData(["ticket-notes", selectedTicketId], (old: any) => {
        const newNote = {
          id: Date.now(), // optimistic ID
          content: text,
          created_at: new Date().toISOString(),
          agent_name: user?.name || user?.username || "You",
          agent: user?.id
        };
        return [newNote, ...(Array.isArray(old) ? old : [])];
      });
      
      return { previousNotes };
    },
    onSuccess: () => {
      setNoteText("");
    },
    onError: (err, variables, context: any) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(["ticket-notes", selectedTicketId], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-notes", selectedTicketId] });
    },
  });
  const rawTickets: BackendTicket[] = useMemo(() => data?.items || [], [data]);
  const formattedTickets = useMemo(() => rawTickets.map(formatBackendTicket), [rawTickets]);

  const { data: usersData = [] } = useQuery({
    queryKey: ["users"],
    enabled: user?.role === "ADMIN",
    queryFn: async () => {
      const allUsers = await fetchAllPages("/api/users/");
      return (Array.isArray(allUsers) ? allUsers : []) as BackendUser[];
    },
  });

  const agents = usersData.filter((u) =>
    ["AGENT", "MANAGER", "ADMIN"].includes(String(u.role || "").toUpperCase())
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stageFilter, priorityFilter, requestTypeFilter, assignedToFilter]);

  const totalCount = data?.totalCount || 0;
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const paginatedTickets = formattedTickets;
  const filtered = formattedTickets;

  const handleStageChange = (ticketId: number, newStage: PipelineStage) => {
    const ticket = formattedTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    if (String(ticket.stage) === "Completed" && String(newStage) !== "Completed") {
      toast.error("Completed ticket cannot be moved to another stage.");
      return;
    }
    if (ticket.stage === newStage) return;

    setPendingStatusChange({
      ticketId,
      fromStage: ticket.stage,
      toStage: newStage,
    });
    setIsStatusConfirmOpen(true);
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    if (String(pendingStatusChange.fromStage) === "Completed" && String(pendingStatusChange.toStage) !== "Completed") {
      toast.error("Completed ticket cannot be moved to another stage.");
      setIsStatusConfirmOpen(false);
      setPendingStatusChange(null);
      return;
    }
    updateTicketMutation.mutate({
      id: pendingStatusChange.ticketId,
      data: { status: getStatusBackendCode(pendingStatusChange.toStage) },
    });
    setIsStatusConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handlePriorityChange = (ticketId: number, newPriority: Priority) => {
    updateTicketMutation.mutate({ id: ticketId, data: { priority: getPriorityBackendCode(newPriority) } });
  };

  const handleDiscard = (ticketId: number) => {
    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: "DISCARDED" },
    });
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
      <div className="flex flex-col gap-3 bg-card p-3 rounded-xl border shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets by ID or client..."
            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap md:justify-end">
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 border-0 sm:w-[150px]"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {pipelineStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 border-0 sm:w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 border-0 sm:w-[180px]"><SelectValue placeholder="Request Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Request Types</SelectItem>
                {requestTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user?.role === "ADMIN" && (
              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger className="h-9 w-full bg-secondary/50 border-0 sm:w-[170px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      {`${agent.first_name || ""} ${agent.last_name || ""}`.trim() || agent.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1 bg-secondary/20 md:ml-1">
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
        <span className="font-medium text-foreground">{totalCount}</span> tickets found
      </div>

      {/* Table View */}
      {viewMode === "list" ? (
        <>
          <TicketList
            tickets={paginatedTickets}
            isLoading={isLoading}
            typeColors={typeColors}
            stageStyles={stageStyles}
            priorityStyles={priorityStyles}
            onStageChange={handleStageChange}
            onPriorityChange={handlePriorityChange}
            onView={(t) => openModal(t, "view")}
            onEdit={(t) => openModal(t, "edit")}
          />
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm px-4">
                    Page {page} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
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
        onSaveEdit={({ id, status, priority, insuranceType, assignedToId }) => {
          const ticket = formattedTickets.find((t) => t.id === id);
          const isStageChanged = !!ticket && String(ticket.stage) !== String(status);

          if (ticket && isStageChanged) {
            if (String(ticket.stage) === "Completed" && String(status) !== "Completed") {
              toast.error("Completed ticket cannot be moved to another stage.");
              return;
            }
            setPendingStatusChange({
              ticketId: id,
              fromStage: ticket.stage,
              toStage: status as PipelineStage,
            });
            setIsStatusConfirmOpen(true);
            return;
          }

          updateTicketMutation.mutate({
            id,
            data: {
              status: getStatusBackendCode(status),
              priority: getPriorityBackendCode(priority),
              insurance_type: insuranceType,
              ...(user?.role === "ADMIN" ? { assigned_to: assignedToId } : {}),
            },
          });
        }}
        isSaving={updateTicketMutation.isPending}
        onDiscard={handleDiscard}
        isDiscarding={updateTicketMutation.isPending}
      />

      <AlertDialog
        open={isStatusConfirmOpen}
        onOpenChange={(open) => {
          setIsStatusConfirmOpen(open);
          if (!open) setPendingStatusChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm ticket move</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange
                ? `Move this ticket from ${pendingStatusChange.fromStage} to ${pendingStatusChange.toStage}?`
                : "Are you sure you want to move this ticket?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tickets;
