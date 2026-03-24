import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BackendTicketNote, BackendUser, TicketRow } from "@/lib/data";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, AlertTriangle } from "lucide-react";

type ModalType = "view" | "edit" | null;

type Props = {
  modalType: ModalType;
  setModalType: (t: ModalType) => void;
  selectedTicket: TicketRow | null;
  setSelectedTicket: (t: TicketRow | null | ((prev: TicketRow | null) => TicketRow | null)) => void;

  userRole?: string;
  agents: BackendUser[];

  notes: BackendTicketNote[];
  isNotesLoading: boolean;
  noteText: string;
  setNoteText: (v: string) => void;
  isAddingNote: boolean;
  onAddNote: () => void;

  onSaveAdminAssignment: (ticketId: number, assignedToId: number | null) => void;
  isSaving: boolean;
  onDiscard?: (ticketId: number) => void;
  isDiscarding?: boolean;
};

function parseDetails(details: any) {
  const result = { headers: [] as string[], rows: [] as { key: string, value: string }[] };
  if (!details) return result;
  
  if (typeof details === 'string') {
    const lines = details.split('\n');
    
    lines.forEach(line => {
      if (!line.trim()) return;
      
      if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
        result.headers.push(line.trim());
        return;
      }
      
      const separatorIdx = line.indexOf(':');
      if (separatorIdx !== -1) {
        const key = line.slice(0, separatorIdx).trim();
        const value = line.slice(separatorIdx + 1).trim();
        
        const formattedKey = key.replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
          
        result.rows.push({ key: formattedKey, value });
      } else {
        result.rows.push({ key: '', value: line });
      }
    });
  } else if (typeof details === 'object') {
    for (const [key, value] of Object.entries(details)) {
      result.rows.push({ key, value: String(value) });
    }
  }

  return result;
}

export function TicketActionModals({
  modalType,
  setModalType,
  selectedTicket,
  setSelectedTicket,
  userRole,
  agents,
  notes,
  isNotesLoading,
  noteText,
  setNoteText,
  isAddingNote,
  onAddNote,
  onSaveAdminAssignment,
  isSaving,
  onDiscard,
  isDiscarding,
}: Props) {
  return (
    <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>{modalType === "view" ? "Ticket Details" : "Edit Ticket"}</DialogTitle>
          <DialogDescription>
            {modalType === "view" ? "Viewing details for the selected ticket." : "Make changes to the ticket information."}
          </DialogDescription>
        </DialogHeader>

        {selectedTicket && (
          <div className="py-4 space-y-4">
            {modalType === "view" ? (
              <>
                <div className="border rounded-md overflow-hidden mt-2">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-border">
                      <tr className="bg-card">
                        <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Client Name</th>
                        <td className="px-3 py-2 whitespace-pre-wrap">{selectedTicket.clientName}</td>
                      </tr>
                      {selectedTicket.clientOccupation && (
                        <tr className="bg-card">
                          <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Occupation</th>
                          <td className="px-3 py-2 whitespace-pre-wrap">{selectedTicket.clientOccupation}</td>
                        </tr>
                      )}
                      <tr className="bg-card">
                        <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Email</th>
                        <td className="px-3 py-2 whitespace-pre-wrap">{selectedTicket.clientEmail}</td>
                      </tr>
                      {selectedTicket.clientPhone && (
                        <tr className="bg-card">
                          <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Phone</th>
                          <td className="px-3 py-2 whitespace-pre-wrap">{selectedTicket.clientPhone}</td>
                        </tr>
                      )}
                      {selectedTicket.clientAddress && (
                        <tr className="bg-card">
                          <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Address</th>
                          <td className="px-3 py-2 whitespace-pre-wrap break-words max-w-sm">{selectedTicket.clientAddress}</td>
                        </tr>
                      )}
                      <tr className="bg-card">
                        <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Type</th>
                        <td className="px-3 py-2 whitespace-pre-wrap font-medium">{selectedTicket.type}</td>
                      </tr>
                      <tr className="bg-card">
                        <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top">Insurance</th>
                        <td className="px-3 py-2 whitespace-pre-wrap">{selectedTicket.insuranceType}</td>
                      </tr>
                      
                      {selectedTicket.details && (() => {
                        const parsed = parseDetails(selectedTicket.details);
                        return (
                          <>
                            {parsed.headers.map((h, i) => (
                              <tr key={`h-${i}`} className="bg-muted/30">
                                <td colSpan={2} className="px-3 py-2 font-semibold text-primary text-center">
                                  {h}
                                </td>
                              </tr>
                            ))}
                            {parsed.rows.map((row, i) => (
                              <tr key={`r-${i}`} className="bg-card">
                                {row.key ? (
                                  <>
                                    <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top break-words">
                                      {row.key}
                                    </th>
                                    <td className="px-3 py-2 whitespace-pre-wrap break-words">{row.value}</td>
                                  </>
                                ) : (
                                  <td colSpan={2} className="px-3 py-2 whitespace-pre-wrap break-words text-center text-muted-foreground">
                                    {row.value}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold mb-2">Notes</p>
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {isNotesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner size="sm" />
                        <span>Loading notes…</span>
                      </div>
                    ) : notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                    ) : (
                      notes.map((n) => (
                        <div key={n.id} className="p-2 rounded-md border bg-secondary/20">
                          <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" />
                    <Button className="w-full" disabled={!noteText.trim() || isAddingNote} onClick={onAddNote}>
                      Add note
                    </Button>
                  </div>
                </div>

                {onDiscard && selectedTicket.stage !== "Discarded Leads" && (
                  <div className="pt-3 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full gap-2"
                          disabled={isDiscarding}
                        >
                          <Trash2 className="h-4 w-4" />
                          Discard Lead
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Discard Lead?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to discard ticket{" "}
                            <span className="font-semibold text-foreground">#{selectedTicket.ticket_no}</span>{" "}
                            for{" "}
                            <span className="font-semibold text-foreground">{selectedTicket.clientName}</span>?
                            <br />
                            <br />
                            This will move it to the Discarded Leads section. You can revert later by changing the
                            ticket stage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDiscarding}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDiscard(selectedTicket.id)}
                            disabled={isDiscarding}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            {isDiscarding ? (
                              <span className="flex items-center gap-2">
                                <Spinner size="sm" />
                                Discarding...
                              </span>
                            ) : (
                              "Yes, Discard Lead"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Move this ticket to Discarded Leads
                    </p>
                  </div>
                )}
              </>
            ) : modalType === "edit" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Client Name</Label>
                  <Input defaultValue={selectedTicket.clientName} placeholder="Enter client name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input defaultValue={selectedTicket.clientEmail} placeholder="Enter email" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Type</Label>
                  <Select defaultValue={String(selectedTicket.type)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["New Policy", "Renewal", "Adjustment", "Cancellation"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Insurance Type</Label>
                  <Input defaultValue={selectedTicket.insuranceType} placeholder="e.g. Home, Auto" />
                </div>

                {userRole === "ADMIN" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Assigned Agent</Label>
                    <Select
                      value={selectedTicket.assignedToId ? String(selectedTicket.assignedToId) : "unassigned"}
                      onValueChange={(val) => {
                        setSelectedTicket((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            assignedToId: val === "unassigned" ? null : parseInt(val, 10),
                          };
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.first_name || a.last_name ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : a.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setModalType(null)}>
            Close
          </Button>
          {modalType === "edit" && selectedTicket && (
            <Button
              disabled={isSaving}
              onClick={() => {
                if (userRole === "ADMIN") {
                  onSaveAdminAssignment(selectedTicket.id, selectedTicket.assignedToId);
                  return;
                }
                setModalType(null);
              }}
            >
              Save changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

