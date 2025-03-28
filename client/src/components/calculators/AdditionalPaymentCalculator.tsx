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
  additionalPayment: z.string().min(1, { message: "Additional payment is required" }),
});

type AdditionalPaymentFormValues = z.infer<typeof formSchema>;

interface AdditionalPaymentCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function AdditionalPaymentCalculator({ onCalculate }: AdditionalPaymentCalculatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: AdditionalPaymentFormValues = {
    loanAmount: "",
    interestRate: "11.25",
    loanTerm: "20",
    additionalPayment: "",
  };

  const form = useForm<AdditionalPaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: AdditionalPaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const loanAmount = parseFloat(values.loanAmount.replace(/[^0-9.]/g, ""));
      const interestRate = parseFloat(values.interestRate) / 100;
      const loanTermYears = parseFloat(values.loanTerm);
      const loanTermMonths = loanTermYears * 12;
      const additionalPayment = parseFloat(values.additionalPayment.replace(/[^0-9.]/g, ""));
      
      // Calculate standard monthly payment
      const monthlyRate = interestRate / 12;
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
        interestRate: parseFloat(values.interestRate),
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

            <FormField
              control={form.control}
              name="additionalPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Monthly Payment (R)</FormLabel>
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
                      placeholder="e.g., R1,000"
                    />
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