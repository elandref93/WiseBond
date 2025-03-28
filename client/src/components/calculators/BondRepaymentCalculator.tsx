import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateBondRepayment, formatCurrency, type CalculationResult } from "@/lib/calculators";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Form schema with validation
const formSchema = z.object({
  propertyValue: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Property value must be a number",
  }),
  interestRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 100, {
    message: "Interest rate must be between 0 and 100",
  }),
  loanTerm: z.string(),
  deposit: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Deposit must be a number",
  }),
});

type BondRepaymentFormValues = z.infer<typeof formSchema>;

interface BondRepaymentCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function BondRepaymentCalculator({ onCalculate }: BondRepaymentCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { user } = useAuth();

  // Default form values
  const defaultValues: BondRepaymentFormValues = {
    propertyValue: "1,000,000",
    interestRate: "11.25",
    loanTerm: "25",
    deposit: "100,000",
  };

  const form = useForm<BondRepaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: BondRepaymentFormValues) => {
    setIsCalculating(true);
    try {
      // Parse input values
      const propertyValue = Number(values.propertyValue.replace(/,/g, ""));
      const interestRate = Number(values.interestRate);
      const loanTerm = Number(values.loanTerm);
      const deposit = Number(values.deposit.replace(/,/g, ""));

      // Calculate results
      const results = calculateBondRepayment(propertyValue, interestRate, loanTerm, deposit);
      
      // Pass results back to parent component
      onCalculate(results);

      // Save calculation if user is logged in
      if (user) {
        await apiRequest("POST", "/api/calculations", {
          calculationType: "bond",
          inputData: JSON.stringify(values),
          resultData: JSON.stringify(results),
        });
        
        // Invalidate the calculations query to refetch
        queryClient.invalidateQueries({ queryKey: ['/api/calculations'] });
      }
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-secondary-500 text-white mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Bond Repayment Calculator
        </h3>
      </div>
      <p className="text-base text-gray-600 mb-4">
        Calculate your monthly bond repayments based on the loan amount, interest rate, and term.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="propertyValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Value (R)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R</span>
                    </div>
                    <Input
                      {...field}
                      className="pl-8"
                      onBlur={(e) => {
                        const value = e.target.value.replace(/,/g, "");
                        if (!isNaN(Number(value))) {
                          field.onChange(formatCurrency(value));
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Rate (%)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} className="pr-8" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loanTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Term</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="20">20 years</SelectItem>
                    <SelectItem value="25">25 years</SelectItem>
                    <SelectItem value="30">30 years</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit (R)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R</span>
                    </div>
                    <Input
                      {...field}
                      className="pl-8"
                      onBlur={(e) => {
                        const value = e.target.value.replace(/,/g, "");
                        if (!isNaN(Number(value))) {
                          field.onChange(formatCurrency(value));
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
