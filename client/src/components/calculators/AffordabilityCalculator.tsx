import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateAffordability, formatCurrency, type CalculationResult } from "@/lib/calculators";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Slider } from "@/components/ui/slider"; // Added import for Slider component

// Form schema with validation
const formSchema = z.object({
  grossIncome: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Gross income must be a number",
  }),
  monthlyExpenses: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Monthly expenses must be a number",
  }),
  existingDebt: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Existing debt must be a number",
  }),
  interestRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 100, {
    message: "Interest rate must be between 0 and 100",
  }),
});

type AffordabilityFormValues = z.infer<typeof formSchema>;

interface AffordabilityCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function AffordabilityCalculator({ onCalculate }: AffordabilityCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { user } = useAuth();

  // Default form values
  const defaultValues: AffordabilityFormValues = {
    grossIncome: "30,000",
    monthlyExpenses: "10,000",
    existingDebt: "5,000",
    interestRate: "11.25",
  };

  const form = useForm<AffordabilityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: AffordabilityFormValues) => {
    setIsCalculating(true);
    try {
      // Parse input values
      const grossIncome = Number(values.grossIncome.replace(/,/g, ""));
      const monthlyExpenses = Number(values.monthlyExpenses.replace(/,/g, ""));
      const existingDebt = Number(values.existingDebt.replace(/,/g, ""));
      const interestRate = Number(values.interestRate);

      // Calculate results
      const results = calculateAffordability(grossIncome, monthlyExpenses, existingDebt, interestRate);

      // Pass results back to parent component
      onCalculate(results);

      // Save calculation if user is logged in
      if (user) {
        await apiRequest("POST", "/api/calculations", {
          calculationType: "affordability",
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Affordability Calculator
        </h3>
      </div>
      <p className="text-base text-gray-600 mb-4">
        Find out how much you can afford to borrow based on your monthly income and expenses.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="grossIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gross Monthly Income (R)</FormLabel>
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
            name="monthlyExpenses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Expenses (R)</FormLabel>
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
            name="existingDebt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Existing Monthly Debt Repayments (R)</FormLabel>
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
                  <div className="space-y-3">
                    <div className="relative">
                      <Input {...field} className="pr-8" />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                    <Slider
                      defaultValue={[Number(field.value) || 11.25]}
                      min={11}
                      max={20}
                      step={0.25}
                      onValueChange={(value) => field.onChange(value[0].toString())}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>11%</span>
                      <span>20%</span>
                    </div>
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