import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import api, { fetchAllPages } from "@/lib/api";
import { ensureCsrfCookie } from "@/lib/csrf";
import { handleApiError } from "@/lib/error-utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CUSTOMER_ISSUE_MARKER = "[Form: Customer Issue]";

const quickTicketSchema = z.object({
  client: z.string().min(1, "Please select a client"),
  ticket_type: z.enum(["NEW", "RENEWAL", "CHANGES", "CUSTOMER_ISSUE", "CANCELLATION"]),
  insurance_type: z.string().min(1, "Insurance type is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigned_to: z.string().optional(),
  additional_notes: z.string().optional(),
});

type QuickTicketValues = z.infer<typeof quickTicketSchema>;

type ClientRow = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  client_id?: string;
};

type UserRow = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
};

const requestTypeOptions = [
  { label: "New Policy", value: "NEW" },
  { label: "Renewal", value: "RENEWAL" },
  { label: "Changes Form", value: "CHANGES" },
  { label: "Customer Issue", value: "CUSTOMER_ISSUE" },
  { label: "Cancellation", value: "CANCELLATION" },
];

const QuickManualTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const clientPickerRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = String(user?.role ?? "").toUpperCase() === "ADMIN";

  const form = useForm<QuickTicketValues>({
    resolver: zodResolver(quickTicketSchema),
    defaultValues: {
      client: "",
      ticket_type: "NEW",
      insurance_type: "",
      priority: "MEDIUM",
      assigned_to: "unassigned",
      additional_notes: "",
    },
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["quick-ticket-clients"],
    enabled: isAdmin,
    queryFn: async () => {
      const allClients = await fetchAllPages("/api/clients/");
      return (Array.isArray(allClients) ? allClients : []) as ClientRow[];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["quick-ticket-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const allUsers = await fetchAllPages("/api/users/");
      return (Array.isArray(allUsers) ? allUsers : []) as UserRow[];
    },
  });

  const assignableUsers = useMemo(
    () => users.filter((u) => ["AGENT", "MANAGER", "ADMIN"].includes(String(u.role || "").toUpperCase())),
    [users]
  );

  const selectedClientId = form.watch("client");
  const selectedClientLabel = useMemo(() => {
    const selected = clients.find((client) => String(client.id) === String(selectedClientId));
    if (!selected) return "";
    return `${selected.first_name || ""} ${selected.last_name || ""}`.trim() || selected.email || selected.client_id || `Client ${selected.id}`;
  }, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const label = `${client.first_name || ""} ${client.last_name || ""}`.trim();
      const email = client.email || "";
      const code = client.client_id || "";
      return `${label} ${email} ${code}`.toLowerCase().includes(q);
    });
  }, [clients, clientSearch]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!clientPickerRef.current) return;
      if (!clientPickerRef.current.contains(event.target as Node)) {
        setClientPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const onSubmit = async (values: QuickTicketValues) => {
    try {
      setIsSubmitting(true);
      await ensureCsrfCookie();

      const isCustomerIssue = values.ticket_type === "CUSTOMER_ISSUE";
      const backendTicketType = isCustomerIssue ? "CHANGES" : values.ticket_type;
      const cleanNotes = (values.additional_notes || "").trim();
      const additionalNotes = isCustomerIssue
        ? [cleanNotes, CUSTOMER_ISSUE_MARKER].filter(Boolean).join("\n")
        : cleanNotes;

      const payload = {
        client: Number(values.client),
        ticket_type: backendTicketType,
        insurance_type: values.insurance_type,
        priority: values.priority,
        source: "MANUAL",
        additional_notes: additionalNotes,
        ...(values.assigned_to && values.assigned_to !== "unassigned"
          ? { assigned_to: Number(values.assigned_to) }
          : {}),
      };

      const response = await api.post("/api/tickets/", payload);
      toast.success(`Ticket created successfully. #${response.data?.ticket_no || ""}`);
      navigate("/tickets");
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/new-ticket")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Quick Manual Ticket is available only for Admin users.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quick Manual Ticket</h1>
          <p className="text-sm text-muted-foreground mt-1">Create ticket from existing client without filling full form.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/new-ticket")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Create Ticket</CardTitle>
          <CardDescription>Select client and basic details only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <div className="relative" ref={clientPickerRef}>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          disabled={clientsLoading}
                          onClick={() => setClientPickerOpen((prev) => !prev)}
                          className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                        >
                          {clientsLoading ? "Loading clients..." : selectedClientLabel || "Select client"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>

                      {clientPickerOpen && (
                        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md">
                          <div className="border-b p-2">
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                placeholder="Search by name, email or client id..."
                                className="pl-9"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-1">
                            {filteredClients.length === 0 ? (
                              <p className="p-2 text-sm text-muted-foreground">No client found.</p>
                            ) : (
                              filteredClients.map((client) => {
                                const label =
                                  `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
                                  client.email ||
                                  client.client_id ||
                                  `Client ${client.id}`;
                                return (
                                  <button
                                    key={client.id}
                                    type="button"
                                    className={cn(
                                      "flex w-full items-center rounded-sm px-3 py-2 text-left text-sm hover:bg-accent",
                                      String(field.value) === String(client.id) && "bg-accent"
                                    )}
                                    onClick={() => {
                                      field.onChange(String(client.id));
                                      setClientPickerOpen(false);
                                    }}
                                  >
                                    {label}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ticket_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {requestTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="insurance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Auto Insurance, Home Insurance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {assignableUsers.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Any quick notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/new-ticket")} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Ticket"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickManualTicket;
