import { z } from "zod";

export const renewalSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  occupation: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  company_name: z.string().min(1, "Company name is required"),
  street_address: z.string().min(1, "Street address is required"),
  street_address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  services_you_are_interested_in: z.array(z.string()).min(1, "Please select at least one service"),
  last_year_price: z.string().optional(),
  renewal_price: z.string().optional(),
  premium_looking_current_year: z.string().optional(),
  additional_details: z.string().optional(),
});

export type RenewalFormValues = z.infer<typeof renewalSchema>;
