import { useState } from "react";
import { Ticket } from "@/lib/data";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Eye, Trash2, UserCircle, Copy, Check, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PipelineCardProps {
  ticket: Ticket;
  onDiscard?: (ticketId: string) => void;
  isDiscarding?: boolean;
}

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20",
};

const typeColors: Record<string, string> = {
  "New Policy": "text-primary border-primary/30 bg-primary/5",
  "Renewal": "text-accent border-accent/30 bg-accent/5",
  "Changes": "text-primary border-primary/30 bg-primary/5",
  "Adjustment": "text-purple-500 border-purple-500/30 bg-purple-500/5",
  "Customer Issue": "text-destructive border-destructive/30 bg-destructive/5",
  "Cancellation": "text-destructive border-destructive/30 bg-destructive/5",
};

function parseDetails(details: any) {
  const rows: { key: string; value: string }[] = [];
  if (!details) return rows;

  if (typeof details === "string") {
    const lines = details.split("\n");
    lines.forEach((line) => {
      if (!line.trim()) return;
      const separatorIdx = line.indexOf(":");
      if (separatorIdx !== -1) {
        const key = line.slice(0, separatorIdx).trim();
        const value = line.slice(separatorIdx + 1).trim();
        const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        rows.push({ key: formattedKey, value });
      } else {
        rows.push({ key: "", value: line.trim() });
      }
    });
    return rows;
  }

  if (typeof details === "object") {
    Object.entries(details).forEach(([key, value]) => {
      rows.push({ key, value: String(value) });
    });
  }

  return rows;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-0.5 rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/row:opacity-100"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function PipelineCard({ ticket, onDiscard, isDiscarding = false }: PipelineCardProps) {
  const [actionType, setActionType] = useState<"view" | null>(null);
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
        onClick={() => setActionType("view")}
        className="bg-card rounded-xl p-3 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group relative touch-none"
      >
        <div className="flex items-center justify-between mb-2 relative z-20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md w-fit">
              #{String(ticket.ticket_no || ticket.id).split("-")[1] || String(ticket.ticket_no || ticket.id)}
            </span>
            <span className={`text-[9px] uppercase px-2 py-0.5 rounded border font-bold tracking-wider w-fit ${priorityColors[ticket.priority] || priorityColors.Medium}`}>
              {ticket.priority}
            </span>
          </div>
          <div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActionType("view")}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            {onDiscard && ticket.stage !== "Discarded Leads" && ticket.stage !== "Completed" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-secondary rounded"
                    disabled={isDiscarding}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard this lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will move ticket #{ticket.ticket_no || ticket.id} to Discarded Leads.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDiscarding}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDiscard(ticket.id)}
                      disabled={isDiscarding}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Discard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <h4 className="font-semibold text-sm mb-0.5 leading-tight">{ticket.clientName}</h4>
        <p className="text-xs text-muted-foreground mb-3 truncate">{ticket.insuranceType}</p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[ticket.type]}`}>
            {ticket.type}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-secondary text-secondary-foreground">
            {ticket.stage}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <UserCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">
            {ticket.assignedTo && ticket.assignedTo !== "Unassigned" ? ticket.assignedTo : <span className="italic">Unassigned</span>}
          </span>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              Viewing pipeline details for the ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-border">
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Client Name</th>
                    <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.clientName}<CopyButton value={ticket.clientName} /></span></td>
                  </tr>
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Ticket No</th>
                    <td className="px-3 py-2 whitespace-pre-wrap font-mono text-primary">
                      <span className="flex items-center gap-1">{ticket.ticket_no || ticket.id}<CopyButton value={ticket.ticket_no || ticket.id} /></span>
                    </td>
                  </tr>
                  {ticket.clientOccupation && (
                    <tr className="bg-card group/row">
                      <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Occupation</th>
                      <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.clientOccupation}<CopyButton value={ticket.clientOccupation} /></span></td>
                    </tr>
                  )}
                  {ticket.clientEmail && (
                    <tr className="bg-card group/row">
                      <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Email</th>
                      <td className="px-3 py-2 whitespace-pre-wrap break-all"><span className="flex items-center gap-1">{ticket.clientEmail}<CopyButton value={ticket.clientEmail} /></span></td>
                    </tr>
                  )}
                  {ticket.clientPhone && (
                    <tr className="bg-card group/row">
                      <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Phone</th>
                      <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.clientPhone}<CopyButton value={ticket.clientPhone} /></span></td>
                    </tr>
                  )}
                  {ticket.clientAddress && (
                    <tr className="bg-card group/row">
                      <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Address</th>
                      <td className="px-3 py-2 whitespace-pre-wrap break-words"><span className="flex items-center gap-1">{ticket.clientAddress}<CopyButton value={ticket.clientAddress} /></span></td>
                    </tr>
                  )}
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Type</th>
                    <td className="px-3 py-2 whitespace-pre-wrap font-medium"><span className="flex items-center gap-1">{ticket.type}<CopyButton value={ticket.type} /></span></td>
                  </tr>
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Insurance</th>
                    <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.insuranceType || "-"}<CopyButton value={ticket.insuranceType || "-"} /></span></td>
                  </tr>
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Stage</th>
                    <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.stage}<CopyButton value={ticket.stage} /></span></td>
                  </tr>
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Priority</th>
                    <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.priority}<CopyButton value={ticket.priority} /></span></td>
                  </tr>
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Assigned To</th>
                    <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.assignedTo || "Unassigned"}<CopyButton value={ticket.assignedTo || "Unassigned"} /></span></td>
                  </tr>
                  <tr className="bg-card group/row">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Created Date</th>
                    <td className="px-3 py-2 whitespace-pre-wrap"><span className="flex items-center gap-1">{ticket.createdDate}<CopyButton value={ticket.createdDate} /></span></td>
                  </tr>
                  {parseDetails(ticket.details).map((row, idx) => (
                    <tr key={`detail-${ticket.id}-${idx}`} className="bg-card group/row">
                      {row.key ? (
                        <>
                          <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top break-words">
                            {row.key}
                          </th>
                          <td className="px-3 py-2 whitespace-pre-wrap break-words"><span className="flex items-center gap-1">{row.value}<CopyButton value={row.value} /></span></td>
                        </>
                      ) : (
                        <td colSpan={2} className="px-3 py-2 whitespace-pre-wrap break-words text-muted-foreground">
                          <span className="flex items-center gap-1">{row.value}<CopyButton value={row.value} /></span>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-card">
                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Notes</th>
                    <td className="px-3 py-2">
                      <div className="relative">
                        <Textarea
                          placeholder="Add notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          onBlur={handleSave}
                          className="text-sm min-h-[80px] w-full resize-none bg-background focus-visible:ring-1"
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
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="secondary"
              className="gap-2 sm:mr-auto"
              onClick={() => {
                const detailRows = parseDetails(ticket.details)
                  .map(r => r.key ? `${r.key}: ${r.value}` : r.value)
                  .join("\n");
                const text = [
                  `Ticket No : ${ticket.ticket_no || ticket.id}`,
                  `Client    : ${ticket.clientName}`,
                  ticket.clientPhone ? `Phone     : ${ticket.clientPhone}` : "",
                  ticket.clientEmail ? `Email     : ${ticket.clientEmail}` : "",
                  ticket.clientAddress ? `Address   : ${ticket.clientAddress}` : "",
                  ticket.clientOccupation ? `Occupation: ${ticket.clientOccupation}` : "",
                  `Type      : ${ticket.type}`,
                  `Insurance : ${ticket.insuranceType || "-"}`,
                  `Stage     : ${ticket.stage}`,
                  `Priority  : ${ticket.priority}`,
                  `Assigned  : ${ticket.assignedTo || "Unassigned"}`,
                  `Created   : ${ticket.createdDate}`,
                  detailRows ? `\nDetails:\n${detailRows}` : "",
                  notes ? `\nNotes:\n${notes}` : "",
                ].filter(Boolean).join("\n");
                navigator.clipboard.writeText(text).then(() => {
                  toast.success("Ticket details copied to clipboard!");
                });
              }}
            >
              <ClipboardList className="h-4 w-4" />
              Copy All Details
            </Button>
            <Button variant="outline" onClick={() => { setActionType(null); setNotes(ticket.additionalNotes || ticket.notes || ""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
