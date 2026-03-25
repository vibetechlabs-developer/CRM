import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { handleApiError } from "@/lib/error-utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

import { insuranceFormSchema, type InsuranceFormValues } from "@/schemas/insuranceFormSchema";
import { ContactSection } from "@/components/forms/ContactSection";
import { AddressSection } from "@/components/forms/AddressSection";
import { InsuranceDetailsSection } from "@/components/forms/InsuranceDetailsSection";
import { AutoInsuranceSection } from "@/components/forms/AutoInsuranceSection";

const InsuranceFormManual = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      occupation: "",
      phone: "",
      email: "",
      street_address: "",
      street_address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      insurance_type: "",
      insurance_effective_date: "",
      date_of_birth: "",
      currently_insured: undefined, // empty causes zod to error till selected
      number_of_drivers: "1",
      number_of_vehicles: "1",
      driving_license_number: "",
      g1_date: "",
      g2_date: "",
      g_date: "",
      car_vin_number: "",
      one_way_km: "",
      annual_km: "",
      at_fault_claim: undefined,
      conviction: undefined,
      additional_details: "",
    },
  });

  const insuranceType = form.watch("insurance_type");

  const showAutoFields = useMemo(() => {
    return (
      insuranceType === "Only Auto Insurance" ||
      insuranceType === "Auto plus Tenant Insurance" ||
      insuranceType === "Auto plus Home Insurance" ||
      insuranceType === "Auto Plus Home Plus Rental Insurance"
    );
  }, [insuranceType]);

  const onSubmit = async (data: InsuranceFormValues) => {
    setIsSubmitting(true);
    try {
      // This form is used by agents (CRM). Send a hint so backend can label creator correctly.
      const payload = { ...data, source_override: "MANUAL" };
      const response = await api.post("/api/insurance-form/", payload);
      
      if (response.data.success) {
        toast.success(`Form submitted successfully! Ticket #${response.data.ticket_no} created.`);
        form.reset();
        setTimeout(() => {
          navigate("/tickets");
        }, 1500);
      }
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance Form - Manual Entry</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Enter client insurance information manually
          </p>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={() => navigate("/tickets")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Feril Kapadia Insurance Quotation Form</CardTitle>
          <CardDescription>
            Fill in the client information below. A ticket will be automatically created upon submission.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <ContactSection control={form.control} />
              
              <AddressSection control={form.control} />
              
              <InsuranceDetailsSection control={form.control} />
              
              {showAutoFields && <AutoInsuranceSection control={form.control} />}

              {/* General History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="at_fault_claim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any at fault claim in Last 6 years? <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                <FormField
                  control={form.control}
                  name="additional_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any other details to assist us make informed decision?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional details..." 
                          rows={4} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                    onClick={() => navigate("/tickets")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit & Create Ticket"
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

export default InsuranceFormManual;
