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
  purchasePrice: z.string().min(1, { message: "Purchase price is required" }),
  isFirstTimeHomebuyer: z.boolean().default(false),
});

type BondsTransferFormValues = z.infer<typeof formSchema>;

interface BondsTransferCostsCalculatorProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function BondsTransferCostsCalculator({ onCalculate }: BondsTransferCostsCalculatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: BondsTransferFormValues = {
    purchasePrice: "",
    isFirstTimeHomebuyer: false,
  };

  const form = useForm<BondsTransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: BondsTransferFormValues) => {
    setIsSubmitting(true);
    try {
      const purchasePrice = parseFloat(values.purchasePrice.replace(/[^0-9.]/g, ""));
      
      // Calculate transfer duty based on South African rates
      let transferDuty = 0;
      const isFirstTimeHomebuyer = values.isFirstTimeHomebuyer;

      if (purchasePrice <= 1000000) {
        transferDuty = 0; // No transfer duty below R1,000,000
      } else if (purchasePrice <= 1375000) {
        transferDuty = (purchasePrice - 1000000) * 0.03;
      } else if (purchasePrice <= 1925000) {
        transferDuty = 11250 + (purchasePrice - 1375000) * 0.06;
      } else if (purchasePrice <= 2475000) {
        transferDuty = 44250 + (purchasePrice - 1925000) * 0.08;
      } else if (purchasePrice <= 11000000) {
        transferDuty = 88250 + (purchasePrice - 2475000) * 0.11;
      } else {
        transferDuty = 1026000 + (purchasePrice - 11000000) * 0.13;
      }

      // Calculate attorney fees (approximate)
      const transferAttorneyFee = purchasePrice * 0.015;
      
      // Bond registration fees (approximate)
      const bondRegistrationFee = purchasePrice * 0.012;
      
      // Deeds office fee (approximate flat rate)
      const deedsOfficeFee = 1500;
      
      // Total costs
      const totalCosts = transferDuty + transferAttorneyFee + bondRegistrationFee + deedsOfficeFee;
      
      const result: CalculationResult = {
        type: 'transfer',
        displayResults: [
          {
            label: "Transfer Duty",
            value: formatCurrency(transferDuty),
            tooltip: "Government tax on property transfers"
          },
          {
            label: "Transfer Attorney Fees",
            value: formatCurrency(transferAttorneyFee),
            tooltip: "Fees for the attorney handling the property transfer"
          },
          {
            label: "Bond Registration Fee",
            value: formatCurrency(bondRegistrationFee),
            tooltip: "Cost of registering the bond with the Deeds Office"
          },
          {
            label: "Deeds Office Fee",
            value: formatCurrency(deedsOfficeFee),
            tooltip: "Fee charged by the Deeds Office for registration"
          },
          {
            label: "Total Costs",
            value: formatCurrency(totalCosts),
            tooltip: "Total fees and costs for property transfer and bond registration"
          },
        ],
        purchasePrice,
        transferDuty,
        transferAttorneyFee,
        bondRegistrationFee,
        deedsOfficeFee,
        totalCosts,
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
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Purchase Price (R)</FormLabel>
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
                      placeholder="e.g., R1,500,000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFirstTimeHomebuyer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    First-time home buyer
                  </FormLabel>
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