import { z } from "zod";

export const customerIssueSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  occupation: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  policy_number: z.string().min(1, "Policy number is required"),
  issue_description: z.string().min(1, "Issue description is required"),
  additional_details: z.string().optional(),
});

export type CustomerIssueFormValues = z.infer<typeof customerIssueSchema>;
