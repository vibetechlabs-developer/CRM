import { z } from "zod";

export const cancellationSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  occupation: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  insurance_type: z.string().min(1, "Please select an insurance type"),
  cancellation_date: z.string().min(1, "Cancellation date is required"),
  cancellation_reason: z.string().min(1, "Reason for cancellation is required"),
  policy_numbers_and_emails: z.string().min(1, "Policy numbers and emails are required"),
  additional_details: z.string().optional(),
});

export type CancellationFormValues = z.infer<typeof cancellationSchema>;
