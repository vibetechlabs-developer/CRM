import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit2, Eye } from "lucide-react";
import { pipelineStages, priorities, type PipelineStage, type Priority, type TicketRow } from "@/lib/data";

type Props = {
  tickets: TicketRow[];
  isLoading: boolean;
  typeColors: Record<string, string>;
  stageStyles: Record<string, string>;
  priorityStyles: Record<string, string>;
  onStageChange: (ticketId: number, newStage: PipelineStage) => void;
  onPriorityChange: (ticketId: number, newPriority: Priority) => void;
  onView: (ticket: TicketRow) => void;
  onEdit: (ticket: TicketRow) => void;
};

export function TicketGrid({
  tickets,
  isLoading,
  typeColors,
  stageStyles,
  priorityStyles,
  onStageChange,
  onPriorityChange,
  onView,
  onEdit,
}: Props) {
  if (isLoading) {
    return <p className="text-muted-foreground col-span-full">Loading tickets...</p>;
  }

  if (tickets.length === 0) {
    return <p className="text-muted-foreground col-span-full">No tickets found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="border shadow-sm hover:shadow-md transition-all group flex flex-col">
          <div className="p-4 flex-1">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-mono font-medium text-primary px-2 py-1 bg-primary/10 rounded-md">
                #{String(ticket.ticket_no).split("-")[1] || ticket.ticket_no}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onView(ticket)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEdit(ticket)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
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
                <Select value={String(ticket.stage)} onValueChange={(v) => onStageChange(ticket.id, v as PipelineStage)}>
                  <SelectTrigger className={`h-6 w-auto border-0 p-0 hover:bg-transparent ${stageStyles[String(ticket.stage)]?.split(" ")[1]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <Select value={String(ticket.priority)} onValueChange={(v) => onPriorityChange(ticket.id, v as Priority)}>
                  <SelectTrigger className={`h-6 w-auto border-0 p-0 hover:bg-transparent ${priorityStyles[ticket.priority as Priority]?.split(" ")[1]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="p-3 border-t bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-secondary">
                  {ticket.assignedTo && ticket.assignedTo !== "Unassigned" ? ticket.assignedTo.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{ticket.assignedTo}</span>
            </div>
            <span>{ticket.createdDate}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

