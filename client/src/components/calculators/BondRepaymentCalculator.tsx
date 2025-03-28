import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { HomeIcon, InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateBondRepayment, formatCurrency, type CalculationResult } from "@/lib/calculators";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import AmortizationChart from "./charts/AmortizationChart";

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
  const [showChart, setShowChart] = useState(false);
  const [loanDetails, setLoanDetails] = useState<{
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
  } | null>(null);
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

  // For property value slider
  const handlePropertyValueSliderChange = (value: number[]) => {
    form.setValue("propertyValue", formatCurrency(value[0].toString()));
  };

  // For deposit slider
  const handleDepositSliderChange = (value: number[]) => {
    form.setValue("deposit", formatCurrency(value[0].toString()));
  };

  // For interest rate slider
  const handleInterestRateSliderChange = (value: number[]) => {
    form.setValue("interestRate", value[0].toFixed(2));
  };

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
      
      // Store loan details for chart
      setLoanDetails({
        loanAmount: propertyValue - deposit,
        interestRate,
        loanTerm
      });
      
      // Show chart after calculation
      setShowChart(true);
      
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

  // Get current property value and deposit for sliders
  const currentPropertyValue = Number(form.watch("propertyValue").replace(/,/g, "")) || 1000000;
  const currentDeposit = Number(form.watch("deposit").replace(/,/g, "")) || 100000;
  const currentInterestRate = Number(form.watch("interestRate")) || 11.25;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white mr-4">
          <HomeIcon className="h-5 w-5" />
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Bond Repayment Calculator
        </h3>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            Calculate your monthly bond repayments based on the property value, interest rate, loan term, and deposit amount. 
            This helps you understand the true cost of your home loan and plan your budget accordingly.
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Property Value Field with Slider */}
          <FormField
            control={form.control}
            name="propertyValue"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Property Value</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">This is the full purchase price of the property.</p>
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
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (!isNaN(Number(value))) {
                            field.onChange(formatCurrency(value));
                          }
                        }}
                      />
                    </div>
                    <Slider
                      defaultValue={[currentPropertyValue]}
                      max={5000000}
                      step={50000}
                      onValueChange={handlePropertyValueSliderChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>R500,000</span>
                      <span>R5,000,000</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Interest Rate Field with Slider */}
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

          {/* Loan Term Field */}
          <FormField
            control={form.control}
            name="loanTerm"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Loan Term</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Standard home loan terms in South Africa range from 20 to 30 years. A longer term means lower monthly payments but more interest paid overall.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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

          {/* Deposit Field with Slider */}
          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Deposit</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">A higher deposit means a better interest rate and lower monthly payments. Banks typically require at least a 10% deposit.</p>
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
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (!isNaN(Number(value))) {
                            field.onChange(formatCurrency(value));
                          }
                        }}
                      />
                    </div>
                    <Slider
                      defaultValue={[currentDeposit]}
                      max={Math.min(1000000, currentPropertyValue * 0.5)}
                      step={10000}
                      onValueChange={handleDepositSliderChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>R0</span>
                      <span>R{formatCurrency(Math.min(1000000, currentPropertyValue * 0.5))}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {currentPropertyValue > 0 ? 
                        `${((currentDeposit / currentPropertyValue) * 100).toFixed(1)}% of property value` : ''}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate Repayments"}
          </Button>
        </form>
      </Form>

      {/* Amortization Chart */}
      {showChart && loanDetails && (
        <div className="mt-8">
          <AmortizationChart 
            loanAmount={loanDetails.loanAmount}
            interestRate={loanDetails.interestRate}
            loanTerm={loanDetails.loanTerm}
          />
        </div>
      )}
    </div>
  );
}
