/* eslint-disable @typescript-eslint/no-explicit-any */
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InsuranceDetailsSectionProps {
  control: Control<any>;
}

export function InsuranceDetailsSection({ control }: InsuranceDetailsSectionProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Insurance Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="insurance_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Type Of Insurance <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  className="space-y-2"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Only Auto Insurance" />
                    </FormControl>
                    <FormLabel className="font-normal">Only Auto Insurance</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Only Home/Tenant Insurance" />
                    </FormControl>
                    <FormLabel className="font-normal">Only Home/Tenant Insurance</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Auto plus Tenant Insurance" />
                    </FormControl>
                    <FormLabel className="font-normal">Auto plus Tenant Insurance (Save upto 20% Extra)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Auto plus Home Insurance" />
                    </FormControl>
                    <FormLabel className="font-normal">Auto plus Home Insurance (Save upto 20% Extra)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Auto Plus Home Plus Rental Insurance" />
                    </FormControl>
                    <FormLabel className="font-normal">Auto Plus Home Plus Rental Insurance (Save 20% Extra)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Only Rental property Insurance" />
                    </FormControl>
                    <FormLabel className="font-normal">Only Rental property Insurance</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          <FormField
            control={control}
            name="insurance_effective_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Effective Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Of Birth</FormLabel>
                <FormControl>
                  <Input type="date" max={today} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="currently_insured"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Are You Currently Insured? <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
