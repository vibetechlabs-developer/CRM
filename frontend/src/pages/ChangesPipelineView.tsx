import { useState, useEffect } from "react";
import { PipelineStage, Ticket, getTypeDisplay, getStatusDisplay, getStatusBackendCode, getPriorityDisplay } from "@/lib/data";
import { PipelineCard } from "@/components/PipelineCard";
import { PipelineColumn } from "@/components/PipelineColumn";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import { normalizeListResponse } from "@/lib/normalize";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

// 3-stage layout like Project Pipeline: Changes -> Follow Up -> Completed.
const changesPipelineStages: PipelineStage[] = ["Changes", "Follow Up", "Completed"];

const stageIcons: Record<string, React.ReactNode> = {
  "Follow Up": <Clock className="h-4 w-4" />,
  "Changes": <SlidersHorizontal className="h-4 w-4" />,
  "Completed": <CheckCircle className="h-4 w-4" />,
};

const stageColors: Record<string, string> = {
  "Follow Up": "text-info border-info/20 bg-info/10",
  "Changes": "text-primary border-primary/20 bg-primary/10",
  "Completed": "text-success border-success/20 bg-success/10",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTicket = (t: any): Ticket => {
    const { client_name = "", client_last_name = "" } = t;
    const computedName = `${client_name} ${client_last_name}`.trim();
    const assignedToDisplay =
        t.assigned_to_name ||
        t.assigned_to_username ||
        (t.assigned_to ? `User ${t.assigned_to}` : null);

    const additionalNotes = t.additional_notes || t.additionalNotes || "";
    const isCustomerIssue = typeof additionalNotes === "string" && additionalNotes.includes("[Form: Customer Issue]");
    const typeDisplay = isCustomerIssue ? "Customer Issue" : getTypeDisplay(t.ticket_type);
    const displayStatus = getStatusDisplay(t.status);
    const stageForChangesPipeline: PipelineStage =
      displayStatus === "Completed"
        ? "Completed"
        : displayStatus === "Follow Up"
          ? "Follow Up"
          : "Changes";

    return {
        id: String(t.id),
        ticket_no: t.ticket_no,
        clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
        type: typeDisplay,
        // This view has 3 lanes: Changes, Follow Up, Completed.
        stage: stageForChangesPipeline,
        priority: getPriorityDisplay(t.priority),
        createdDate: new Date(t.created_at).toLocaleDateString(),
        assignedTo: assignedToDisplay || "Unassigned",
        insuranceType: t.insurance_type || t.insuranceType || "",
        clientEmail: t.client_email || t.clientEmail || "",
        createdAtRaw: t.created_at,
        additionalNotes: additionalNotes || "",
    } as any;
};

const ChangesPipelineView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ ticketId: string; fromStage: PipelineStage; toStage: PipelineStage } | null>(null);

  const { data: ticketsData, isLoading } = useQuery({
      queryKey: ["tickets"],
      queryFn: async () => {
          return await fetchAllPages("/api/tickets/");
      }
  });

  useEffect(() => {
    const safeTickets = normalizeListResponse(ticketsData);
    // Include current + legacy change-request type codes to avoid hiding old completed items.
    const formatted = safeTickets
      .filter((t: any) => {
        const typeCode = String(t?.ticket_type || "").toUpperCase();
        return typeCode === "CHANGES" || typeCode === "ADJUSTMENT";
      })
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
    if (fromStage === "Completed") {
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

  const currentYear = new Date().getFullYear();
  const allYears = Array.from({ length: (currentYear + 1) - 2015 }, (_, i) => String(currentYear + 1 - i));

  const filteredTickets = localTickets.filter(t => {
    if (!t.createdAtRaw) return false;
    const date = new Date(t.createdAtRaw);
    if (selectedDate) {
      const sd = selectedDate;
      return (
        date.getFullYear() === sd.getFullYear() &&
        date.getMonth() === sd.getMonth() &&
        date.getDate() === sd.getDate()
      );
    }
    if (selectedYear !== "All" && date.getFullYear() !== parseInt(selectedYear)) {
      return false;
    }
    if (selectedMonth !== "All") {
      const monthIndex = parseInt(selectedMonth) - 1;
      if (date.getMonth() !== monthIndex) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Changes Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage and track changes requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Years</SelectItem>
              {allYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Months</SelectItem>
              {Array.from({ length: 12 }).map((_, idx) => {
                const date = new Date(2000, idx);
                const label = date.toLocaleString("default", { month: "long" });
                const value = String(idx + 1).padStart(2, "0");
                return <SelectItem key={value} value={String(idx + 1)}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal min-w-[170px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? selectedDate.toLocaleDateString() : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => setSelectedDate(d)}
                  initialFocus
                />
                <div className="flex justify-between gap-2 mt-3">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedDate(undefined)}>Clear</Button>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setSelectedYear("All");
                    setSelectedMonth("All");
                  }}>Ignore YM</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => navigate("/new-ticket")} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pb-4 w-full max-w-6xl">
          {isLoading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground gap-2">
              <Spinner size="md" />
              <span>Loading pipeline...</span>
            </div>
          ) : changesPipelineStages.map((stage) => {
            const stageTickets = filteredTickets.filter(t => t.stage === stage);
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

export default ChangesPipelineView;
