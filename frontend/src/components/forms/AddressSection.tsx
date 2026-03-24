/* eslint-disable @typescript-eslint/no-explicit-any */
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AddressSectionProps {
  control: Control<any>;
}

export function AddressSection({ control }: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
      <div className="space-y-4">
        <FormField
          control={control}
          name="street_address"
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
          control={control}
          name="street_address_line_2"
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
            control={control}
            name="city"
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
            control={control}
            name="state"
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
            control={control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal / Zip Code</FormLabel>
                <FormControl>
                  <Input placeholder="Postal / Zip Code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
