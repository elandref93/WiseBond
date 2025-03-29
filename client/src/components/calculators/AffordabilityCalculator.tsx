import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateAffordability, formatCurrency, parseCurrency, handleCurrencyInput, type CalculationResult } from "@/lib/calculators";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Slider } from "@/components/ui/slider";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Form schema with validation
const formSchema = z.object({
  grossIncome: z.string().refine((val) => !isNaN(Number(val.replace(/[^0-9]/g, ""))), {
    message: "Gross income must be a number",
  }),
  monthlyExpenses: z.string().refine((val) => !isNaN(Number(val.replace(/[^0-9]/g, ""))), {
    message: "Monthly expenses must be a number",
  }),
  existingDebt: z.string().refine((val) => !isNaN(Number(val.replace(/[^0-9]/g, ""))), {
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

  // Default values for the form
  const defaultValues: AffordabilityFormValues = {
    grossIncome: "30000",
    monthlyExpenses: "10000",
    existingDebt: "5000",
    interestRate: "11.25",
  };

  const form = useForm<AffordabilityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Handler for the gross income slider
  const handleGrossIncomeSliderChange = (value: number[]) => {
    form.setValue("grossIncome", value[0].toString());
  };

  // Handler for the monthly expenses slider
  const handleMonthlyExpensesSliderChange = (value: number[]) => {
    form.setValue("monthlyExpenses", value[0].toString());
  };

  // Handler for the existing debt slider
  const handleExistingDebtSliderChange = (value: number[]) => {
    form.setValue("existingDebt", value[0].toString());
  };

  // Handler for the interest rate slider
  const handleInterestRateSliderChange = (value: number[]) => {
    form.setValue("interestRate", value[0].toFixed(2));
  };

  const onSubmit = async (values: AffordabilityFormValues) => {
    setIsCalculating(true);
    try {
      // Parse the income and expenses using our utility function
      const grossIncome = parseCurrency(values.grossIncome);
      const monthlyExpenses = parseCurrency(values.monthlyExpenses);
      const existingDebt = parseCurrency(values.existingDebt);
      const interestRate = Number(values.interestRate);
      
      // Calculate affordability
      const results = calculateAffordability(grossIncome, monthlyExpenses, existingDebt, interestRate);
      
      // Pass the results back to the parent component
      onCalculate(results);
      
      // Save the calculation if the user is logged in
      if (user) {
        await apiRequest("/api/calculations", {
          method: "POST",
          body: JSON.stringify({
            calculationType: "affordability",
            inputData: JSON.stringify(values),
            resultData: JSON.stringify(results),
          })
        });
        
        // Invalidate the calculations query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/calculations'] });
      }
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Current values for sliders
  const currentGrossIncome = parseCurrency(form.watch("grossIncome")) || 30000;
  const currentMonthlyExpenses = parseCurrency(form.watch("monthlyExpenses")) || 10000;
  const currentExistingDebt = parseCurrency(form.watch("existingDebt")) || 5000;
  const currentInterestRate = Number(form.watch("interestRate")) || 11.25;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white mr-4">
          <InfoIcon className="h-5 w-5" />
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Affordability Calculator
        </h3>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            Calculate how much you can afford to borrow based on your income, expenses, and existing debt obligations.
            This helps you determine a realistic property price range for your home search.
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Gross Monthly Income Field */}
          <FormField
            control={form.control}
            name="grossIncome"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Gross Monthly Income</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Your total income before deductions like tax, UIF, and medical aid.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R</span>
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        onChange={(e) => {
                          const numericValue = handleCurrencyInput(e.target.value);
                          field.onChange(numericValue);
                        }}
                      />
                    </div>
                    <Slider
                      defaultValue={[currentGrossIncome]}
                      max={150000}
                      step={1000}
                      onValueChange={handleGrossIncomeSliderChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>R0</span>
                      <span>R150,000</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Monthly Expenses Field */}
          <FormField
            control={form.control}
            name="monthlyExpenses"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Monthly Expenses</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Your regular monthly expenses including groceries, utilities, insurance, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R</span>
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        onChange={(e) => {
                          const numericValue = handleCurrencyInput(e.target.value);
                          field.onChange(numericValue);
                        }}
                      />
                    </div>
                    <Slider
                      defaultValue={[currentMonthlyExpenses]}
                      max={100000}
                      step={1000}
                      onValueChange={handleMonthlyExpensesSliderChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>R0</span>
                      <span>R100,000</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Existing Debt Field */}
          <FormField
            control={form.control}
            name="existingDebt"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Existing Monthly Debt Payments</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Your monthly payments for car loans, credit cards, personal loans, and other debts.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R</span>
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        onChange={(e) => {
                          const numericValue = handleCurrencyInput(e.target.value);
                          field.onChange(numericValue);
                        }}
                      />
                    </div>
                    <Slider
                      defaultValue={[currentExistingDebt]}
                      max={50000}
                      step={1000}
                      onValueChange={handleExistingDebtSliderChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>R0</span>
                      <span>R50,000</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Interest Rate Field */}
          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Interest Rate (%)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">South Africa's prime rate is currently around 11.25%. Your actual rate may be prime plus a percentage based on your credit profile.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input {...field} className="pr-8" />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                    <Slider
                      defaultValue={[currentInterestRate]}
                      min={5}
                      max={20}
                      step={0.25}
                      onValueChange={handleInterestRateSliderChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>5%</span>
                      <span>20%</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate Affordability"}
          </Button>
        </form>
      </Form>
    </div>
  );
}