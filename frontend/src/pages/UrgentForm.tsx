import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { ensureCsrfCookie } from "@/lib/csrf";
import { handleApiError } from "@/lib/error-utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft, AlertTriangle, Zap, ShieldAlert } from "lucide-react";

import { urgentSchema, type UrgentFormValues } from "@/schemas/urgentSchema";
import { ContactSection } from "@/components/forms/ContactSection";
import { AddressSection } from "@/components/forms/AddressSection";

const UrgentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const navigate = useNavigate();
  const isCrmPage = window.location.pathname.startsWith("/crm/");

  const form = useForm<UrgentFormValues>({
    resolver: zodResolver(urgentSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      occupation: "",
      phone: "",
      email: "",
      street_address: "",
      street_address_line_2: "",
      city: "",
      state: "Ontario",
      postal_code: "",
      license_number: "",
      vin_number: "",
      notes: "",
      additional_details: "",
    },
  });

  const onSubmit = async (data: UrgentFormValues) => {
    setIsSubmitting(true);
    try {
      await ensureCsrfCookie();
      const isCrm = window.location.pathname.startsWith("/crm/");
      const payload: any = {
        ...data,
        ...(isCrm ? { source_override: "MANUAL" } : {}),
      };

      const response = await api.post("/api/forms/urgent/", payload);

      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Urgent request submitted successfully! An agent has been alerted.");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const fieldErrors = error.response.data?.field_errors;
        if (fieldErrors && typeof fieldErrors === "object") {
          Object.entries(fieldErrors as Record<string, unknown>).forEach(([field, msgs]) => {
            const firstMsg = Array.isArray(msgs) ? msgs[0] : msgs;
            if (firstMsg) {
              form.setError(field as keyof UrgentFormValues, {
                type: "server",
                message: String(firstMsg),
              });
            }
          });
          return;
        }
      }
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-background to-amber-50/40 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200/60 shadow-xl">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 mx-auto mb-2">
              <Zap className="h-3.5 w-3.5 fill-red-600" /> High Priority Alert Triggered
            </div>
            <CardTitle className="text-2xl font-bold">Urgent Request Received</CardTitle>
            <CardDescription className="text-sm">
              Your request has been prioritized and routed to our immediate response team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-muted/70 p-4 rounded-xl border space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reference Ticket #</p>
              <p className="font-mono font-bold text-xl text-primary">{ticketNo}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              An insurance broker will reach out to you as quickly as possible.
            </p>
            {isCrmPage && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => navigate("/tickets")} className="gap-2 w-full">
                  <ArrowLeft className="h-4 w-4" /> Back to Tickets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/40 via-background to-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {isCrmPage && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" type="button" onClick={() => navigate("/new-ticket")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Request Types
            </Button>
            <Button variant="outline" type="button" onClick={() => navigate("/tickets")} className="gap-2">
              All Tickets
            </Button>
          </div>
        )}

        <Card className="border-red-200/80 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <ShieldAlert className="h-3.5 w-3.5" /> Urgent Submission
              </span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              Urgent Request Form
            </CardTitle>
            <CardDescription className="text-white/90 text-sm mt-1 max-w-2xl">
              Please provide your contact, address, driver license, VIN number, and detailed notes below. Our team is alerted immediately upon submission.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Contact Information Section */}
                <ContactSection control={form.control} />

                {/* Address Section */}
                <AddressSection control={form.control} />

                {/* Vehicle & License Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h3 className="text-lg font-semibold text-foreground">License & Vehicle Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="license_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Driver's License Number <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. D1234-56789-01234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vin_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            VIN Number (Vehicle Identification) <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="17-character VIN number" {...field} maxLength={17} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Urgent Notes Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-semibold text-foreground">Urgent Notes & Details</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Urgent Request Details / Notes <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide complete details on what makes this urgent (e.g. same-day binder required, immediate vehicle replacement, urgent policy adjustment)..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additional_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any other remarks or preferred callback hours..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submission CTA */}
                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-base font-semibold py-6 shadow-lg shadow-red-600/20 transition-all duration-200"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Urgent Request...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5 fill-white" />
                        Submit Urgent Request
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Submitting this form immediately flags your request as High Priority in our CRM queue.
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UrgentForm;
