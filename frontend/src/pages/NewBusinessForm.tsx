import { useState, useMemo } from "react";
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
import { Loader2, CheckCircle2 } from "lucide-react";

import { insuranceFormSchema, type InsuranceFormValues } from "@/schemas/insuranceFormSchema";
import { ContactSection } from "@/components/forms/ContactSection";
import { AddressSection } from "@/components/forms/AddressSection";
import { InsuranceDetailsSection } from "@/components/forms/InsuranceDetailsSection";
import { AutoInsuranceSection } from "@/components/forms/AutoInsuranceSection";

const NewBusinessForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");

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
      currently_insured: undefined,
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

  const insuranceType = form.watch("insurance_type") || "";

  const showAutoFields = useMemo(() => {
    return insuranceType.includes("Auto");
  }, [insuranceType]);

  const onSubmit = async (data: InsuranceFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await api.post("/api/forms/new-business/", data);
      
      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Form submitted successfully! We will contact you shortly.");
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
            <CardDescription>Your quotation request has been submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Reference Number:</p>
              <p className="font-mono font-bold text-lg">{ticketNo}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-3xl">Feril Kapadia Insurance Quotation Form</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Please fill the form accurately for better assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <ContactSection control={form.control} />
                
                <AddressSection control={form.control} />
                
                <InsuranceDetailsSection control={form.control} />
                
                {showAutoFields && <AutoInsuranceSection control={form.control} />}

                {/* History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="at_fault_claim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Any at fault claim in Last 6 years <span className="text-destructive">*</span></FormLabel>
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
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                    size="lg"
                  >
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

export default NewBusinessForm;
