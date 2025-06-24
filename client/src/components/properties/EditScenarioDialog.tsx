import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoanScenario, UpdateLoanScenario, updateLoanScenarioSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditScenarioDialogProps {
  scenario: LoanScenario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditScenarioDialog({ scenario, open, onOpenChange }: EditScenarioDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateLoanScenario>({
    resolver: zodResolver(updateLoanScenarioSchema),
    defaultValues: {
      id: scenario.id,
      name: scenario.name,
      type: scenario.type,
      isActive: scenario.isActive,
      lumpSumAmount: scenario.lumpSumAmount || undefined,
      lumpSumDate: scenario.lumpSumDate || undefined,
      lumpSumDateType: scenario.lumpSumDateType || undefined,
      extraMonthlyAmount: scenario.extraMonthlyAmount || undefined,
      extraMonthlyStartDate: scenario.extraMonthlyStartDate || undefined,
      extraMonthlyStartType: scenario.extraMonthlyStartType || undefined,
      extraMonthlyDuration: scenario.extraMonthlyDuration || undefined,
      monthlyIncreaseAmount: scenario.monthlyIncreaseAmount || undefined,
      monthlyIncreaseStartDate: scenario.monthlyIncreaseStartDate || undefined,
      monthlyIncreaseStartType: scenario.monthlyIncreaseStartType || undefined,
      monthlyIncreaseFrequency: scenario.monthlyIncreaseFrequency || undefined,
    },
  });

  const scenarioType = form.watch("type");

  const updateScenarioMutation = useMutation({
    mutationFn: async (data: UpdateLoanScenario) => {
      const response = await apiRequest('PUT', `/api/scenarios/${scenario.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', scenario.propertyId, 'scenarios'] });
      toast({
        title: "Scenario updated",
        description: "Your loan scenario has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateLoanScenario) => {
    updateScenarioMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Loan Scenario</DialogTitle>
          <DialogDescription>
            Update your loan scenario details and parameters.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Extra R2000 Monthly, Bonus Payment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scenario type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lump_sum">Lump Sum Payment</SelectItem>
                        <SelectItem value="extra_monthly">Extra Monthly Payment</SelectItem>
                        <SelectItem value="monthly_increase">Monthly Payment Increase</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lump Sum Fields */}
            {scenarioType === 'lump_sum' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">Lump Sum Payment Details</h4>
                
                <FormField
                  control={form.control}
                  name="lumpSumAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lump Sum Amount (R)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lumpSumDateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date" id="date" />
                            <Label htmlFor="date">Specific Date</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="payment_number" id="payment_number" />
                            <Label htmlFor="payment_number">Payment Number</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lumpSumDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("lumpSumDateType") === "date" ? "Payment Date" : "Payment Number"}
                      </FormLabel>
                      <FormControl>
                        {form.watch("lumpSumDateType") === "date" ? (
                          <Input type="date" {...field} />
                        ) : (
                          <Input 
                            type="number" 
                            placeholder="12" 
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Extra Monthly Payment Fields */}
            {scenarioType === 'extra_monthly' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">Extra Monthly Payment Details</h4>
                
                <FormField
                  control={form.control}
                  name="extraMonthlyAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extra Monthly Amount (R)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2000" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extraMonthlyStartType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date" id="start_date" />
                            <Label htmlFor="start_date">Specific Date</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="payment_number" id="start_payment_number" />
                            <Label htmlFor="start_payment_number">Payment Number</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extraMonthlyStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("extraMonthlyStartType") === "date" ? "Start Date" : "Start Payment Number"}
                      </FormLabel>
                      <FormControl>
                        {form.watch("extraMonthlyStartType") === "date" ? (
                          <Input type="date" {...field} />
                        ) : (
                          <Input 
                            type="number" 
                            placeholder="1" 
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extraMonthlyDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months) - Optional</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Leave empty for indefinite" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Monthly Increase Fields */}
            {scenarioType === 'monthly_increase' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold">Monthly Payment Increase Details</h4>
                
                <FormField
                  control={form.control}
                  name="monthlyIncreaseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Increase Amount (R)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyIncreaseStartType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date" id="increase_date" />
                            <Label htmlFor="increase_date">Specific Date</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="payment_number" id="increase_payment_number" />
                            <Label htmlFor="increase_payment_number">Payment Number</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyIncreaseStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("monthlyIncreaseStartType") === "date" ? "Start Date" : "Start Payment Number"}
                      </FormLabel>
                      <FormControl>
                        {form.watch("monthlyIncreaseStartType") === "date" ? (
                          <Input type="date" {...field} />
                        ) : (
                          <Input 
                            type="number" 
                            placeholder="12" 
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyIncreaseFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Increase Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "once"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="once">One-time increase</SelectItem>
                          <SelectItem value="annually">Annual increase</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateScenarioMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateScenarioMutation.isPending}
              >
                {updateScenarioMutation.isPending ? "Updating..." : "Update Scenario"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}