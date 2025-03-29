import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { HomeIcon, InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  calculateBondRepayment, 
  formatCurrency, 
  parseCurrency, 
  handleCurrencyInput,
  displayCurrencyValue,
  type CalculationResult 
} from "@/lib/calculators";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import AmortizationChart from "./charts/AmortizationChart";

// Form schema with validation
const formSchema = z.object({
  propertyValue: z.string().refine((val) => !isNaN(Number(val.replace(/[^0-9]/g, ""))), {
    message: "Property value must be a number",
  }),
  interestRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 100, {
    message: "Interest rate must be between 0 and 100",
  }),
  loanTerm: z.string(),
  deposit: z.string().refine((val) => !isNaN(Number(val.replace(/[^0-9]/g, ""))), {
    message: "Deposit must be a number",
  }),
});

type BondRepaymentFormValues = z.infer<typeof formSchema>;

interface BondRepaymentCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function BondRepaymentCalculator({ onCalculate }: BondRepaymentCalculatorProps) {
  const [showChart, setShowChart] = useState(false);
  const [loanDetails, setLoanDetails] = useState<{
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
  } | null>(null);
  const { user } = useAuth();
  const [lastSavedValues, setLastSavedValues] = useState<Partial<BondRepaymentFormValues> | null>(null);

  // Default form values
  const defaultValues: BondRepaymentFormValues = {
    propertyValue: "1000000",
    interestRate: "11.25",
    loanTerm: "25",
    deposit: "100000",
  };

  const form = useForm<BondRepaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange", // Enable validation on change
  });
  
  // Watch all form values
  const formValues = useWatch({
    control: form.control,
  });

  // Calculate results whenever any form value changes
  useEffect(() => {
    const calculateResults = async () => {
      try {
        // Make sure all required values are present
        if (!formValues.propertyValue || !formValues.interestRate || 
            !formValues.loanTerm || !formValues.deposit) {
          return;
        }
        
        // Parse input values
        const propertyValue = parseCurrency(formValues.propertyValue);
        const interestRate = Number(formValues.interestRate);
        const loanTerm = Number(formValues.loanTerm);
        const deposit = parseCurrency(formValues.deposit);

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

        // Save calculation if user is logged in (but only every 5 seconds to avoid too many requests)
        if (user && 
            JSON.stringify(formValues) !== JSON.stringify(lastSavedValues)) {
          // Throttle saving to database
          const saveDebounceTimeout = setTimeout(async () => {
            try {
              await apiRequest("/api/calculations", {
                method: "POST",
                body: JSON.stringify({
                  calculationType: "bond",
                  inputData: JSON.stringify(formValues),
                  resultData: JSON.stringify(results),
                })
              });
              
              // Update last saved values
              const safeFormValues = {
                propertyValue: formValues.propertyValue || "",
                interestRate: formValues.interestRate || "",
                loanTerm: formValues.loanTerm || "",
                deposit: formValues.deposit || ""
              };
              setLastSavedValues(safeFormValues);
              
              // Invalidate the calculations query to refetch
              queryClient.invalidateQueries({ queryKey: ['/api/calculations'] });
            } catch (error) {
              console.error("Error saving calculation:", error);
            }
          }, 5000);  // Save at most every 5 seconds
          
          return () => clearTimeout(saveDebounceTimeout);
        }
      } catch (error) {
        console.error("Calculation error:", error);
      }
    };
    
    // Debounce calculation to prevent excessive calculations
    const debounceTimeout = setTimeout(() => {
      calculateResults();
    }, 300);
    
    return () => clearTimeout(debounceTimeout);
  }, [formValues, onCalculate, user, lastSavedValues]);

  // For property value slider
  const handlePropertyValueSliderChange = (value: number[]) => {
    form.setValue("propertyValue", value[0].toString(), { shouldValidate: true });
  };

  // For deposit slider
  const handleDepositSliderChange = (value: number[]) => {
    form.setValue("deposit", value[0].toString(), { shouldValidate: true });
  };

  // For interest rate slider
  const handleInterestRateSliderChange = (value: number[]) => {
    form.setValue("interestRate", value[0].toFixed(2), { shouldValidate: true });
  };

  // Get current property value and deposit for sliders
  const currentPropertyValue = parseCurrency(form.watch("propertyValue")) || 1000000;
  const currentDeposit = parseCurrency(form.watch("deposit")) || 100000;
  const currentInterestRate = Number(form.watch("interestRate")) || 11.25;

  // For rendering displayed values with currency formatting
  const displayPropertyValue = displayCurrencyValue(currentPropertyValue);
  const displayDeposit = displayCurrencyValue(currentDeposit);
  const displayMaxDeposit = displayCurrencyValue(Math.min(5000000, currentPropertyValue * 0.5));

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    if (!loanDetails) return "R0";
    
    const monthlyRate = loanDetails.interestRate / 100 / 12;
    const numberOfPayments = loanDetails.loanTerm * 12;
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthlyPayment = (loanDetails.loanAmount * x * monthlyRate) / (x - 1);
    
    return formatCurrency(monthlyPayment);
  };
  
  // Calculate total repayment
  const calculateTotalRepayment = () => {
    if (!loanDetails) return "R0";
    
    const monthlyRate = loanDetails.interestRate / 100 / 12;
    const numberOfPayments = loanDetails.loanTerm * 12;
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthlyPayment = (loanDetails.loanAmount * x * monthlyRate) / (x - 1);
    
    return formatCurrency(monthlyPayment * numberOfPayments);
  };
  
  // Calculate total interest
  const calculateTotalInterest = () => {
    if (!loanDetails) return "R0";
    
    const monthlyRate = loanDetails.interestRate / 100 / 12;
    const numberOfPayments = loanDetails.loanTerm * 12;
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthlyPayment = (loanDetails.loanAmount * x * monthlyRate) / (x - 1);
    
    return formatCurrency(monthlyPayment * numberOfPayments - loanDetails.loanAmount);
  };

  // Generate yearly amortization data for table
  const generateYearlyData = () => {
    if (!loanDetails) return [];
    
    const yearlyData = [];
    let balance = loanDetails.loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    const monthlyRate = loanDetails.interestRate / 100 / 12;
    const monthlyPayment = (loanDetails.loanAmount * Math.pow(1 + monthlyRate, loanDetails.loanTerm * 12) * 
      monthlyRate) / (Math.pow(1 + monthlyRate, loanDetails.loanTerm * 12) - 1);
    
    for (let year = 1; year <= Math.min(7, loanDetails.loanTerm); year++) {
      let yearInterest = 0;
      let yearPrincipal = 0;
      
      for (let month = 1; month <= 12; month++) {
        if ((year - 1) * 12 + month <= loanDetails.loanTerm * 12) {
          const interestPayment = balance * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          
          yearInterest += interestPayment;
          yearPrincipal += principalPayment;
          balance -= principalPayment;
        }
      }
      
      totalInterestPaid += yearInterest;
      totalPrincipalPaid += yearPrincipal;
      
      yearlyData.push({
        year,
        yearlyInterest: yearInterest,
        yearlyPrincipal: yearPrincipal,
        balance: Math.max(0, balance),
        totalInterestPaid,
        totalPrincipalPaid,
      });
    }
    
    return yearlyData;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white mr-4">
          <HomeIcon className="h-5 w-5" />
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Bond Repayment Calculator
        </h3>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            Calculate your monthly bond repayments based on the property value, interest rate, loan term, and deposit amount. 
            This helps you understand the true cost of your home loan and plan your budget accordingly.
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        {/* Left column - Calculator inputs */}
        <div className="w-full md:w-1/3">
          <Form {...form}>
            <div className="space-y-4">
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
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            onChange={(e) => {
                              // Keep only digits by removing any non-numeric characters
                              const numericValue = handleCurrencyInput(e.target.value);
                              field.onChange(numericValue);
                            }}
                          />
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 w-16">R500,000</span>
                          <Slider
                            defaultValue={[currentPropertyValue]}
                            min={500000}
                            max={20000000}
                            step={100000}
                            onValueChange={handlePropertyValueSliderChange}
                            className="mx-2 flex-grow"
                          />
                          <span className="text-xs text-gray-500 w-20 text-right">R20,000,000</span>
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
                      <div className="space-y-2">
                        <div className="relative">
                          <Input {...field} className="pr-8" />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 w-6">5%</span>
                          <Slider
                            defaultValue={[currentInterestRate]}
                            min={5}
                            max={20}
                            step={0.25}
                            onValueChange={handleInterestRateSliderChange}
                            className="mx-2 flex-grow"
                          />
                          <span className="text-xs text-gray-500 w-8 text-right">20%</span>
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
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            onChange={(e) => {
                              // Keep only digits by removing any non-numeric characters
                              const numericValue = handleCurrencyInput(e.target.value);
                              field.onChange(numericValue);
                            }}
                          />
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 w-4">R0</span>
                          <Slider
                            defaultValue={[currentDeposit]}
                            max={Math.min(5000000, currentPropertyValue * 0.5)}
                            step={10000}
                            onValueChange={handleDepositSliderChange}
                            className="mx-2 flex-grow"
                          />
                          <span className="text-xs text-gray-500 w-16 text-right">{displayMaxDeposit}</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
          
          <div className="text-sm text-gray-500 mt-4">
            <p>
              Results update automatically as you adjust values
            </p>
          </div>
        </div>
        
        {/* Right column - Results and chart */}
        <div className="w-full md:w-2/3">
          {showChart && loanDetails ? (
            <div>
              {/* Key summary stats */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Calculation Results</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Monthly Repayment</div>
                    <div className="text-xl font-bold">{calculateMonthlyPayment()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Repayment Amount</div>
                    <div className="text-xl font-bold">{calculateTotalRepayment()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Interest Paid</div>
                    <div className="text-xl font-bold">{calculateTotalInterest()}</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 italic mt-2">
                  This is an estimate based on the information provided. Actual amounts may vary. <a href="#" className="text-blue-600 hover:underline">Learn more about how these calculations work</a>.
                </div>
              </div>
              
              {/* Loan Overview section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Loan Overview</h4>
                  <div className="text-xs text-gray-500">
                    <span className="mr-4">
                      <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                      Principal
                    </span>
                    <span className="mr-4">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                      Interest
                    </span>
                    <span>
                      <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-1"></span>
                      Balance
                    </span>
                  </div>
                </div>
                
                {/* Simple summary table */}
                <div className="grid grid-cols-3 text-sm mb-4">
                  <div>
                    <div className="text-gray-500">Monthly Payment</div>
                    <div className="font-medium">{calculateMonthlyPayment()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Interest</div>
                    <div className="font-medium">{calculateTotalInterest()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Cost</div>
                    <div className="font-medium">{calculateTotalRepayment()}</div>
                  </div>
                </div>
                
                {/* Chart */}
                <div className="border rounded-lg p-4 bg-white">
                  <AmortizationChart 
                    loanAmount={loanDetails.loanAmount} 
                    interestRate={loanDetails.interestRate} 
                    loanTerm={loanDetails.loanTerm} 
                  />
                </div>
                
                {/* Yearly data table */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Yearly Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Principal Paid</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interest Paid</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {generateYearlyData().map((data) => (
                          <tr key={data.year}>
                            <td className="px-3 py-2 whitespace-nowrap">{data.year}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(data.totalPrincipalPaid)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(data.totalInterestPaid)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(data.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-gray-50 h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-4">
                <HomeIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No calculation results yet</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Adjust the property value, interest rate, loan term, and deposit amount to see your monthly bond repayments and amortization schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}