import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { ensureCsrfCookie } from "@/lib/csrf";
import { handleApiError } from "@/lib/error-utils";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

import { cancellationSchema, type CancellationFormValues } from "@/schemas/cancellationSchema";
import { ContactSection } from "@/components/forms/ContactSection";

const CancellationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const navigate = useNavigate();
  const isCrmPage = window.location.pathname.startsWith("/crm/");

  const form = useForm<CancellationFormValues>({
    resolver: zodResolver(cancellationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      occupation: "",
      phone: "",
      email: "",
      insurance_type: "",
      cancellation_date: "",
      cancellation_reason: "",
      policy_numbers_and_emails: "",
      additional_details: "",
    },
  });

  const onSubmit = async (data: CancellationFormValues) => {
    setIsSubmitting(true);
    try {
      await ensureCsrfCookie();
      const isCrm = window.location.pathname.startsWith("/crm/");
      const payload: any = {
        ...data,
        ...(isCrm ? { source_override: "MANUAL" } : {}),
      };

      const response = await api.post("/api/forms/cancellation/", payload);
      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Cancellation request submitted successfully.");
      }
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>Your cancellation request has been submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Reference Number:</p>
              <p className="font-mono font-bold text-lg">{ticketNo}</p>
            </div>
            {isCrmPage && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => navigate("/tickets")} className="gap-2">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {isCrmPage && (
          <div className="flex items-center justify-end mb-4">
            <Button variant="ghost" type="button" onClick={() => navigate("/tickets")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Tickets
            </Button>
          </div>
        )}
        <Card className="border shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-3xl">Cancellation Request Form</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Request to cancel your existing policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <ContactSection control={form.control} />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Policy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="insurance_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Type <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Auto">Auto</SelectItem>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Tenant">Tenant</SelectItem>
                              <SelectItem value="Rental">Rental Property</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cancellation_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cancelatio Date <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Reason</h3>
                  <FormField
                    control={form.control}
                    name="cancellation_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Cancelation <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Please describe the reason for cancellation" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="policy_numbers_and_emails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Policy number, Please mention both policy number Auto and home or tenant., if two name in policy please provide other email address as well. <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter policy numbers and additional email (if any)" rows={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additional_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Anything else we should know?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting} size="lg">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Cancellation"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CancellationForm;
