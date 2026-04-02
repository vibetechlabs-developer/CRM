/* eslint-disable @typescript-eslint/no-explicit-any */
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ContactSectionProps {
  control: Control<any>;
  occupationFieldName?: string;
  occupationLabel?: string;
  occupationPlaceholder?: string;
}

export function ContactSection({
  control,
  occupationFieldName = "occupation",
  occupationLabel = "Occupation",
  occupationPlaceholder = "Client occupation",
}: ContactSectionProps) {
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Name</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={occupationFieldName}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{occupationLabel}</FormLabel>
                <FormControl>
                  <Input placeholder={occupationPlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(000) 000-0000" 
                    {...field} 
                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );
}
