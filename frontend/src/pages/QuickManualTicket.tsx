import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
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

const CUSTOMER_ISSUE_MARKER = "[Form: Customer Issue]";

function validatePhoneInput(phone: string): string | null {
  const raw = (phone ?? "").trim();
  if (!raw) return "Phone number is required.";
  if (raw.includes("|")) return "Phone number must not contain '|'.";
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return "Enter a valid phone number.";
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return "Phone number must be between 9 and 15 digits.";
  }
  return null;
}

function formatPhoneForDisplay(phone: string): string {
  const digitsOnly = (phone ?? "").replace(/\D/g, "").slice(0, 15);
  if (!digitsOnly) return "";
  if (digitsOnly.length <= 3) return `(${digitsOnly}`;
  return `(${digitsOnly.slice(0, 3)})${digitsOnly.slice(3)}`;
}

const quickTicketSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    ticket_type: z.enum(["NEW", "RENEWAL", "CHANGES", "CUSTOMER_ISSUE", "CANCELLATION"]),
    insurance_type: z.string().min(1, "Insurance type is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    assigned_to: z.string().optional(),
    additional_notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.first_name?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "First name is required", path: ["first_name"] });
    }
    if (!data.last_name?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Last name is required", path: ["last_name"] });
    }
    if (!data.email?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email is required", path: ["email"] });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email address", path: ["email"] });
    }
    const phoneErr = validatePhoneInput(data.phone || "");
    if (phoneErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: phoneErr, path: ["phone"] });
    }
  });

type QuickTicketValues = z.infer<typeof quickTicketSchema>;

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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = String(user?.role ?? "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const canUseQuickManual = isAdmin || isAgent;

  const form = useForm<QuickTicketValues>({
    resolver: zodResolver(quickTicketSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      occupation: "",
      address: "",
      ticket_type: "NEW",
      insurance_type: "",
      priority: "MEDIUM",
      assigned_to: "unassigned",
      additional_notes: "",
    },
  });

  useEffect(() => {
    if (!canUseQuickManual) return;
    if (isAgent && user?.id) {
      form.setValue("assigned_to", String(user.id));
    }
  }, [canUseQuickManual, isAgent, user?.id, form]);

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

  const onSubmit = async (values: QuickTicketValues) => {
    try {
      setIsSubmitting(true);
      await ensureCsrfCookie();

      const createRes = await api.post("/api/clients/", {
        first_name: values.first_name!.trim(),
        last_name: values.last_name!.trim(),
        email: values.email!.trim(),
        phone: values.phone!.trim(),
        occupation: (values.occupation || "").trim(),
        address: (values.address || "").trim(),
      });
      const clientId = Number(createRes.data?.id);
      if (!clientId) {
        toast.error("Client was created but no id was returned.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["clients"], exact: false });

      const isCustomerIssue = values.ticket_type === "CUSTOMER_ISSUE";
      const backendTicketType = isCustomerIssue ? "CHANGES" : values.ticket_type;
      const cleanNotes = (values.additional_notes || "").trim();
      const additionalNotes = isCustomerIssue
        ? [cleanNotes, CUSTOMER_ISSUE_MARKER].filter(Boolean).join("\n")
        : cleanNotes;

      const payload = {
        client: clientId,
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

  if (!canUseQuickManual) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/new-ticket")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Quick Manual Ticket is available only for Admin and Agent users.</CardDescription>
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
          <p className="text-sm text-muted-foreground mt-1">Add a new client and create a ticket in one step.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/new-ticket")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Create Ticket</CardTitle>
          <CardDescription>New client details and ticket basics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Client details</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(000) 000-0000"
                            {...field}
                            onChange={(e) => field.onChange(formatPhoneForDisplay(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Street, city, postal…" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    {isAdmin ? (
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
                    ) : (
                      <FormControl>
                        <Input value={user?.name || user?.email || "Self"} disabled />
                      </FormControl>
                    )}
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
