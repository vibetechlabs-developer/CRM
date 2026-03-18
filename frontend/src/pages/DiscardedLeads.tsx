import { useQuery } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const getTypeDisplay = (backendCode: string) => {
    switch(backendCode) {
        case "NEW": return "New Policy";
        case "RENEWAL": return "Renewal";
        case "ADJUSTMENT": return "Adjustment";
        case "CANCELLATION": return "Cancellation";
        default: return "Unknown";
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTicket = (t: any) => {
    const { client_name = "", client_last_name = "" } = t;
    const computedName = `${client_name} ${client_last_name}`.trim();

    // Get agent name - prefer assigned_to_name, fallback to assigned_to_username, then "Unassigned"
    let assignedToDisplay = "Unassigned";
    if (t.assigned_to_name) {
        assignedToDisplay = t.assigned_to_name;
    } else if (t.assigned_to_username) {
        assignedToDisplay = t.assigned_to_username;
    } else if (t.assigned_to) {
        // Fallback for old data format
        assignedToDisplay = typeof t.assigned_to === 'object' ? (t.assigned_to.username || 'Unknown') : `User ${t.assigned_to}`;
    }

    return {
        id: t.id,
        ticket_no: t.ticket_no,
        clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
        type: getTypeDisplay(t.ticket_type),
        insuranceType: t.insurance_type,
        assignedTo: assignedToDisplay,
        createdDate: new Date(t.created_at).toLocaleDateString(),
    };
};

export default function DiscardedLeads() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["tickets", "discarded"],
        queryFn: async () => {
            return await fetchAllPages("/api/tickets/?status=DISCARDED");
        }
    });

    const discardedTickets = (data || []).map(formatTicket);

    return (
        <div className="space-y-6 h-full flex flex-col max-w-[1200px] mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-destructive">Discarded Leads</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Review tickets and inquiries that have been discarded</p>
                </div>
            </div>

            <Card className="flex-1 shadow-sm border-border">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                    <CardTitle className="text-lg">Discarded History</CardTitle>
                    <CardDescription>A total of {discardedTickets.length} leads have been discarded.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[120px]">Ticket ID</TableHead>
                                <TableHead>Client Name</TableHead>
                                <TableHead>Insurance Type</TableHead>
                                <TableHead>Request Type</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead className="text-right">Created Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Loading discarded leads...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-destructive">
                                        Failed to load discarded leads.
                                    </TableCell>
                                </TableRow>
                            ) : discardedTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No discarded leads found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                discardedTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium font-mono text-muted-foreground">#{String(ticket.ticket_no).split("-")[1] || ticket.ticket_no}</TableCell>
                                        <TableCell className="font-semibold">{ticket.clientName}</TableCell>
                                        <TableCell>{ticket.insuranceType}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                                                {ticket.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{ticket.assignedTo}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{ticket.createdDate}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
