import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon, PlusCircleIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/calculators";
import { CalculationResult } from "@/lib/calculators";
import AdditionalPaymentChart from "./charts/AdditionalPaymentChart";

const formSchema = z.object({
  loanAmount: z.string().min(1, { message: "Loan amount is required" }),
  interestRate: z.string().min(1, { message: "Interest rate is required" }),
  loanTerm: z.string().min(1, { message: "Loan term is required" }),
  additionalPayment: z.string().min(1, { message: "Additional payment is required" }),
});

type AdditionalPaymentFormValues = z.infer<typeof formSchema>;

interface AdditionalPaymentCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function AdditionalPaymentCalculator({ onCalculate }: AdditionalPaymentCalculatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    additionalPayment: number;
  } | null>(null);

  const defaultValues: AdditionalPaymentFormValues = {
    loanAmount: "900,000",
    interestRate: "11.25",
    loanTerm: "20",
    additionalPayment: "1,000",
  };

  const form = useForm<AdditionalPaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // For additional payment slider
  const handleAdditionalPaymentSliderChange = (value: number[]) => {
    form.setValue("additionalPayment", formatCurrency(value[0].toString()));
  };

  // For interest rate slider
  const handleInterestRateSliderChange = (value: number[]) => {
    form.setValue("interestRate", value[0].toFixed(2));
  };

  const onSubmit = async (values: AdditionalPaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const loanAmount = parseFloat(values.loanAmount.replace(/[^0-9.]/g, ""));
      const interestRate = parseFloat(values.interestRate);
      const loanTermYears = parseFloat(values.loanTerm);
      const loanTermMonths = loanTermYears * 12;
      const additionalPayment = parseFloat(values.additionalPayment.replace(/[^0-9.]/g, ""));
      
      // Calculate standard monthly payment
      const monthlyRate = interestRate / 100 / 12;
      const standardMonthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loanTermMonths));
      
      // Calculate new payment with additional amount
      const newMonthlyPayment = standardMonthlyPayment + additionalPayment;
      
      // Calculate new loan term
      let remainingPrincipal = loanAmount;
      let newTermMonths = 0;
      
      while (remainingPrincipal > 0) {
        // Interest for this month
        const interestThisMonth = remainingPrincipal * monthlyRate;
        
        // Principal payment this month
        const principalThisMonth = newMonthlyPayment - interestThisMonth;
        
        // Check if this payment would pay off the loan
        if (principalThisMonth >= remainingPrincipal) {
          newTermMonths++;
          break;
        }
        
        // Update remaining principal
        remainingPrincipal -= principalThisMonth;
        newTermMonths++;
        
        // Safety check to prevent infinite loops
        if (newTermMonths > 1000) break;
      }
      
      // Calculate total interest (standard vs with additional payment)
      const totalStandardInterest = (standardMonthlyPayment * loanTermMonths) - loanAmount;
      const totalNewInterest = (newMonthlyPayment * newTermMonths) - loanAmount;
      
      // Calculate savings
      const timeSavedMonths = loanTermMonths - newTermMonths;
      const interestSaved = totalStandardInterest - totalNewInterest;
      
      // Store payment details for chart
      setPaymentDetails({
        loanAmount,
        interestRate,
        loanTerm: loanTermYears,
        additionalPayment
      });
      
      // Show chart after calculation
      setShowChart(true);
      
      const result: CalculationResult = {
        type: 'additional',
        displayResults: [
          {
            label: "Standard Monthly Payment",
            value: formatCurrency(standardMonthlyPayment),
            tooltip: "Your regular monthly payment without additional contributions"
          },
          {
            label: "New Monthly Payment",
            value: formatCurrency(newMonthlyPayment),
            tooltip: "Total monthly payment including your additional amount"
          },
          {
            label: "Time Saved",
            value: `${Math.floor(timeSavedMonths / 12)} years, ${timeSavedMonths % 12} months`,
            tooltip: "How much earlier you'll pay off your loan"
          },
          {
            label: "Interest Saved",
            value: formatCurrency(interestSaved),
            tooltip: "Total interest you'll save by making additional payments"
          },
          {
            label: "New Loan Term",
            value: `${Math.floor(newTermMonths / 12)} years, ${newTermMonths % 12} months`,
            tooltip: "Your new reduced loan term"
          },
        ],
        loanAmount,
        interestRate,
        loanTermYears,
        additionalPayment,
        standardMonthlyPayment,
        newMonthlyPayment,
        newTermMonths,
        timeSavedMonths,
        interestSaved,
      };

      onCalculate(result);
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current values for sliders
  const currentAdditionalPayment = Number(form.watch("additionalPayment").replace(/[^0-9.]/g, "")) || 1000;
  const currentInterestRate = Number(form.watch("interestRate")) || 11.25;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white mr-4">
          <PlusCircleIcon className="h-5 w-5" />
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Additional Payment Calculator
        </h3>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            See how paying an additional amount each month can help you save on interest and pay off your home loan sooner. Even small extra payments can make a big difference over time.
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Loan Amount (R)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The outstanding balance of your home loan.</p>
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
                            const value = e.target.value.replace(/[^0-9.]/g, "");
                            const formattedValue = value
                              ? formatCurrency(parseFloat(value))
                              : "";
                            field.onChange(formattedValue);
                          }}
                          placeholder="e.g., R900,000"
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Your current home loan interest rate. The South African prime rate is currently around 11.25%.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="relative">
                          <Input {...field} className="pr-8" placeholder="e.g., 11.25" />
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

              <FormField
                control={form.control}
                name="loanTerm"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Loan Term (Years)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The remaining term of your home loan in years.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalPayment"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Additional Monthly Payment (R)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The extra amount you plan to pay each month in addition to your regular payment.</p>
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
                              const value = e.target.value.replace(/[^0-9.]/g, "");
                              const formattedValue = value
                                ? formatCurrency(parseFloat(value))
                                : "";
                              field.onChange(formattedValue);
                            }}
                            placeholder="e.g., R1,000"
                          />
                        </div>
                        <Slider
                          defaultValue={[currentAdditionalPayment]}
                          min={500}
                          max={10000}
                          step={500}
                          onValueChange={handleAdditionalPaymentSliderChange}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>R500</span>
                          <span>R10,000</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Calculating..." : "Calculate Savings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Additional Payment Chart */}
      {showChart && paymentDetails && (
        <div className="mt-8">
          <AdditionalPaymentChart 
            loanAmount={paymentDetails.loanAmount}
            interestRate={paymentDetails.interestRate}
            loanTerm={paymentDetails.loanTerm}
            additionalPayment={paymentDetails.additionalPayment}
          />
        </div>
      )}
    </div>
  );
}