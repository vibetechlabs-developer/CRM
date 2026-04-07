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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

import { customerIssueSchema, type CustomerIssueFormValues } from "@/schemas/customerIssueSchema";
import { ContactSection } from "@/components/forms/ContactSection";

const CustomerIssueForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const navigate = useNavigate();
  const isCrmPage = window.location.pathname.startsWith("/crm/");

  const form = useForm<CustomerIssueFormValues>({
    resolver: zodResolver(customerIssueSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      occupation: "",
      phone: "",
      email: "",
      policy_number: "",
      issue_description: "",
      additional_details: "",
    },
  });

  const onSubmit = async (data: CustomerIssueFormValues) => {
    setIsSubmitting(true);
    try {
      await ensureCsrfCookie();
      // If agent is submitting from CRM pages, label it as MANUAL on backend.
      const isCrm = window.location.pathname.startsWith("/crm/");
      const payload: any = {
        ...data,
        ...(isCrm ? { source_override: "MANUAL" } : {}),
      };

      const response = await api.post("/api/forms/customer-issue/", payload);
      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Issue submitted successfully.");
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
            <CardDescription>Your issue has been submitted.</CardDescription>
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
            <CardTitle className="text-3xl">Customer Issue Submission Form</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Please provide your contact details and describe your issue so we can assist you promptly.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <ContactSection control={form.control} />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Policy</h3>
                  <FormField
                    control={form.control}
                    name="policy_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Your policy number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Issue</h3>
                  <FormField
                    control={form.control}
                    name="issue_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please describe your issue <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the issue in detail" rows={5} {...field} />
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
                      "Submit Issue"
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

export default CustomerIssueForm;
