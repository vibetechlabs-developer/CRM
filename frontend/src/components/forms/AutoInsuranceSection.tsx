 
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AutoInsuranceSectionProps {
  control: Control<any>;
}

export function AutoInsuranceSection({ control }: AutoInsuranceSectionProps) {
  return (
    <div className="border-l-4 border-green-500 pl-4 space-y-8">
      {/* Drivers & Vehicles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Auto Insurance - Drivers & Vehicles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="number_of_drivers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number Of Drivers <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Driver" : "Drivers"}
                      </SelectItem>
                    ))}
                    <SelectItem value="10+">10 or more</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="number_of_vehicles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number Of Vehicles <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Vehicle" : "Vehicles"}
                      </SelectItem>
                    ))}
                    <SelectItem value="10+">10 or more</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="driving_license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driving License Number <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Driving License Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="g1_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>G1 Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="g2_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>G2 Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="g_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>G Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Auto Insurance - Vehicle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="car_vin_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Car VIN Number or Model, Make, Year <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="VIN Number or Model, Make, Year" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="one_way_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One way Km <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input type="number" placeholder="One way Km" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="annual_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual KM <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Annual KM" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Auto History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Auto Insurance - History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="conviction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Any Conviction in Last 3 Years? <span className="text-destructive">*</span></FormLabel>
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
