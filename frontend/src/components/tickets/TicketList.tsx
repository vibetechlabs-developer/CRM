import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Edit2, Eye } from "lucide-react";
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

export function TicketList({
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
    return <p className="text-muted-foreground">Loading tickets...</p>;
  }

  return (
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
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{ticket.clientName}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-primary font-medium">
                        #{String(ticket.ticket_no).split("-")[1] || ticket.ticket_no}
                      </span>
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
                  <Select value={String(ticket.stage)} onValueChange={(v) => onStageChange(ticket.id, v as PipelineStage)}>
                    <SelectTrigger className={`h-8 w-[150px] text-xs font-medium rounded-full border ${stageStyles[String(ticket.stage)]}`}>
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
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <Select value={String(ticket.priority)} onValueChange={(v) => onPriorityChange(ticket.id, v as Priority)}>
                    <SelectTrigger className={`h-8 w-[110px] text-xs font-medium rounded-full border ${priorityStyles[ticket.priority as Priority]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
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
                      <AvatarFallback className="text-[10px] bg-secondary font-medium">
                        {ticket.assignedTo && ticket.assignedTo !== "Unassigned" ? ticket.assignedTo.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => onView(ticket)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => onEdit(ticket)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

