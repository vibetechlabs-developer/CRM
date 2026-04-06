import { useState, useEffect } from "react";
import { PipelineStage, Ticket, getTypeDisplay, getStatusDisplay, getStatusBackendCode, getPriorityDisplay } from "@/lib/data";
import { PipelineCard } from "@/components/PipelineCard";
import { PipelineColumn } from "@/components/PipelineColumn";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import { normalizeListResponse } from "@/lib/normalize";
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

const renewalPipelineStages: PipelineStage[] = ["Renewal", "Follow Up", "Completed", "Discarded Leads"];

const stageIcons: Record<string, React.ReactNode> = {
  "Renewal": <RefreshCw className="h-4 w-4" />,
  "Follow Up": <Clock className="h-4 w-4" />,
  "Completed": <CheckCircle className="h-4 w-4" />,
  "Discarded Leads": <Trash2 className="h-4 w-4" />,
};

const stageColors: Record<string, string> = {
  "Renewal": "text-warning border-warning/20 bg-warning/10",
  "Follow Up": "text-info border-info/20 bg-info/10",
  "Completed": "text-success border-success/20 bg-success/10",
  "Discarded Leads": "text-muted-foreground border-border bg-muted",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTicket = (t: any): Ticket => {
  const { client_name = "", client_last_name = "" } = t;
  const computedName = `${client_name} ${client_last_name}`.trim();
  const assignedToDisplay =
    t.assigned_to_name ||
    t.assigned_to_username ||
    (t.assigned_to ? `User ${t.assigned_to}` : null);
  const displayStatus = getStatusDisplay(t.status) as PipelineStage | string;
  const stageForRenewalPipeline: PipelineStage =
    displayStatus === "Completed"
      ? "Completed"
      : displayStatus === "Follow Up"
        ? "Follow Up"
        : displayStatus === "Discarded Leads"
          ? "Discarded Leads"
          : "Renewal";

  return {
    id: String(t.id),
    ticket_no: t.ticket_no,
    clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
    clientPhone: t.client_phone || "",
    clientAddress: t.client_address || "",
    clientOccupation: t.client_occupation || "",
    type: getTypeDisplay(t.ticket_type),
    stage: stageForRenewalPipeline,
    priority: getPriorityDisplay(t.priority),
    createdDate: new Date(t.created_at).toLocaleDateString(),
    assignedTo: assignedToDisplay || "Unassigned",
    insuranceType: t.insurance_type || t.insuranceType || "",
    clientEmail: t.client_email || t.clientEmail || "",
    createdAtRaw: t.created_at,
    details: t.details,
    additionalNotes: t.additional_notes || "",
  } as any;
};

const RenewalPipelineView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ ticketId: string; fromStage: PipelineStage; toStage: PipelineStage } | null>(null);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      return await fetchAllPages("/api/tickets/?ordering=-created_at");
    },
  });

  useEffect(() => {
    const safeTickets = normalizeListResponse(ticketsData);
    const formatted = safeTickets
      .filter((t: any) => String(t?.ticket_type || "").toUpperCase() === "RENEWAL")
      .map(formatTicket);
    setLocalTickets(formatted);
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
    onError: (_err, _variables, context: any) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets"], context.previousTickets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
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

  const confirmMove = () => {
    if (!pendingMove) return;
    const { ticketId, toStage } = pendingMove;
    setLocalTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, stage: toStage } : t)));
    updateTicketMutation.mutate({
      id: ticketId,
      status: getStatusBackendCode(toStage),
    });
    setIsMoveConfirmOpen(false);
    setPendingMove(null);
  };

	// Show all renewal tickets without date-based filtering
	const filteredTickets = localTickets;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Renewal Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage and track renewal requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/new-ticket")} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start pb-4 w-full">
          {isLoading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground gap-2">
              <Spinner size="md" />
              <span>Loading pipeline...</span>
            </div>
          ) : renewalPipelineStages.map((stage) => {
            const stageTickets = filteredTickets.filter((t) => t.stage === stage);
            const colors = stageColors[stage].split(" ");
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

export default RenewalPipelineView;

