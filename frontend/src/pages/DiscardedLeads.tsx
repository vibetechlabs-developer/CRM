import { tickets } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function DiscardedLeads() {
    const discardedTickets = tickets.filter(t => t.stage === "Discarded Leads");

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
                            {discardedTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No discarded leads found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                discardedTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium font-mono text-muted-foreground">{ticket.id}</TableCell>
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
