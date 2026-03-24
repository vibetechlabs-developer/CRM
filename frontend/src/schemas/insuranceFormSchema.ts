import { z } from "zod";

export const insuranceFormSchema = z.object({
  // Name
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  occupation: z.string().optional(),

  // Contact
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address"),

  // Address
  street_address: z.string().min(1, "Street Address is required"),
  street_address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().optional(),
  address: z.string().optional(),

  // Insurance
  insurance_type: z.string().min(1, "Please select an insurance type"),
  insurance_effective_date: z.string().optional(),
  date_of_birth: z.string().optional(),
  currently_insured: z.enum(["Yes", "No"], {
    errorMap: () => ({ message: "Please select if you are currently insured" }),
  }),

  // Fields that depend on Auto
  number_of_drivers: z.string().optional(),
  number_of_vehicles: z.string().optional(),
  driving_license_number: z.string().optional(),
  g1_date: z.string().optional(),
  g2_date: z.string().optional(),
  g_date: z.string().optional(),

  // Vehicle
  car_vin_number: z.string().optional(),
  one_way_km: z.union([z.string(), z.number()]).optional(),
  annual_km: z.union([z.string(), z.number()]).optional(),

  // History
  at_fault_claim: z.enum(["Yes", "No"], {
    errorMap: () => ({ message: "Please answer the at fault claim question" }),
  }),
  conviction: z.enum(["Yes", "No"]).optional(),

  // Home/Tenant Insurance Fields
  property_address: z.string().optional(),
  property_address_line_2: z.string().optional(),
  property_city: z.string().optional(),
  property_state: z.string().optional(),
  property_postal_code: z.string().optional(),
  property_type: z.string().optional(),
  property_value: z.string().optional(),
  year_built: z.string().optional(),
  square_footage: z.string().optional(),
  home_claims_history: z.string().optional(),

  // Rental Property Insurance Fields
  rental_property_address: z.string().optional(),
  rental_property_address_line_2: z.string().optional(),
  rental_property_city: z.string().optional(),
  rental_property_state: z.string().optional(),
  rental_property_postal_code: z.string().optional(),
  rental_property_type: z.string().optional(),
  number_of_units: z.string().optional(),
  rental_property_value: z.string().optional(),
  rental_year_built: z.string().optional(),
  rental_income: z.string().optional(),

  // Additional
  additional_details: z.string().optional(),
})
// Implement conditional validation for auto fields
.superRefine((data, ctx) => {
  const isAuto = 
    data.insurance_type === "Only Auto Insurance" ||
    data.insurance_type === "Auto plus Tenant Insurance" ||
    data.insurance_type === "Auto plus Home Insurance" ||
    data.insurance_type === "Auto Plus Home Plus Rental Insurance";

  if (isAuto) {
    if (!data.driving_license_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Driving license number is required",
        path: ["driving_license_number"],
      });
    }
    if (!data.car_vin_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "VIN or Model/Make/Year is required",
        path: ["car_vin_number"],
      });
    }
    if (!data.one_way_km) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "One way KM is required",
        path: ["one_way_km"],
      });
    }
    if (!data.annual_km) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Annual KM is required",
        path: ["annual_km"],
      });
    }
    if (!data.conviction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please answer the conviction question",
        path: ["conviction"],
      });
    }
  }
});

export type InsuranceFormValues = z.infer<typeof insuranceFormSchema>;
