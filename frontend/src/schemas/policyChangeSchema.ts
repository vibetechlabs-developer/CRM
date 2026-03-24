import { z } from "zod";

export const policyChangeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  occupation: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  
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
});

export type PolicyChangeFormValues = z.infer<typeof policyChangeSchema>;
