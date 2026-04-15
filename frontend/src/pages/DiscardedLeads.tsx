import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/lib/auth";

const getTypeDisplay = (backendCode: string) => {
    switch(backendCode) {
        case "NEW": return "New Policy";
        case "RENEWAL": return "Renewal";
        case "ADJUSTMENT": return "Changes Form";
        case "CANCELLATION": return "Cancellation";
        default: return "Unknown";
    }
};

 
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
        discardedDate: t.discarded_at ? new Date(t.discarded_at).toLocaleDateString() : "—",
    };
};

export default function DiscardedLeads() {
    const [page, setPage] = useState(1);
    const [pageMarkAllOpen, setPageMarkAllOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const role = String(user?.role ?? "").toUpperCase();
    const canFilterReminders = role === "ADMIN" || role === "AGENT" || role === "MANAGER";
    const reopenOnly = canFilterReminders && searchParams.get("reopenReminder") === "1";

    useEffect(() => {
        setPage(1);
    }, [reopenOnly]);

    const dismissRemindersMutation = useMutation({
        mutationFn: async (body: { ticket_ids?: number[] }) => {
            await api.post("/api/tickets/dismiss-discard-reminders/", body);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["tickets-stats"] });
            void queryClient.invalidateQueries({ queryKey: ["tickets", "discarded"] });
        },
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ["tickets", "discarded", page, reopenOnly],
        queryFn: async () => {
            const params: Record<string, string | number> = {
                status: "DISCARDED",
                page,
                ordering: "-created_at",
            };
            if (reopenOnly) {
                params.reopen_reminder = "1";
            }
            const response = await api.get("/api/tickets/", {
                params,
            });
            const payload = response.data;
            const items = Array.isArray(payload) ? payload : (payload.results || []);
            const totalCount = !Array.isArray(payload) && typeof payload.count === "number" ? payload.count : items.length;
            return { items, totalCount };
        }
    });

    const discardedTickets = (data?.items || []).map(formatTicket);
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil((data?.totalCount || 0) / itemsPerPage));

    return (
        <div className="space-y-6 h-full flex flex-col max-w-[1200px] mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-destructive">Discarded Leads</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Review tickets and inquiries that have been discarded</p>
                </div>
                {canFilterReminders ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant={reopenOnly ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSearchParams({ reopenReminder: "1" })}
                        >
                            Re-approach reminders only
                        </Button>
                        <Button
                            type="button"
                            variant={!reopenOnly ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSearchParams({})}
                        >
                            All discarded
                        </Button>
                        {reopenOnly ? (
                            <AlertDialog open={pageMarkAllOpen} onOpenChange={setPageMarkAllOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={dismissRemindersMutation.isPending || !(data?.items?.length)}
                                    >
                                        Mark this page as seen
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Mark every row on this page as seen?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Only tickets on the current page will be marked. Use the row button to mark one lead at a time.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => {
                                                dismissRemindersMutation.mutate({
                                                    ticket_ids: (data?.items || []).map((t: { id: number }) => t.id),
                                                });
                                                setPageMarkAllOpen(false);
                                            }}
                                        >
                                            Mark this page
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <Card className="flex-1 shadow-sm border-border">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                    <CardTitle className="text-lg">Discarded History</CardTitle>
                    <CardDescription>
                        {reopenOnly ? (
                            <>
                                Showing <strong>{data?.totalCount || 0}</strong> lead
                                {(data?.totalCount || 0) === 1 ? "" : "s"} in the one-year re-approach window. Use
                                pagination to see more.
                            </>
                        ) : (
                            <>A total of {data?.totalCount || 0} leads have been discarded.</>
                        )}
                    </CardDescription>
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
                                {reopenOnly ? <TableHead className="text-right whitespace-nowrap">Discarded</TableHead> : null}
                                <TableHead className="text-right">Created Date</TableHead>
                                {reopenOnly ? <TableHead className="w-[120px] text-right">Action</TableHead> : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={reopenOnly ? 8 : 6} className="h-24 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <Spinner size="sm" />
                                            <span>Loading discarded leads...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={reopenOnly ? 8 : 6} className="h-24 text-center text-destructive">
                                        Failed to load discarded leads.
                                    </TableCell>
                                </TableRow>
                            ) : discardedTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={reopenOnly ? 8 : 6} className="h-24 text-center text-muted-foreground">
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
                                        {reopenOnly ? (
                                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                                {ticket.discardedDate}
                                            </TableCell>
                                        ) : null}
                                        <TableCell className="text-right text-muted-foreground">{ticket.createdDate}</TableCell>
                                        {reopenOnly ? (
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    disabled={dismissRemindersMutation.isPending}
                                                    onClick={() =>
                                                        dismissRemindersMutation.mutate({ ticket_ids: [ticket.id] })
                                                    }
                                                >
                                                    Seen
                                                </Button>
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {totalPages > 1 && (
                        <Pagination className="py-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (page > 1) setPage(page - 1);
                                        }}
                                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-sm px-4">
                                        Page {page} of {totalPages}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (page < totalPages) setPage(page + 1);
                                        }}
                                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
