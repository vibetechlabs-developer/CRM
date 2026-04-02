import { z } from "zod";

export const policyChangeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  policy_number: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  
  what_changes: z.array(z.string()).min(1, "Please select at least one change option"),
  
  effective_date_of_change: z.string().optional(),
  driving_license_number: z.string().optional(),
  g1_date: z.string().optional(),
  g2_date: z.string().optional(),
  g_date: z.string().optional(),
  
  new_street_address: z.string().optional(),
  new_street_address_line_2: z.string().optional(),
  new_city: z.string().optional(),
  new_state: z.string().optional(),
  new_postal_code: z.string().optional(),
  one_way_km: z.union([z.string(), z.number()]).optional(),
  annual_km: z.union([z.string(), z.number()]).optional(),
  any_other_license: z.string().optional(),
  
  please_inform_us: z.array(z.string()).optional(),
  
  new_car_vin_number: z.string().optional(),
  
  car_is: z.array(z.string()).optional(),
  bank_or_lease_details: z.string().optional(),
  
  cancealtion_date: z.string().optional(),
  
  billing_details_comments: z.string().optional(),
  
  requesting_information_or_instruction: z.string().optional(),
}).superRefine((data, ctx) => {
  const addressChangeSelected = data.what_changes.includes("Address change, mention in comments");

  if (!addressChangeSelected) {
    return;
  }

  if (!data.new_street_address?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Street address is required",
      path: ["new_street_address"],
    });
  }

  if (!data.new_city?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "City is required",
      path: ["new_city"],
    });
  }

  if (!data.new_state?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "State is required",
      path: ["new_state"],
    });
  }
});

export type PolicyChangeFormValues = z.infer<typeof policyChangeSchema>;
