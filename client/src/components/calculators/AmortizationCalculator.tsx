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
import { formatCurrency } from "@/lib/calculators";
import { CalculationResult } from "@/lib/calculators";

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
      const loanAmount = parseFloat(values.loanAmount.replace(/[^0-9.]/g, ""));
      const interestRate = parseFloat(values.interestRate) / 100;
      const loanTermYears = parseFloat(values.loanTerm);
      const loanTermMonths = loanTermYears * 12;
      
      // Calculate monthly payment
      const monthlyRate = interestRate / 12;
      const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loanTermMonths));
      
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
      
      // Calculate amortization schedule
      for (let month = 1; month <= loanTermMonths; month++) {
        const interest = remainingPrincipal * monthlyRate;
        const principal = Math.min(monthlyPayment - interest, remainingPrincipal);
        
        remainingPrincipal -= principal;
        totalInterestPaid += interest;
        
        const currentYear = Math.ceil(month / 12);
        interestPaidByYear[currentYear] += interest;
        principalPaidByYear[currentYear] += principal;
        
        // Save remaining loan amount at the end of each year
        if (month % 12 === 0) {
          remainingByYear[month / 12] = remainingPrincipal;
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
                  <FormLabel>Loan Amount (R)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, "");
                        const formattedValue = value
                          ? formatCurrency(parseFloat(value))
                          : "";
                        field.onChange(formattedValue);
                      }}
                      placeholder="e.g., R1,000,000"
                    />
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
                    <Input {...field} placeholder="e.g., 11.25" />
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