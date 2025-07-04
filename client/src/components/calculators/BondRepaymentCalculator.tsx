import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { HomeIcon, InfoIcon, CalendarIcon, BanknoteIcon, PercentIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  calculateBondRepayment, 
  formatCurrency, 
  parseCurrency, 
  handleCurrencyInput,
  displayCurrencyValue,
  type CalculationResult 
} from "@/lib/calculators";
import { generateAmortizationData } from "@/lib/amortizationUtils";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import AmortizationChart from "./charts/AmortizationChart";
import { FinancialTermTooltip } from "@/components/ui/financial-term-tooltip";
import { FinancialTermsHighlighter } from "@/components/ui/financial-terms-highlighter";
import { financialTerms } from "@/lib/financialTerms";
import EmailCalculationButton from "./EmailCalculationButton";

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
  includeBondFees: z.boolean().default(false),
});

type BondRepaymentFormValues = z.infer<typeof formSchema>;

interface BondRepaymentCalculatorProps {
  onCalculate: (results: CalculationResult, formValues?: any) => void;
}

export default function BondRepaymentCalculator({ onCalculate }: BondRepaymentCalculatorProps) {
  const [loanDetails, setLoanDetails] = useState<{
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    propertyValue: number;
    deposit: number;
    depositPercentage: number;
  } | null>(null);
  const { user } = useAuth();
  const [lastSavedValues, setLastSavedValues] = useState<Partial<BondRepaymentFormValues> | null>(null);
  const lastSavedValuesRef = useRef<Partial<BondRepaymentFormValues> | null>(null);

  // Default form values
  const defaultValues: BondRepaymentFormValues = {
    propertyValue: "1000000",
    interestRate: "11.25",
    loanTerm: "25",
    deposit: "100000",
    includeBondFees: false,
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
  const calculateAndSave = async (formValues: BondRepaymentFormValues) => {
    try {
      if (!formValues.propertyValue || !formValues.interestRate || !formValues.loanTerm || !formValues.deposit) {
        return;
      }
  
      const propertyValue = parseCurrency(formValues.propertyValue);
      const interestRate = Number(formValues.interestRate);
      const loanTerm = Number(formValues.loanTerm);
      const deposit = parseCurrency(formValues.deposit);
  
      const results = calculateBondRepayment(propertyValue, interestRate, loanTerm, deposit, formValues.includeBondFees);
  
      let loanAmount = propertyValue - deposit;
  
      if (formValues.includeBondFees) {
        const baseLoanAmount = propertyValue - deposit;
        const transferDuty = Math.round(baseLoanAmount * 0.08);
        const transferAttorneyFees = Math.round(baseLoanAmount * 0.015);
        const bondRegistrationFee = Math.round(baseLoanAmount * 0.012);
        const deedsOfficeFee = 1500;
  
        loanAmount += transferDuty + transferAttorneyFees + bondRegistrationFee + deedsOfficeFee;
      }
  
      setLoanDetails({
        loanAmount: loanAmount,
        interestRate,
        loanTerm,
        propertyValue,
        deposit,
        depositPercentage: (deposit / propertyValue) * 100,
      });
  
      onCalculate(results, formValues);
  
      // Optional: Save to backend but throttle
      if (user) {
        const isNewData = JSON.stringify(formValues) !== JSON.stringify(lastSavedValuesRef.current);
        if (isNewData) {
          await apiRequest("/api/calculations", {
            method: "POST",
            body: JSON.stringify({
              calculationType: "bond",
              inputData:formValues,
              resultData: results,
            }),
          });
          lastSavedValuesRef.current = formValues;
          queryClient.invalidateQueries({ queryKey: ['/api/calculations'] });
        }
      }
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };
  useEffect(() => {
    const subscription = form.watch((values) => {
      // Debounce calculation
      const timeout = setTimeout(() => {
        const currentValues: BondRepaymentFormValues = {
          propertyValue: values.propertyValue || "",
          interestRate: values.interestRate || "",
          loanTerm: values.loanTerm || "",
          deposit: values.deposit || "",
          includeBondFees: values.includeBondFees ?? false,
        };
  
        calculateAndSave(currentValues);
      }, 300);
  
      return () => clearTimeout(timeout);  // Cleanup for each watch event
    });
  
    return () => subscription.unsubscribe();
  }, [user, onCalculate]); 
  
  useEffect(() => {
    calculateAndSave(form.getValues());
  }, []);

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

  // Calculate monthly payment - no monthly admin fee
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
    
    // The transfer and registration costs are already included in the loan amount
    // when the checkbox is checked, so no need to add them again
    const totalRepayment = monthlyPayment * numberOfPayments;
    
    return formatCurrency(totalRepayment);
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
  
  // Calculate total transfer and bond registration costs - to be included in financing
  const calculateTotalTransferCosts = () => {
    const includeBondFees = form.watch("includeBondFees");
    if (!loanDetails || !includeBondFees) return null;
    
    // For Bond Repayment Calculator, use full property value as base loan amount
    const baseLoanAmount = loanDetails.propertyValue;
    
    // Approximate values based on the property example
    const transferDuty = Math.round(baseLoanAmount * 0.08); // Approximate transfer duty percentage
    const transferAttorneyFees = Math.round(baseLoanAmount * 0.015); // Approximate attorney fees
    const bondRegistrationFee = Math.round(baseLoanAmount * 0.012); // Approximate bond registration
    const deedsOfficeFee = 1500; // Fixed fee
    
    const totalCosts = transferDuty + transferAttorneyFees + bondRegistrationFee + deedsOfficeFee;
    return formatCurrency(totalCosts);
  };
  
  // Return the actual additional amount for calculations
  const getAdditionalFinancingAmount = () => {
    const includeBondFees = form.watch("includeBondFees");
    if (!loanDetails || !includeBondFees) return 0;
    
    // For Bond Repayment Calculator, use full property value as base loan amount
    const baseLoanAmount = loanDetails.propertyValue;
    
    const transferDuty = Math.round(baseLoanAmount * 0.08);
    const transferAttorneyFees = Math.round(baseLoanAmount * 0.015);
    const bondRegistrationFee = Math.round(baseLoanAmount * 0.012);
    const deedsOfficeFee = 1500;
    
    return transferDuty + transferAttorneyFees + bondRegistrationFee + deedsOfficeFee;
  };

  // Generate yearly amortization data for table using shared utility
  const generateYearlyData = () => {
    if (!loanDetails) return [];
    
    // Use the shared amortization utility for consistency
    const amortizationData = generateAmortizationData(
      loanDetails.loanAmount,
      loanDetails.interestRate,
      loanDetails.loanTerm
    );
    
    // Convert to the format expected by the table (show all years for full term)
    const yearlyData = [];
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    for (let i = 1; i <= loanDetails.loanTerm; i++) {
      const yearData = amortizationData.find(data => data.year === i);
      if (yearData) {
        totalInterestPaid += yearData.interest;
        totalPrincipalPaid += yearData.principal;
        
        yearlyData.push({
          year: yearData.year,
          yearlyInterest: yearData.interest,
          yearlyPrincipal: yearData.principal,
          balance: yearData.balance,
          totalInterestPaid,
          totalPrincipalPaid,
        });
      }
    }
    
    return yearlyData;
  };

  return (
    <div className="max-w-full">
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/90 text-white">
          <HomeIcon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-medium">Bond Repayment Calculator</h3>
      </div>

      <div className="bg-blue-50 p-3 rounded my-4">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <FinancialTermsHighlighter 
              text="Calculate your monthly bond repayments based on the property value, interest rate, loan term, and deposit amount. This helps you understand the true cost of your home loan and plan your budget accordingly."
            />
          </p>
        </div>
      </div>

      {/* Two column layout for inputs and basic results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Left column - Form inputs */}
        <div>
          <Form {...form}>
            <div className="space-y-5">
              {/* Property Value Field with Slider */}
              <FormField
                control={form.control}
                name="propertyValue"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Property Value</FormLabel>
                      <FinancialTermTooltip
                        term="market value"
                        definition={financialTerms["market value"]}
                        showIcon={true}
                        iconClass="h-4 w-4 text-gray-400"
                      />
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
                          <span className="text-xs text-gray-500 mr-1">R500,000</span>
                          <Slider
                            defaultValue={[currentPropertyValue]}
                            min={500000}
                            max={20000000}
                            step={100000}
                            onValueChange={handlePropertyValueSliderChange}
                            className="flex-grow mx-2"
                          />
                          <span className="text-xs text-gray-500 ml-1">R20M</span>
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
                  <FormItem className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Interest Rate (%)</FormLabel>
                      <FinancialTermTooltip
                        term="interest rate"
                        definition={financialTerms["interest rate"]}
                        showIcon={true}
                        iconClass="h-4 w-4 text-gray-400"
                      />
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
                          <span className="text-xs text-gray-500 mr-1">5%</span>
                          <Slider
                            defaultValue={[currentInterestRate]}
                            min={5}
                            max={20}
                            step={0.25}
                            onValueChange={handleInterestRateSliderChange}
                            className="flex-grow mx-2"
                          />
                          <span className="text-xs text-gray-500 ml-1">20%</span>
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
                  <FormItem className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Loan Term</FormLabel>
                      <FinancialTermTooltip
                        term="amortization"
                        definition={financialTerms["amortization"]}
                        showIcon={true}
                        iconClass="h-4 w-4 text-gray-400"
                      />
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
                  <FormItem className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Deposit</FormLabel>
                      <FinancialTermTooltip
                        term="deposit"
                        definition={financialTerms["deposit"]}
                        showIcon={true}
                        iconClass="h-4 w-4 text-gray-400"
                      />
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
                          <span className="text-xs text-gray-500 mr-1">R0</span>
                          <Slider
                            defaultValue={[currentDeposit]}
                            max={Math.min(5000000, currentPropertyValue * 0.5)}
                            step={10000}
                            onValueChange={handleDepositSliderChange}
                            className="flex-grow mx-2"
                          />
                          <span className="text-xs text-gray-500 ml-1">{displayMaxDeposit}</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bond Fees Checkbox */}
              <FormField
                control={form.control}
                name="includeBondFees"
                render={({ field }) => (
                  <FormItem className="mt-4 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Include Bond Fees and Costs
                      </FormLabel>
                      <FormDescription className="text-xs text-gray-500">
                        Include transfer duty, attorney fees, bond registration fee, and deeds office fee in financing
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Form>
          
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-gray-500 mb-2">
              Results update automatically as you adjust values
            </p>
            
            {loanDetails && (
              <div className="text-sm">
                <p className="text-xs text-gray-600 font-medium">This is an estimate based on the information provided. Actual amounts may vary.</p>
                <a href="#" className="text-xs text-blue-600 hover:underline">Learn more about how these calculations work</a>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Basic Results section */}
        <div>
          {loanDetails ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Calculation Results</h4>
                
                <div className="flex space-x-2">
                  {loanDetails && (
                    <EmailCalculationButton
                      result={{
                        type: "bond",
                        displayResults: [
                          { label: "Monthly Repayment", value: calculateMonthlyPayment() },
                          { label: "Total Repayment", value: calculateTotalRepayment() },
                          { label: "Total Interest", value: calculateTotalInterest() },
                          { label: "Transfer & Registration Costs", value: calculateTotalTransferCosts() || "R0" },
                        ],
                        input: {
                          propertyValue: formatCurrency(loanDetails.propertyValue),
                          deposit: formatCurrency(loanDetails.deposit),
                          interestRate: `${loanDetails.interestRate}%`,
                          loanTerm: `${loanDetails.loanTerm} years`,
                          includeBondFees: form.watch("includeBondFees"),
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-sm"
                    />
                  )}
                  
                  <button 
                    onClick={() => {
                      // Handle share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: 'WiseBond Bond Repayment Calculation',
                          text: `Monthly Payment: ${calculateMonthlyPayment()}\nTotal Repayment: ${calculateTotalRepayment()}\nTotal Interest: ${calculateTotalInterest()}`,
                          url: window.location.href,
                        });
                      }
                    }}
                    className="flex items-center justify-center space-x-1 py-1 px-3 text-sm bg-white border rounded hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span>Share</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Generate and download PDF
                      if (user) {
                        fetch("/api/reports/bond-repayment", {
                          method: "POST",
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            propertyValue: loanDetails.propertyValue,
                            deposit: loanDetails.deposit,
                            interestRate: loanDetails.interestRate,
                            loanTerm: loanDetails.loanTerm,
                            includeBondFees: form.watch("includeBondFees"),
                            calculationResult: {
                              type: "bond",
                              monthlyPayment: calculateMonthlyPayment(),
                              totalRepayment: calculateTotalRepayment(),
                              totalInterest: calculateTotalInterest(),
                              transferCosts: calculateTotalTransferCosts() || "R0"
                            }
                          })
                        })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'bond-repayment-calculation.pdf';
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                      } else {
                        // Show sign-in prompt for non-logged-in users
                        window.location.href = "/login?redirect=calculators";
                      }
                    }}
                    className="flex items-center justify-center space-x-1 py-1 px-3 text-sm bg-white border rounded hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M12 18v-6" />
                      <path d="M8 15l4 4 4-4" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Monthly Repayment</div>
                      <div className="text-2xl font-bold">{calculateMonthlyPayment()}</div>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">
                      <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Repayment Amount</div>
                      <div className="text-2xl font-bold">{calculateTotalRepayment()}</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <BanknoteIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Interest Paid</div>
                      <div className="text-2xl font-bold">{calculateTotalInterest()}</div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <PercentIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                {/* Transfer and Registration Costs Tile - Only show when includeBondFees is checked */}
                {form.watch("includeBondFees") && calculateTotalTransferCosts() && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Transfer & Registration Costs</div>
                        <div className="text-2xl font-bold">{calculateTotalTransferCosts()}</div>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <BanknoteIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-gray-50 flex flex-col items-center justify-center h-full">
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

      {/* Chart and Table sections in full width below */}
      {loanDetails && (
        <div className="mt-8 space-y-8">
          {/* Chart Section */}
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-4 w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Loan Overview</h3>
              <div className="flex items-center text-xs text-gray-500 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1.5"></div>
                  <span>Principal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1.5"></div>
                  <span>Interest</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1.5"></div>
                  <span>Balance</span>
                </div>
              </div>
            </div>
            
            {/* Full-width chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm w-full max-w-7xl mx-auto">
              <div className="h-[450px] w-full">
                <AmortizationChart 
                  loanAmount={loanDetails.loanAmount} 
                  interestRate={loanDetails.interestRate} 
                  loanTerm={loanDetails.loanTerm} 
                />
              </div>
            </div>
          </div>
          
          {/* Yearly Breakdown Table */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium text-gray-800 mb-3 text-center w-full">Yearly Breakdown</h3>
            <div className="overflow-x-auto w-full max-w-7xl mx-auto shadow-sm rounded-lg">
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">
                        Principal Paid
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">
                        Interest Paid
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">
                        Remaining Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generateYearlyData().map((data) => (
                      <tr key={data.year} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{data.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{formatCurrency(data.totalPrincipalPaid)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{formatCurrency(data.totalInterestPaid)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{formatCurrency(data.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Scroll to view all {generateYearlyData().length} years</p>
          </div>
        </div>
      )}
    </div>
  );
}