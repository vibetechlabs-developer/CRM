import { useState, useEffect } from "react";
import { pipelineStages, PipelineStage, Ticket } from "@/lib/data";
import { PipelineCard } from "@/components/PipelineCard";
import { PipelineColumn } from "@/components/PipelineColumn";
import { Button } from "@/components/ui/button";
import { Plus, Flag, FolderOpen, Cog, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

const stageIcons: Record<string, React.ReactNode> = {
  "Lead/Inquiry": <Flag className="h-4 w-4" />,
  "Document Collection": <FolderOpen className="h-4 w-4" />,
  "Processing": <Cog className="h-4 w-4" />,
  "Completed": <CheckCircle className="h-4 w-4" />,
  "Discarded Leads": <XCircle className="h-4 w-4" />,
};

const stageColors: Record<string, string> = {
  "Lead/Inquiry": "text-primary border-primary/20 bg-primary/10",
  "Document Collection": "text-warning border-warning/20 bg-warning/10",
  "Processing": "text-info border-info/20 bg-info/10",
  "Completed": "text-success border-success/20 bg-success/10",
  "Discarded Leads": "text-muted-foreground border-border bg-muted",
};

const getTypeDisplay = (backendCode: string) => {
    switch(backendCode) {
        case "NEW": return "New Policy";
        case "RENEWAL": return "Renewal";
        case "ADJUSTMENT": return "Adjustment";
        case "CANCELLATION": return "Cancellation";
        default: return "Unknown";
    }
};

const getStatusDisplay = (backendCode: string) => {
    switch(backendCode) {
        case "LEAD": return "Lead/Inquiry";
        case "DOCS": return "Document Collection";
        case "PROCESSING": return "Processing";
        case "COMPLETED": return "Completed";
        case "DISCARDED": return "Discarded Leads";
        default: return "Unknown Phase";
    }
};

const getStatusBackendCode = (displayCode: string) => {
    switch(displayCode) {
        case "Lead/Inquiry": return "LEAD";
        case "Document Collection": return "DOCS";
        case "Processing": return "PROCESSING";
        case "Completed": return "COMPLETED";
        case "Discarded Leads": return "DISCARDED";
        default: return "LEAD";
    }
}

const getPriorityDisplay = (backendCode: string) => {
      switch(backendCode) {
          case "LOW": return "Low";
          case "MEDIUM": return "Medium";
          case "HIGH": return "High";
          default: return "Medium";
      }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTicket = (t: any): Ticket => {
    const { client_name = "", client_last_name = "" } = t;
    const computedName = `${client_name} ${client_last_name}`.trim();
    const assignedToDisplay =
        t.assigned_to_name ||
        t.assigned_to_username ||
        (t.assigned_to ? `User ${t.assigned_to}` : null);

    return {
        id: String(t.id),
        ticket_no: t.ticket_no,
        clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
        type: getTypeDisplay(t.ticket_type),
        stage: getStatusDisplay(t.status) as PipelineStage,
        priority: getPriorityDisplay(t.priority),
        createdDate: new Date(t.created_at).toLocaleDateString(),
        assignedTo: assignedToDisplay || "Unassigned",
        insuranceType: t.insurance_type || t.insuranceType || "",
        clientEmail: t.client_email || t.clientEmail || "",
        // Note: For typing to work flawlessly we map `id` to string in UI
    } as any;
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import { normalizeListResponse } from "@/lib/normalize";

const PipelineView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const { data: ticketsData, isLoading } = useQuery({
      queryKey: ["tickets"],
      queryFn: async () => {
          return await fetchAllPages("/api/tickets/");
      }
  });

  useEffect(() => {
    const safeTickets = normalizeListResponse(ticketsData);
    setLocalTickets(safeTickets.map(formatTicket));
  }, [ticketsData]);

  const updateTicketMutation = useMutation({
      mutationFn: async ({ id, status }: { id: string, status: string }) => {
          const res = await api.post(`/api/tickets/${id}/change_status/`, { status });
          return res.data;
      },
      onSuccess: () => {
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

    // Optimistically update
    setLocalTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, stage: newStage };
      }
      return t;
    }));

    // Dispatch update to API
    updateTicketMutation.mutate({
      id: ticketId,
      status: getStatusBackendCode(newStage)
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Project Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage and track client requests through different stages</p>
        </div>
        <Button onClick={() => navigate("/new-ticket")} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-4">
          {isLoading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground">
              Loading pipeline...
            </div>
          ) : pipelineStages.map((stage) => {
            const stageTickets = localTickets.filter(t => t.stage === stage);
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
                    <PipelineCard key={"item-" + ticket.id} ticket={ticket} />
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
    </div>
  );
};

export default PipelineView;
