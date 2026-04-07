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

import { renewalSchema, type RenewalFormValues } from "@/schemas/renewalSchema";
import { ContactSection } from "@/components/forms/ContactSection";
import { AddressSection } from "@/components/forms/AddressSection";

const SERVICES = [
  "Auto insurance renewal",
  "Auto and home insurance renewal",
  "Home insurance renewal",
  "Truck insurance renewal",
  "Commericial insurance renewal",
];

const RenewalRequestForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const navigate = useNavigate();
  const isCrmPage = window.location.pathname.startsWith("/crm/");

  const form = useForm<RenewalFormValues>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      occupation: "",
      phone: "",
      email: "",
      company_name: "",
      street_address: "",
      street_address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      services_you_are_interested_in: [],
      renewal_date: "",
      last_year_price: "",
      renewal_price: "",
      premium_looking_current_year: "",
      additional_details: "",
    },
  });

  const onSubmit = async (data: RenewalFormValues) => {
    setIsSubmitting(true);
    try {
      await ensureCsrfCookie();
      const isCrm = window.location.pathname.startsWith("/crm/");
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        occupation: data.occupation,
        email: data.email,
        phone: data.phone,
        street_address: data.street_address,
        street_address_line_2: data.street_address_line_2,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        insurance_type: "Renewal",
        company_name: data.company_name,
        services_you_are_interested_in: data.services_you_are_interested_in.join(", "),
        renewal_date: data.renewal_date,
        last_year_price: data.last_year_price,
        renewal_price: data.renewal_price,
        premium_looking_current_year: data.premium_looking_current_year,
        additional_details: data.additional_details,
        ...(isCrm ? { source_override: "MANUAL" } : {}),
      };

      const response = await api.post("/api/forms/renewal/", payload);
      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Renewal request submitted successfully.");
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
            <CardDescription>Your renewal request has been submitted.</CardDescription>
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
            <CardTitle className="text-3xl">Insurance Renewal Form</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Fill the fields below accurately and we will return back to you in a short time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <ContactSection control={form.control} />
                
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <AddressSection control={form.control} />

                {/* Service Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Service Details</h3>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="services_you_are_interested_in"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base text-foreground">
                              Services You are Interested In <span className="text-destructive">*</span>
                            </FormLabel>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {SERVICES.map((label) => {
                              const id = label.toLowerCase().replace(/\s+/g, "-");
                              const checked = form.watch("services_you_are_interested_in").includes(label);
                              return (
                                <label key={id} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const current = form.getValues("services_you_are_interested_in");
                                      const next = new Set(current);
                                      if (e.target.checked) next.add(label);
                                      else next.delete(label);
                                      form.setValue("services_you_are_interested_in", Array.from(next), {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      });
                                    }}
                                  />
                                  {label}
                                </label>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="renewal_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Date <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_year_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last year price</FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="renewal_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Price <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="premium_looking_current_year"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Premeium you looking for your current Year. <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                  <FormField
                    control={form.control}
                    name="additional_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Anything else we should know?" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting} size="lg">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Form"
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

export default RenewalRequestForm;
