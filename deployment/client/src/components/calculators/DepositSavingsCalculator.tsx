import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateDepositSavings, formatCurrency, parseCurrency, handleCurrencyInput, type CalculationResult } from "@/lib/calculators";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Form schema with validation
const formSchema = z.object({
  propertyPrice: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, "").replace(/R/g, ""))), {
    message: "Property price must be a number",
  }),
  depositPercentage: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 100, {
    message: "Deposit percentage must be between 0 and 100",
  }),
  initialAmount: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, "").replace(/R/g, ""))), {
    message: "Initial investment amount must be a number",
  }),
  monthlySaving: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, "").replace(/R/g, ""))), {
    message: "Monthly saving amount must be a number",
  }),
  savingsInterest: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) < 100, {
    message: "Savings interest rate must be between 0 and 100",
  }),
});

type DepositSavingsFormValues = z.infer<typeof formSchema>;

interface DepositSavingsCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function DepositSavingsCalculator({ onCalculate }: DepositSavingsCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { user } = useAuth();

  // Default form values
  const defaultValues: DepositSavingsFormValues = {
    propertyPrice: "1,000,000",
    depositPercentage: "10",
    initialAmount: "0",
    monthlySaving: "5,000",
    savingsInterest: "4.5",
  };

  const form = useForm<DepositSavingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: DepositSavingsFormValues) => {
    setIsCalculating(true);
    try {
      // Parse input values
      const propertyPrice = Number(values.propertyPrice.replace(/,/g, "").replace(/R/g, ""));
      const depositPercentage = Number(values.depositPercentage);
      const initialAmount = Number(values.initialAmount.replace(/,/g, "").replace(/R/g, ""));
      const monthlySaving = Number(values.monthlySaving.replace(/,/g, "").replace(/R/g, ""));
      const savingsInterest = Number(values.savingsInterest);

      // Calculate results
      const results = calculateDepositSavings(
        propertyPrice, 
        depositPercentage, 
        monthlySaving, 
        savingsInterest,
        initialAmount
      );
      
      // Pass results back to parent component
      onCalculate(results);

      // Save calculation if user is logged in
      if (user) {
        await apiRequest("/api/calculations", {
          method: "POST",
          body: JSON.stringify({
            calculationType: "deposit",
            inputData: JSON.stringify(values),
            resultData: JSON.stringify(results),
          })
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Deposit Savings Calculator
        </h3>
      </div>
      <p className="text-base text-gray-600 mb-4">
        Calculate how long it will take to save for your home deposit.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="propertyPrice"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Property Price (R)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The total purchase price of the property you wish to buy.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R</span>
                    </div>
                    <Input
                      {...field}
                      className="pl-8"
                      onChange={(e) => {
                        // Remove any R from the input value first
                        const valueWithoutR = e.target.value.replace(/R/g, '');
                        const numericValue = handleCurrencyInput(valueWithoutR);
                        field.onChange(numericValue);
                      }}
                      onBlur={(e) => {
                        // Remove any R from the input value first
                        const valueWithoutR = e.target.value.replace(/R/g, '');
                        const value = parseCurrency(valueWithoutR);
                        if (value > 0) {
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
            name="depositPercentage"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Deposit Percentage (%)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The percentage of the property price you need to save for a deposit.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
            name="initialAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Initial Investment Amount (R)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The amount you've already saved towards your deposit.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R</span>
                    </div>
                    <Input
                      {...field}
                      className="pl-8"
                      onChange={(e) => {
                        // Remove any R from the input value first
                        const valueWithoutR = e.target.value.replace(/R/g, '');
                        const numericValue = handleCurrencyInput(valueWithoutR);
                        field.onChange(numericValue);
                      }}
                      onBlur={(e) => {
                        // Remove any R from the input value first
                        const valueWithoutR = e.target.value.replace(/R/g, '');
                        const value = parseCurrency(valueWithoutR);
                        if (value > 0) {
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
            name="monthlySaving"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Monthly Saving Amount (R)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The amount you can save each month towards your deposit.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R</span>
                    </div>
                    <Input
                      {...field}
                      className="pl-8"
                      onChange={(e) => {
                        // Remove any R from the input value first
                        const valueWithoutR = e.target.value.replace(/R/g, '');
                        const numericValue = handleCurrencyInput(valueWithoutR);
                        field.onChange(numericValue);
                      }}
                      onBlur={(e) => {
                        // Remove any R from the input value first
                        const valueWithoutR = e.target.value.replace(/R/g, '');
                        const value = parseCurrency(valueWithoutR);
                        if (value > 0) {
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
            name="savingsInterest"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Savings Interest Rate (%)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The annual interest rate you earn on your savings.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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

          <Button type="submit" className="w-full" disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate"}
          </Button>
        </form>
      </Form>
    </div>
  );
}