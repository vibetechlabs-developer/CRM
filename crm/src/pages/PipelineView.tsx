import { useState } from "react";
import { tickets as initialTickets, pipelineStages, PipelineStage, Ticket } from "@/lib/data";
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

const PipelineView = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

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

    const ticketId = active.id;
    const newStage = over.id as PipelineStage;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, stage: newStage };
      }
      return t;
    }));
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
          {pipelineStages.map((stage) => {
            const stageTickets = tickets.filter(t => t.stage === stage);
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
