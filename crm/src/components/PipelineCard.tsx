import { useState } from "react";
import { Ticket } from "@/lib/data";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Eye, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pipelineStages, priorities } from "@/lib/data";

interface PipelineCardProps {
  ticket: Ticket;
}

const typeColors: Record<string, string> = {
  "New Policy": "text-primary border-primary/30 bg-primary/5",
  "Renewal": "text-accent border-accent/30 bg-accent/5",
  "Adjustment": "text-purple-500 border-purple-500/30 bg-purple-500/5",
  "Cancellation": "text-destructive border-destructive/30 bg-destructive/5",
};

export function PipelineCard({ ticket }: PipelineCardProps) {
  const [actionType, setActionType] = useState<"view" | "edit" | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: {
      type: "Ticket",
      ticket,
    },
  });

  const style = {
    // Translate the item on drag
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card/50 rounded-xl p-4 border-2 border-primary/50 border-dashed opacity-50 h-[178px]"
      />
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-card rounded-xl p-4 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group relative touch-none"
      >
        <div className="flex items-start justify-between mb-2 relative z-20">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md w-fit mb-1.5">
              #{ticket.id.split("-")[1]}
            </span>
            <span className={`text-[9px] uppercase px-2 py-0.5 rounded border font-bold tracking-wider w-fit ${ticket.priority === "High" ? "bg-destructive/10 text-destructive border-destructive/20" :
              ticket.priority === "Medium" ? "bg-warning/10 text-warning border-warning/20" :
                "bg-success/10 text-success border-success/20"
              }`}>
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setActionType("view")}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActionType("edit")}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h4 className="font-semibold text-sm mb-0.5 leading-tight">{ticket.clientName}</h4>
        <p className="text-xs text-muted-foreground mb-3 truncate">{ticket.insuranceType}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[ticket.type]}`}>
            {ticket.type}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border shadow-sm">
              <AvatarFallback className="text-[10px] bg-secondary font-medium">{ticket.assignedTo[6] || "A"}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">{ticket.assignedTo}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md">
            <Clock className="h-3 w-3" />
            <span>8d</span>
          </div>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "view" ? "Ticket Details" : "Edit Ticket"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "view" ? "Viewing pipeline details for the ticket." : "Make changes to the pipeline ticket."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {actionType === "view" ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Client</span>
                  <span className="text-sm col-span-3 font-semibold">{ticket.clientName}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Ticket ID</span>
                  <span className="text-sm col-span-3 font-mono text-primary">{ticket.id}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Type</span>
                  <span className="text-sm col-span-3">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${typeColors[ticket.type]}`}>
                      {ticket.type}
                    </span>
                  </span>
                </div>
              </>
            ) : actionType === "edit" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Stage</Label>
                  <Select defaultValue={ticket.stage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select defaultValue={ticket.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Close</Button>
            {actionType === "edit" && <Button onClick={() => setActionType(null)}>Save changes</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
