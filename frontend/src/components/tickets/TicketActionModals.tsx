import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BackendTicketNote, BackendUser, TicketRow } from "@/lib/data";

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
};

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
}: Props) {
  return (
    <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
      <DialogContent className="sm:max-w-[425px]">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Client Name</span>
                  <span className="text-sm col-span-3">{selectedTicket.clientName}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Email</span>
                  <span className="text-sm col-span-3">{selectedTicket.clientEmail}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Type</span>
                  <span className="text-sm col-span-3 font-medium">{selectedTicket.type}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Insurance</span>
                  <span className="text-sm col-span-3">{selectedTicket.insuranceType}</span>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold mb-2">Notes</p>
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {isNotesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading notes…</p>
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

