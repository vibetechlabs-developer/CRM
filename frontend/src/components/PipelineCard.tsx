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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface PipelineCardProps {
  ticket: Ticket;
}

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20",
};

const typeColors: Record<string, string> = {
  "New Policy": "text-primary border-primary/30 bg-primary/5",
  "Renewal": "text-accent border-accent/30 bg-accent/5",
  "Adjustment": "text-purple-500 border-purple-500/30 bg-purple-500/5",
  "Cancellation": "text-destructive border-destructive/30 bg-destructive/5",
};

export function PipelineCard({ ticket }: PipelineCardProps) {
  const [actionType, setActionType] = useState<"view" | "edit" | null>(null);
  const [notes, setNotes] = useState(ticket.additionalNotes || ticket.notes || "");
  const queryClient = useQueryClient();

  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const res = await api.patch(`/api/tickets/${ticket.id}/`, { additional_notes: newNotes });
      return res.data;
    },
    onMutate: async (newNotes) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] });
      const previousTickets = queryClient.getQueryData(["tickets"]);
      
      queryClient.setQueryData(["tickets"], (old: any) => {
        if (!old) return old;
        return old.map((t: any) => 
          String(t.id) === String(ticket.id) ? { ...t, additional_notes: newNotes } : t
        );
      });
      
      return { previousTickets };
    },
    onError: (err, newNotes, context: any) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets"], context.previousTickets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  });

  const handleSave = () => {
    if (notes !== (ticket.additionalNotes || ticket.notes || "")) {
      updateNotesMutation.mutate(notes, {
        onSuccess: () => setActionType(null)
      });
    } else {
      setActionType(null);
    }
  };

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
              #{String(ticket.ticket_no || ticket.id).split("-")[1] || String(ticket.ticket_no || ticket.id)}
            </span>
            <span className={`text-[9px] uppercase px-2 py-0.5 rounded border font-bold tracking-wider w-fit ${priorityColors[ticket.priority] || priorityColors.Medium}`}>
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

        <div 
          className="mb-4 relative" 
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSave}
            className="text-xs min-h-[60px] resize-none bg-secondary/30 border-muted placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
          {updateNotesMutation.isPending && (
            <div className="absolute right-2 bottom-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border shadow-sm">
              <AvatarFallback className="text-[10px] bg-secondary font-medium">{(ticket.assignedTo && ticket.assignedTo !== "Unassigned") ? ticket.assignedTo.charAt(0).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">{ticket.assignedTo || "Unassigned"}</span>
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
                {(ticket.additionalNotes || ticket.notes) && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <span className="text-sm font-medium text-right text-muted-foreground">Notes</span>
                    <span className="text-sm col-span-3 whitespace-pre-wrap">{ticket.additionalNotes || ticket.notes}</span>
                  </div>
                )}
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
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea 
                    placeholder="Add notes for this ticket..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    className="min-h-[100px]"
                  />
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setNotes(ticket.additionalNotes || ticket.notes || ""); }}>Close</Button>
            {actionType === "edit" && (
              <Button onClick={handleSave} disabled={updateNotesMutation.isPending}>
                {updateNotesMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
