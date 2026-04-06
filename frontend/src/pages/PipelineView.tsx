import { useState, useEffect } from "react";
import { PipelineStage, Ticket, getTypeDisplay, getStatusDisplay, getStatusBackendCode, getPriorityDisplay } from "@/lib/data";
import { PipelineCard } from "@/components/PipelineCard";
import { PipelineColumn } from "@/components/PipelineColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Flag, RefreshCw, Clock, CheckCircle, Trash2, SlidersHorizontal, X, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
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
import { useAuth } from "@/lib/auth";
import { exportTicketsToCSV } from "@/lib/utils";

const stageIcons: Record<string, React.ReactNode> = {
  "Lead/Inquiry": <Flag className="h-4 w-4" />,
  "Renewal": <RefreshCw className="h-4 w-4" />,
  "Follow Up": <Clock className="h-4 w-4" />,
  "Changes": <SlidersHorizontal className="h-4 w-4" />,
  "Completed": <CheckCircle className="h-4 w-4" />,
  "Discarded Leads": <Trash2 className="h-4 w-4" />,
};

const stageColors: Record<string, string> = {
  "Lead/Inquiry": "text-primary border-primary/20 bg-primary/10",
  "Renewal": "text-warning border-warning/20 bg-warning/10",
  "Follow Up": "text-info border-info/20 bg-info/10",
  "Changes": "text-purple-500 border-purple-500/20 bg-purple-500/10",
  "Completed": "text-success border-success/20 bg-success/10",
  "Discarded Leads": "text-muted-foreground border-border bg-muted",
};

// Stages shown on the visual pipeline board.
const pipelineBoardStages: PipelineStage[] = [
  "Lead/Inquiry",
  "Follow Up",
  "Completed",
  "Discarded Leads",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTicket = (t: any): Ticket => {
    const { client_name = "", client_last_name = "" } = t;
    const computedName = `${client_name} ${client_last_name}`.trim();
    const assignedToDisplay =
        t.assigned_to_name ||
        t.assigned_to_username ||
        (t.assigned_to ? `User ${t.assigned_to}` : null);

    const typeDisplay = getTypeDisplay(t.ticket_type);
    const stageForProjectPipeline = getStatusDisplay(t.status) as PipelineStage;

    return {
        id: String(t.id),
        ticket_no: t.ticket_no,
        clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
        clientPhone: t.client_phone || "",
        clientAddress: t.client_address || "",
        clientOccupation: t.client_occupation || "",
        type: typeDisplay,
        stage: stageForProjectPipeline,
        priority: getPriorityDisplay(t.priority),
        createdDate: new Date(t.created_at).toLocaleDateString(),
        assignedTo: assignedToDisplay || "Unassigned",
        insuranceType: t.insurance_type || t.insuranceType || "",
        clientEmail: t.client_email || t.clientEmail || "",
        createdAtRaw: t.created_at,
        details: t.details,
        additionalNotes: t.additional_notes || "",
        // Note: For typing to work flawlessly we map `id` to string in UI
    } as any;
};

const PipelineView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [filterMonth, setFilterMonth] = useState<string>(String(currentMonth));
  const [filterYear, setFilterYear] = useState<string>(String(currentYear));
  const [filterDate, setFilterDate] = useState<string>("");

  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ ticketId: string; fromStage: PipelineStage; toStage: PipelineStage } | null>(null);

  const { data: ticketsData, isLoading } = useQuery({
      queryKey: ["tickets"],
      queryFn: async () => {
          return await fetchAllPages("/api/tickets/?ordering=-created_at");
      }
  });

  useEffect(() => {
    import("@/lib/normalize").then(({ normalizeListResponse }) => {
      const safeTickets = normalizeListResponse(ticketsData);
			// Show all tickets in the pipeline (no type-based filtering)
			setLocalTickets(safeTickets.map(formatTicket));
    });
  }, [ticketsData]);

  const updateTicketMutation = useMutation({
      mutationFn: async ({ id, status }: { id: string, status: string }) => {
          const res = await api.post(`/api/tickets/${id}/change_status/`, { status });
          return res.data;
      },
      onMutate: async ({ id, status }) => {
          await queryClient.cancelQueries({ queryKey: ["tickets"] });
          const previousTickets = queryClient.getQueryData(["tickets"]);
          
          queryClient.setQueryData(["tickets"], (old: any) => {
              if (!old) return old;
              return old.map((t: any) => 
                  String(t.id) === String(id) ? { ...t, status: status } : t
              );
          });
          
          return { previousTickets };
      },
      onError: (err, variables, context: any) => {
          if (context?.previousTickets) {
              queryClient.setQueryData(["tickets"], context.previousTickets);
          }
      },
      onSettled: () => {
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "Ticket") {
      setActiveTicket(active.data.current.ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;

    if (!over) return;

    const ticketId = active.id as string;
    const newStage = over.id as PipelineStage;
    const ticket = localTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const fromStage = ticket.stage;
    const role = String(user?.role || "").trim().toUpperCase();
    const canMoveFromCompleted = role === "ADMIN" || role === "MANAGER";
    if (fromStage === "Completed" && !canMoveFromCompleted) {
      toast.error("Completed ticket cannot be moved to another stage.");
      return;
    }
    if (fromStage === newStage) return;

    setPendingMove({ ticketId, fromStage, toStage: newStage });
    setIsMoveConfirmOpen(true);
  };

  const confirmMove = () => {
    if (!pendingMove) return;
    const { ticketId, toStage } = pendingMove;

    // Optimistically update
    setLocalTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, stage: toStage };
      }
      return t;
    }));

    // Dispatch update to API
    updateTicketMutation.mutate({
      id: ticketId,
      status: getStatusBackendCode(toStage)
    });
    setIsMoveConfirmOpen(false);
    setPendingMove(null);
  };

  const handleDiscard = (ticketId: string) => {
    const ticket = localTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const role = String(user?.role || "").trim().toUpperCase();
    const canMoveFromCompleted = role === "ADMIN" || role === "MANAGER";
    if (ticket.stage === "Completed" && !canMoveFromCompleted) {
      toast.error("Completed ticket cannot be moved to another stage.");
      return;
    }

    setLocalTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, stage: "Discarded Leads" } : t))
    );

    updateTicketMutation.mutate({
      id: ticketId,
      status: "DISCARDED",
    });
  };

	const filteredTickets = localTickets.filter(t => {
    if (!t.createdAtRaw) return true;
    const tDate = new Date(t.createdAtRaw);
    if (isNaN(tDate.getTime())) return true;

    const isTerminal = t.stage === "Completed" || t.stage === "Discarded Leads";

    if (filterDate) {
      const dDate = new Date(filterDate);
      if (isTerminal) {
        return tDate.getFullYear() === dDate.getFullYear() &&
               tDate.getMonth() === dDate.getMonth() &&
               tDate.getDate() === dDate.getDate();
      } else {
        const tDateStart = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        const dDateStart = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
        return tDateStart.getTime() <= dDateStart.getTime();
      }
    } else {
      if (filterYear === "all" && filterMonth === "all") return true;

      const fYear = filterYear !== "all" ? parseInt(filterYear) : null;
      const fMonth = filterMonth !== "all" ? parseInt(filterMonth) - 1 : null;

      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();

      if (isTerminal) {
        if (fYear !== null && tYear !== fYear) return false;
        if (fMonth !== null && tMonth !== fMonth) return false;
        return true;
      } else {
        if (fYear !== null) {
          if (tYear > fYear) return false;
          if (tYear === fYear && fMonth !== null && tMonth > fMonth) return false;
        } else {
          if (fMonth !== null && tMonth > fMonth) return false;
        }
        return true;
      }
    }
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-shrink">
          <h1 className="text-2xl font-bold truncate">Project Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5 truncate">Manage and track client requests through different stages</p>
        </div>
        <div className="flex flex-nowrap items-center gap-3 shrink-0 overflow-x-auto sm:overflow-visible">
          <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-lg border shadow-sm">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={String(m)}>
                    {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center relative">
              <Input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-auto h-8 text-xs pr-8"
              />
              {filterDate && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 absolute right-1 hover:bg-transparent" 
                  onClick={() => setFilterDate("")}
                  title="Clear Date"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="gap-2 shrink-0"
              onClick={() => {
                const completedTickets = filteredTickets.filter(t => t.stage === "Completed");
                if (completedTickets.length === 0) {
                  toast.error("No completed tickets found for the selected period.");
                  return;
                }
                exportTicketsToCSV(completedTickets, "project_tickets_completed.csv");
              }}
            >
              <Download className="h-4 w-4" /> Export Completed
            </Button>
            <Button 
              className="gap-2 shrink-0" 
              onClick={() => navigate("/new-ticket")}
            >
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start pb-4 w-full">
          {isLoading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground gap-2">
              <Spinner size="md" />
              <span>Loading pipeline...</span>
            </div>
          ) : pipelineBoardStages.map((stage) => {
            const stageTickets = filteredTickets.filter(t => t.stage === stage);

            const colorString = stageColors[stage] || "text-muted-foreground border-border bg-muted";
            const colors = colorString.split(" ");
            const textColor = colors[0];
            const borderColor = colors[1];
            const bgColor = colors[2];

            return (
              <div key={stage} className="flex flex-col">
                <div className={`flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl border ${bgColor} ${borderColor}`}>
                  <div className="flex items-center gap-2">
                    <span className={textColor}>{stageIcons[stage]}</span>
                    <h3 className={`text-sm font-bold tracking-wide ${textColor}`}>{stage}</h3>
                  </div>
                  <span className="text-xs bg-background/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-semibold border shadow-sm">{stageTickets.length}</span>
                </div>

                <PipelineColumn id={stage}>
                  {stageTickets.map((ticket) => (
                    <PipelineCard
                      key={"item-" + ticket.id}
                      ticket={ticket}
                      onDiscard={handleDiscard}
                      isDiscarding={updateTicketMutation.isPending}
                    />
                  ))}
                  {stageTickets.length === 0 && (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-lg border-border/50 text-muted-foreground text-sm font-medium">
                      No tickets in this stage
                    </div>
                  )}
                </PipelineColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <div className="w-[calc(100vw-3rem)] md:w-[300px] opacity-90 cursor-grabbing rotate-3">
              <PipelineCard ticket={activeTicket} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog
        open={isMoveConfirmOpen}
        onOpenChange={(open) => {
          setIsMoveConfirmOpen(open);
          if (!open) setPendingMove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm ticket move</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove
                ? `Move this ticket from ${pendingMove.fromStage} to ${pendingMove.toStage}?`
                : "Are you sure you want to move this ticket?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMove}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PipelineView;
