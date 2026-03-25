import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { handleApiError } from "@/lib/error-utils";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

import { policyChangeSchema, type PolicyChangeFormValues } from "@/schemas/policyChangeSchema";
import { ContactSection } from "@/components/forms/ContactSection";

const CHANGES_OPTIONS = [
  "If temporary pink is expiring & new policy hasn't came yet write details",
  "Apply Mobile App Discount in policy again & write below details",
  "Place car in parking insurance (Minimum 45 Days required)",
  "Remove car from parking Insurance",
  "Updating G2, G license in policy",
  "Address change, mention in comments",
  "Car changes give new VIN number in comments (Mention Replace or Add)",
  "Billing details change write in comments & email void check on Feril.kapadia@ableinsurance.ca",
  "Additon of driver, mention license number in comments",
  "If any other Issue write In comment, we try to help you as soon as posiible.",
];

const PLEASE_INFORM_US_OPTIONS = [
  "We are removeing old car from policy and adding new car",
  "We are adding another vehicle inpolicy.",
];

const CAR_IS_OPTIONS = ["Lease", "Fianance", "Paid Out"];

const PolicyChangeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const navigate = useNavigate();

  const form = useForm<PolicyChangeFormValues>({
    resolver: zodResolver(policyChangeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      occupation: "",
      email: "",
      phone: "",
      what_changes: [],
      effective_date_of_change: "",
      driving_license_number: "",
      g1_date: "",
      g2_date: "",
      g_date: "",
      new_street_address: "",
      new_street_address_line_2: "",
      new_city: "",
      new_state: "",
      new_postal_code: "",
      one_way_km: "",
      annual_km: "",
      any_other_license: "",
      please_inform_us: [],
      new_car_vin_number: "",
      car_is: [],
      bank_or_lease_details: "",
      cancealtion_date: "",
      billing_details_comments: "",
      requesting_information_or_instruction: "",
    },
  });

  const whatChanges = form.watch("what_changes") || [];
  const selected = useMemo(() => new Set(whatChanges), [whatChanges]);

  const showBillingDetails = useMemo(
    () =>
      selected.has(
        "Billing details change write in comments & email void check on Feril.kapadia@ableinsurance.ca"
      ),
    [selected]
  );
  const showEffectiveDate = useMemo(() => {
    return (
      selected.has("Place car in parking insurance (Minimum 45 Days required)") ||
      selected.has("Remove car from parking Insurance") ||
      selected.has("Additon of driver, mention license number in comments") ||
      selected.has("Car changes give new VIN number in comments (Mention Replace or Add)") ||
      selected.has("Address change, mention in comments") ||
      selected.has("Updating G2, G license in policy") ||
      selected.has("Apply Mobile App Discount in policy again & write below details") ||
      showBillingDetails
    );
  }, [selected, showBillingDetails]);

  const showLicenseBlockForUpdate = useMemo(
    () => selected.has("Updating G2, G license in policy"),
    [selected]
  );
  const showLicenseBlockForAddition = useMemo(
    () => selected.has("Additon of driver, mention license number in comments"),
    [selected]
  );
  const showNewAddress = useMemo(() => selected.has("Address change, mention in comments"), [selected]);
  const showCarChangeCluster = useMemo(
    () => selected.has("Car changes give new VIN number in comments (Mention Replace or Add)"),
    [selected]
  );
  const showCancellationDate = useMemo(() => false, []); // Kept hidden unless required

  const onSubmit = async (data: PolicyChangeFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        occupation: data.occupation,
        email: data.email,
        phone: data.phone,
        
        what_changes: data.what_changes.join(", "),
        
        effective_date_of_change: data.effective_date_of_change,
        driving_license_number: data.driving_license_number,
        
        add_g2_or_g_date: data.g2_date || data.g_date || data.g1_date,
        g1_date: data.g1_date,
        g2_date: data.g2_date,
        g_date: data.g_date,
        
        new_address_street: data.new_street_address,
        new_address_line_2: data.new_street_address_line_2,
        new_address_city: data.new_city,
        new_address_state: data.new_state,
        new_address_postal: data.new_postal_code,
        one_way_km: data.one_way_km,
        annual_km: data.annual_km,
        any_other_license: data.any_other_license,
        
        please_inform_us: data.please_inform_us?.join(", ") || "",
        
        new_car_vin_number: data.new_car_vin_number,
        car_is: data.car_is?.join(", ") || "",
        bank_or_lease_details: data.bank_or_lease_details,
        
        cancealtion_date: data.cancealtion_date,
        
        billing_details_comments: data.billing_details_comments,
        
        requesting_information_or_instruction: data.requesting_information_or_instruction,
        
        insurance_type: "Policy Change",
      };

      const response = await api.post("/api/forms/changes/", payload);
      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Policy change request submitted successfully.");
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
            <CardDescription>Your policy change request has been submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Reference Number:</p>
              <p className="font-mono font-bold text-lg">{ticketNo}</p>
            </div>
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/tickets")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-end mb-4">
          <Button variant="ghost" type="button" onClick={() => navigate("/tickets")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Tickets
          </Button>
        </div>
        <Card className="border shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-3xl">Inssurance Policy Changes Request Form</CardTitle>
            <CardDescription className="text-primary-foreground/90"></CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <ContactSection control={form.control} />

                {/* What changes (checkbox list) */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="what_changes"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel className="text-base text-foreground leading-relaxed">
                            What changes you want to make in your Auto or Tenant policy or Home insurance? Write in detailed in below box.
                            You will get help with below Services &amp; changes will be done. "For cancelation of policy this form will not work."
                            <span className="text-destructive"> *</span>
                          </FormLabel>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {CHANGES_OPTIONS.map((label) => {
                            const id = label.toLowerCase().replace(/\s+/g, "-");
                            const checked = form.watch("what_changes").includes(label);
                            return (
                              <label key={id} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const current = form.getValues("what_changes");
                                    const next = new Set(current);
                                    if (e.target.checked) next.add(label);
                                    else next.delete(label);
                                    form.setValue("what_changes", Array.from(next), {
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

                {/* Dates and license (conditionally revealed) */}
                {(showEffectiveDate || showLicenseBlockForUpdate || showLicenseBlockForAddition) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showEffectiveDate && (
                      <FormField
                        control={form.control}
                        name="effective_date_of_change"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Effective Date of Change</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {showLicenseBlockForUpdate && (
                      <>
                        <FormField
                          control={form.control}
                          name="driving_license_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Driving License Number</FormLabel>
                              <FormControl>
                                <Input placeholder="License Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="g2_date"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Add G2 or G date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} onChange={(e) => {
                                  field.onChange(e);
                                  form.setValue("g1_date", "");
                                  form.setValue("g_date", "");
                                }} />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">Date</div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    {showLicenseBlockForAddition && (
                      <>
                        <FormField
                          control={form.control}
                          name="driving_license_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Driving License Number</FormLabel>
                              <FormControl>
                                <Input placeholder="License Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="g1_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>G1 Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="g2_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>G2 Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="g_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>G Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* New address (conditionally revealed) */}
                {showNewAddress && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">New address</h3>
                    <FormField
                      control={form.control}
                      name="new_street_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Street Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_street_address_line_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Street Address Line 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="new_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="new_state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / Province <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="State / Province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="new_postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal / Zip Code <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Postal / Zip Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="one_way_km"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>One Way KM</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="One Way KM" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="annual_km"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual KM</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Annual KM" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="any_other_license"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Is any other driving licence in household?</FormLabel>
                            <FormControl>
                              <Input placeholder="Yes / No" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Car change cluster */}
                {showCarChangeCluster && (
                  <>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="please_inform_us"
                        render={() => (
                          <FormItem>
                            <div className="mb-2">
                              <FormLabel className="text-base text-foreground">Please inform Us.</FormLabel>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {PLEASE_INFORM_US_OPTIONS.map((label) => {
                                const id = label.toLowerCase().replace(/\s+/g, "-");
                                const checked = (form.watch("please_inform_us") || []).includes(label);
                                return (
                                  <label key={id} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = form.getValues("please_inform_us") || [];
                                        const next = new Set(current);
                                        if (e.target.checked) next.add(label);
                                        else next.delete(label);
                                        form.setValue("please_inform_us", Array.from(next));
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

                    <FormField
                      control={form.control}
                      name="new_car_vin_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please provide New Car Vin number</FormLabel>
                          <FormControl>
                            <Textarea placeholder="VIN number" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="car_is"
                        render={() => (
                          <FormItem>
                            <div className="mb-2">
                              <FormLabel className="text-base text-foreground">Car is On Lease - Fianance - Paid Out</FormLabel>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {CAR_IS_OPTIONS.map((label) => {
                                const id = label.toLowerCase().replace(/\s+/g, "-");
                                const checked = (form.watch("car_is") || []).includes(label);
                                return (
                                  <label key={id} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = form.getValues("car_is") || [];
                                        const next = new Set(current);
                                        if (e.target.checked) next.add(label);
                                        else next.delete(label);
                                        form.setValue("car_is", Array.from(next));
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

                    <FormField
                      control={form.control}
                      name="bank_or_lease_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            If Car is on Lease or Fianance Please let us know Bank or lease Name and please mention Address as well
                            if you not aware about please Contact your sales person.
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Bank details" rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Cancellation Date (kept hidden) */}
                {showCancellationDate && (
                  <FormField
                    control={form.control}
                    name="cancealtion_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancealtion Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Billing details */}
                {showBillingDetails && (
                  <FormField
                    control={form.control}
                    name="billing_details_comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing details change (write in comments)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Comments" rows={4} {...field} />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Email void check on <span className="underline">Feril.kapadia@ableinsurance.ca</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Additional instruction */}
                <FormField
                  control={form.control}
                  name="requesting_information_or_instruction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requesting Information Regarding or Any additional instruction</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional instruction" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      "Submit"
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

export default PolicyChangeForm;
