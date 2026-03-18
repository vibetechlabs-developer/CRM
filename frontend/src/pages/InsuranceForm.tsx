import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const InsuranceForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");

  const [formData, setFormData] = useState({
    // Name
    first_name: "",
    last_name: "",
    
    // Contact
    phone: "",
    email: "",
    
    // Address
    street_address: "",
    street_address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    address: "",
    
    // Insurance
    insurance_type: "",
    insurance_effective_date: "",
    date_of_birth: "",
    currently_insured: "",
    
    // Auto Insurance Fields
    number_of_drivers: "1",
    number_of_vehicles: "1",
    driving_license_number: "",
    g1_date: "",
    g2_date: "",
    g_date: "",
    car_vin_number: "",
    one_way_km: "",
    annual_km: "",
    at_fault_claim: "",
    conviction: "",
    
    // Home/Tenant Insurance Fields
    property_address: "",
    property_address_line_2: "",
    property_city: "",
    property_state: "",
    property_postal_code: "",
    property_type: "", // Home or Tenant
    property_value: "",
    year_built: "",
    square_footage: "",
    home_claims_history: "",
    
    // Rental Property Insurance Fields
    rental_property_address: "",
    rental_property_address_line_2: "",
    rental_property_city: "",
    rental_property_state: "",
    rental_property_postal_code: "",
    rental_property_type: "",
    number_of_units: "1",
    rental_property_value: "",
    rental_year_built: "",
    rental_income: "",
    
    // Additional
    additional_details: "",
  });

  // JotForm behavior: Auto-specific fields are shown only for insurance types that include Auto
  const showAutoFields = useMemo(() => {
    const type = formData.insurance_type;
    return (
      type === "Only Auto Insurance" ||
      type === "Auto plus Tenant Insurance" ||
      type === "Auto plus Home Insurance" ||
      type === "Auto Plus Home Plus Rental Insurance"
    );
  }, [formData.insurance_type]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields (Name, Email, Phone)");
      return false;
    }

    if (!formData.insurance_type) {
      toast.error("Please select an insurance type");
      return false;
    }

    // Validate general history field (required for all types)
    if (!formData.at_fault_claim) {
      toast.error("Please answer the 'Any at fault claim in Last 6 years' question");
      return false;
    }

    // Validate auto fields if auto insurance is selected
    if (showAutoFields) {
      if (!formData.driving_license_number || !formData.car_vin_number || 
          !formData.one_way_km || !formData.annual_km || !formData.conviction) {
        toast.error("Please fill in all required auto insurance fields");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/insurance-form/", formData);
      
      if (response.data.success) {
        setTicketNo(response.data.ticket_no);
        setIsSuccess(true);
        toast.success("Form submitted successfully! We'll contact you soon.");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to submit form. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      street_address: "",
      street_address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      address: "",
      insurance_type: "",
      insurance_effective_date: "",
      date_of_birth: "",
      currently_insured: "",
      number_of_drivers: "1",
      number_of_vehicles: "1",
      driving_license_number: "",
      g1_date: "",
      g2_date: "",
      g_date: "",
      car_vin_number: "",
      one_way_km: "",
      annual_km: "",
      at_fault_claim: "",
      conviction: "",
      property_address: "",
      property_address_line_2: "",
      property_city: "",
      property_state: "",
      property_postal_code: "",
      property_type: "",
      property_value: "",
      year_built: "",
      square_footage: "",
      home_claims_history: "",
      rental_property_address: "",
      rental_property_address_line_2: "",
      rental_property_city: "",
      rental_property_state: "",
      rental_property_postal_code: "",
      rental_property_type: "",
      number_of_units: "1",
      rental_property_value: "",
      rental_year_built: "",
      rental_income: "",
      additional_details: "",
    });
    setTicketNo("");
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
            <CardDescription>
              Your insurance quotation form has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Reference Number:</p>
              <p className="font-mono font-bold text-lg">{ticketNo}</p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              We've received your information and will contact you shortly to provide a quotation.
            </p>
            <Button 
              onClick={() => {
                setIsSuccess(false);
                resetForm();
              }}
              className="w-full"
              variant="outline"
            >
              Submit Another Form
            </Button>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Name</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last Name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(000) 000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Mailing Address</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Street Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      placeholder="Street Address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Address Line 2</Label>
                    <Input
                      value={formData.street_address_line_2}
                      onChange={(e) => setFormData({ ...formData, street_address_line_2: e.target.value })}
                      placeholder="Street Address Line 2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State / Province</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State / Province"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal / Zip Code</Label>
                      <Input
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="Postal / Zip Code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Insurance Details</h3>
                {/* Debug Info - Remove in production */}
                {formData.insurance_type && (
                  <div className="bg-muted p-2 rounded text-xs text-muted-foreground mb-4">
                    Active Sections: {showAutoFields ? "Auto" : "Base"}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Type Of Insurance <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup
                      value={formData.insurance_type}
                      onValueChange={(value) => {
                        // Reset auto-only fields when moving away from Auto types (JotForm behavior)
                        setFormData((prev) => ({
                          ...prev,
                          insurance_type: value,
                          ...(value === "Only Auto Insurance" ||
                          value === "Auto plus Tenant Insurance" ||
                          value === "Auto plus Home Insurance" ||
                          value === "Auto Plus Home Plus Rental Insurance"
                            ? {}
                            : {
                                number_of_drivers: "1",
                                number_of_vehicles: "1",
                                driving_license_number: "",
                                g1_date: "",
                                g2_date: "",
                                g_date: "",
                                car_vin_number: "",
                                one_way_km: "",
                                annual_km: "",
                                conviction: "",
                              }),
                        }));
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="ins-auto-only" value="Only Auto Insurance" />
                        <Label htmlFor="ins-auto-only" className="font-normal">Only Auto Insurance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="ins-home-tenant-only" value="Only Home/Tenant Insurance" />
                        <Label htmlFor="ins-home-tenant-only" className="font-normal">Only Home/Tenant Insurance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="ins-auto-tenant" value="Auto plus Tenant Insurance" />
                        <Label htmlFor="ins-auto-tenant" className="font-normal">Auto plus Tenant Insurance (Save upto 20% Extra)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="ins-auto-home" value="Auto plus Home Insurance" />
                        <Label htmlFor="ins-auto-home" className="font-normal">Auto plus Home Insurance (Save upto 20% Extra)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="ins-auto-home-rental" value="Auto Plus Home Plus Rental Insurance" />
                        <Label htmlFor="ins-auto-home-rental" className="font-normal">Auto Plus Home Plus renatal insurance (Save 20% Extra)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="ins-rental-only" value="Only Rental property Insurance" />
                        <Label htmlFor="ins-rental-only" className="font-normal">Only Rental property Insurance</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Effective Date</Label>
                    <Input
                      type="date"
                      value={formData.insurance_effective_date}
                      onChange={(e) => setFormData({ ...formData, insurance_effective_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Of Birth</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Are You Currently Insured? <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.currently_insured}
                      onValueChange={(value) => setFormData({ ...formData, currently_insured: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Auto Insurance Fields - Conditionally Shown */}
              {showAutoFields && (
                <div className="border-l-4 border-green-500 pl-4">
                  {/* Drivers & Vehicles */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Auto Insurance - Drivers & Vehicles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Number Of Drivers <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.number_of_drivers}
                          onValueChange={(value) => setFormData({ ...formData, number_of_drivers: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? "Driver" : "Drivers"}
                              </SelectItem>
                            ))}
                            <SelectItem value="10+">10 or more</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Number Of Vehicles <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.number_of_vehicles}
                          onValueChange={(value) => setFormData({ ...formData, number_of_vehicles: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? "Vehicle" : "Vehicles"}
                              </SelectItem>
                            ))}
                            <SelectItem value="10+">10 or more</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Driving License Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={formData.driving_license_number}
                          onChange={(e) => setFormData({ ...formData, driving_license_number: e.target.value })}
                          placeholder="Driving License Number"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>G1 Date</Label>
                        <Input
                          type="date"
                          value={formData.g1_date}
                          onChange={(e) => setFormData({ ...formData, g1_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>G2 Date</Label>
                        <Input
                          type="date"
                          value={formData.g2_date}
                          onChange={(e) => setFormData({ ...formData, g2_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>G Date</Label>
                        <Input
                          type="date"
                          value={formData.g_date}
                          onChange={(e) => setFormData({ ...formData, g_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Auto Insurance - Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Car VIN Number or Model, Make and Year <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={formData.car_vin_number}
                          onChange={(e) => setFormData({ ...formData, car_vin_number: e.target.value })}
                          placeholder="VIN Number or Model, Make, Year"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          One way Km <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={formData.one_way_km}
                          onChange={(e) => setFormData({ ...formData, one_way_km: e.target.value })}
                          placeholder="One way Km"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Annual KM <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={formData.annual_km}
                          onChange={(e) => setFormData({ ...formData, annual_km: e.target.value })}
                          placeholder="Annual KM"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Auto History - Conviction (Auto-specific) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Auto Insurance - History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Any Conviction in Last 3 Years? <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.conviction}
                          onValueChange={(value) => setFormData({ ...formData, conviction: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General History - Shows for all insurance types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Any at fault claim in Last 6 years? <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.at_fault_claim}
                      onValueChange={(value) => setFormData({ ...formData, at_fault_claim: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* JotForm: No extra sections for Home/Tenant/Rental; only Auto-specific fields toggle on/off */}

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                <div className="space-y-2">
                  <Label>Any other details to assist us make informed decision?</Label>
                  <Textarea
                    value={formData.additional_details}
                    onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
                    placeholder="Enter any additional details..."
                    rows={4}
                  />
                </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsuranceForm;
