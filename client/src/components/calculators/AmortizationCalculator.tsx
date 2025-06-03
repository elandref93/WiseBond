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
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, parseCurrency, CalculationResult } from "@/lib/calculators";

const formSchema = z.object({
  loanAmount: z.string().min(1, { message: "Loan amount is required" }),
  interestRate: z.string().min(1, { message: "Interest rate is required" }),
  loanTerm: z.string().min(1, { message: "Loan term is required" }),
});

type AmortizationFormValues = z.infer<typeof formSchema>;

interface AmortizationCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function AmortizationCalculator({ onCalculate }: AmortizationCalculatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: AmortizationFormValues = {
    loanAmount: "",
    interestRate: "11.25",
    loanTerm: "20",
  };

  const form = useForm<AmortizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: AmortizationFormValues) => {
    setIsSubmitting(true);
    try {
      // Use our parseCurrency utility to properly handle currency strings
      const loanAmount = parseCurrency(values.loanAmount);
      const interestRate = parseFloat(values.interestRate) / 100;
      const loanTermYears = parseFloat(values.loanTerm);
      const loanTermMonths = loanTermYears * 12;
      
      console.log('=== AMORTIZATION CALCULATOR DEBUG ===');
      console.log(`Input Values: Loan=${values.loanAmount}, Rate=${values.interestRate}%, Term=${values.loanTerm} years`);
      console.log(`Parsed Values: Loan=${loanAmount}, Rate=${interestRate * 100}%, Term=${loanTermYears} years`);
      
      // Calculate monthly payment
      const monthlyRate = interestRate / 12;
      const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loanTermMonths));
      
      console.log(`Monthly Rate: ${(monthlyRate * 100).toFixed(4)}%`);
      console.log(`Monthly Payment: R${monthlyPayment.toFixed(2)}`);
      
      // Create amortization schedule
      let remainingPrincipal = loanAmount;
      
      // Calculate values for specific years to display
      const yearlyData = [];
      const yearsToShow = [1, 5, 10, 15, 20, 25, 30].filter(year => year <= loanTermYears);
      
      let totalInterestPaid = 0;
      let interestPaidByYear: Record<number, number> = {};
      let principalPaidByYear: Record<number, number> = {};
      let remainingByYear: Record<number, number> = {};
      
      // Initialize yearly counters
      for (let year = 1; year <= loanTermYears; year++) {
        interestPaidByYear[year] = 0;
        principalPaidByYear[year] = 0;
      }
      
      // Calculate amortization schedule with detailed debugging
      for (let month = 1; month <= loanTermMonths; month++) {
        const interest = remainingPrincipal * monthlyRate;
        const principal = Math.min(monthlyPayment - interest, remainingPrincipal);
        
        remainingPrincipal -= principal;
        totalInterestPaid += interest;
        
        const currentYear = Math.ceil(month / 12);
        interestPaidByYear[currentYear] += interest;
        principalPaidByYear[currentYear] += principal;
        
        // Save remaining loan amount at the end of each year and debug
        if (month % 12 === 0) {
          remainingByYear[month / 12] = remainingPrincipal;
          if (month / 12 <= 5) { // Log first 5 years
            console.log(`Year ${month/12}: Remaining Balance = R${remainingPrincipal.toFixed(2)}, Interest Paid = R${interestPaidByYear[currentYear].toFixed(2)}, Principal Paid = R${principalPaidByYear[currentYear].toFixed(2)}`);
          }
        }
      }
      
      // Create data for the selected years to show
      for (const year of yearsToShow) {
        yearlyData.push({
          year,
          interestPaid: interestPaidByYear[year],
          principalPaid: principalPaidByYear[year],
          totalPaid: interestPaidByYear[year] + principalPaidByYear[year],
          remainingPrincipal: remainingByYear[year] || 0,
          interestToDate: Object.keys(interestPaidByYear)
            .filter(y => parseInt(y) <= year)
            .reduce((sum, y) => sum + interestPaidByYear[parseInt(y)], 0),
          principalToDate: Object.keys(principalPaidByYear)
            .filter(y => parseInt(y) <= year)
            .reduce((sum, y) => sum + principalPaidByYear[parseInt(y)], 0),
        });
      }
      
      // Total payments
      const totalPayment = monthlyPayment * loanTermMonths;
      const totalInterest = totalPayment - loanAmount;
      
      // Calculate the first year breakdown for display
      const firstYearInterest = interestPaidByYear[1];
      const firstYearPrincipal = principalPaidByYear[1];
      
      const result: CalculationResult = {
        type: 'amortisation',
        displayResults: [
          {
            label: "Monthly Payment",
            value: formatCurrency(monthlyPayment),
            tooltip: "Your fixed monthly payment amount"
          },
          {
            label: "Total Repayment",
            value: formatCurrency(totalPayment),
            tooltip: "Total amount paid over the full loan term"
          },
          {
            label: "Total Interest",
            value: formatCurrency(totalInterest),
            tooltip: "Total interest paid over the loan term"
          },
          {
            label: "First-Year Interest",
            value: formatCurrency(firstYearInterest),
            tooltip: "Interest paid during the first year"
          },
          {
            label: "First-Year Principal",
            value: formatCurrency(firstYearPrincipal),
            tooltip: "Principal paid during the first year"
          },
          {
            label: "Interest-to-Principal Ratio",
            value: `${(totalInterest / loanAmount * 100).toFixed(1)}%`,
            tooltip: "Ratio of total interest to the original loan amount"
          },
        ],
        loanAmount,
        interestRate: parseFloat(values.interestRate),
        loanTermYears,
        monthlyPayment,
        totalPayment,
        totalInterest,
        yearlyData,
      };

      onCalculate(result);
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R</span>
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        onChange={(e) => {
                          // If user is typing R or is pasting a formatted value, clean it
                          const input = e.target.value;
                          
                          // Keep only digits and at most one decimal point
                          const numericValue = input.replace(/[^0-9.]/g, "")
                                                  .replace(/(\..*)\./g, '$1');
                          
                          // Don't format if it's empty
                          if (!numericValue) {
                            field.onChange("");
                            return;
                          }
                          
                          // For raw input of digits, let user continue typing without formatting
                          // Only format when input contains non-numeric characters or loses focus
                          if (input === numericValue) {
                            field.onChange(numericValue);
                          } else {
                            // Format when pasting or if the value already had formatting
                            const value = parseFloat(numericValue);
                            if (!isNaN(value)) {
                              field.onChange(formatCurrency(value));
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Format on blur to ensure proper display
                          const value = parseCurrency(e.target.value);
                          if (value > 0) {
                            field.onChange(formatCurrency(value));
                          }
                        }}
                        placeholder="e.g., 1000000"
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
                  <FormLabel>Interest Rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        className="pr-8" 
                        placeholder="e.g., 11.25" 
                      />
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
                  <FormLabel>Loan Term (Years)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Calculating..." : "Calculate"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}