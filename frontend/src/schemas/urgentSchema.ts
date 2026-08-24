import { z } from "zod";

export const urgentSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  occupation: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  street_address: z.string().min(1, "Street address is required"),
  street_address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State / Province is required"),
  postal_code: z.string().optional(),
  license_number: z.string().min(1, "Driver's license number is required"),
  vin_number: z.string().min(1, "VIN / Vehicle number is required"),
  notes: z.string().min(1, "Urgent notes or request reason is required"),
  additional_details: z.string().optional(),
});

export type UrgentFormValues = z.infer<typeof urgentSchema>;
