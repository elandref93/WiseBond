import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Home, BarChart3, User, FileText, ThumbsUp, AlertCircle as InfoCircle } from "lucide-react";
import { formatCurrency } from "@/lib/calculators";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Step 1: Personal Information
const personalInfoSchema = z.object({
  age: z.string().min(1, "Age is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  dependents: z.string().min(1, "Number of dependents is required"),
  southAfricanCitizen: z.boolean().default(false),
  residentStatus: z.string().optional(),
});

// Step 2: Employment Details
const employmentSchema = z.object({
  employmentStatus: z.string().min(1, "Employment status is required"),
  employmentDuration: z.string().min(1, "Employment duration is required"),
  incomeFrequency: z.string().min(1, "Income frequency is required"),
  grossIncome: z.string().min(1, "Income is required"),
  otherIncome: z.string().default("0"),
});

// Step 3: Expenses and Liabilities
const expensesSchema = z.object({
  totalMonthlyExpenses: z.string().min(1, "Monthly expenses are required"),
  existingDebt: z.string().min(1, "Please specify if you have existing debt"),
  creditCardDebt: z.string().default("0"),
  personalLoans: z.string().default("0"),
  carLoans: z.string().default("0"),
  otherLoans: z.string().default("0"),
});

// Step 4: Property Details
const propertySchema = z.object({
  propertyType: z.string().min(1, "Property type is required"),
  propertyPrice: z.string().min(1, "Property price is required"),
  depositAmount: z.string().min(1, "Deposit amount is required"),
  loanTerm: z.string().min(1, "Loan term is required"),
});

// Step 5: Credit History
const creditSchema = z.object({
  creditScore: z.string().min(1, "Credit score range is required"),
  missedPayments: z.string().min(1, "Please specify if you've missed payments"),
  bankruptcies: z.string().min(1, "Please specify if you've had bankruptcies"),
  judgments: z.string().min(1, "Please specify if you've had judgments"),
});

type FormValues = z.infer<typeof personalInfoSchema> & 
                  z.infer<typeof employmentSchema> & 
                  z.infer<typeof expensesSchema> & 
                  z.infer<typeof propertySchema> & 
                  z.infer<typeof creditSchema>;

export default function LoanEligibilityWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormValues>>({});
  const [result, setResult] = useState<{
    eligible: boolean;
    reasons: string[];
    suggestedLoanAmount?: number;
    suggestedMonthlyPayment?: number;
    maxLTV?: number;
    dti?: number;
  } | null>(null);
  
  const totalSteps = 5;
  const progress = (step / (totalSteps + 1)) * 100;

  // Personal Info Form
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      age: "",
      maritalStatus: "",
      dependents: "0",
      southAfricanCitizen: true,
      residentStatus: "",
    },
  });

  // Employment Form
  const employmentForm = useForm<z.infer<typeof employmentSchema>>({
    resolver: zodResolver(employmentSchema),
    defaultValues: {
      employmentStatus: "",
      employmentDuration: "",
      incomeFrequency: "monthly",
      grossIncome: "",
      otherIncome: "0",
    },
  });

  // Expenses Form
  const expensesForm = useForm<z.infer<typeof expensesSchema>>({
    resolver: zodResolver(expensesSchema),
    defaultValues: {
      totalMonthlyExpenses: "",
      existingDebt: "no",
      creditCardDebt: "0",
      personalLoans: "0",
      carLoans: "0",
      otherLoans: "0",
    },
  });

  // Property Form
  const propertyForm = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      propertyType: "",
      propertyPrice: "",
      depositAmount: "",
      loanTerm: "20",
    },
  });

  // Credit Form
  const creditForm = useForm<z.infer<typeof creditSchema>>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      creditScore: "",
      missedPayments: "no",
      bankruptcies: "no",
      judgments: "no",
    },
  });

  // Load saved values into forms when navigating between steps
  useEffect(() => {
    if (formData.age) personalInfoForm.setValue("age", formData.age);
    if (formData.maritalStatus) personalInfoForm.setValue("maritalStatus", formData.maritalStatus);
    if (formData.dependents) personalInfoForm.setValue("dependents", formData.dependents);
    if (formData.southAfricanCitizen !== undefined) 
      personalInfoForm.setValue("southAfricanCitizen", formData.southAfricanCitizen);
    if (formData.residentStatus) personalInfoForm.setValue("residentStatus", formData.residentStatus);

    if (formData.employmentStatus) employmentForm.setValue("employmentStatus", formData.employmentStatus);
    if (formData.employmentDuration) employmentForm.setValue("employmentDuration", formData.employmentDuration);
    if (formData.incomeFrequency) employmentForm.setValue("incomeFrequency", formData.incomeFrequency);
    if (formData.grossIncome) employmentForm.setValue("grossIncome", formData.grossIncome);
    if (formData.otherIncome) employmentForm.setValue("otherIncome", formData.otherIncome);

    if (formData.totalMonthlyExpenses) expensesForm.setValue("totalMonthlyExpenses", formData.totalMonthlyExpenses);
    if (formData.existingDebt) expensesForm.setValue("existingDebt", formData.existingDebt);
    if (formData.creditCardDebt) expensesForm.setValue("creditCardDebt", formData.creditCardDebt);
    if (formData.personalLoans) expensesForm.setValue("personalLoans", formData.personalLoans);
    if (formData.carLoans) expensesForm.setValue("carLoans", formData.carLoans);
    if (formData.otherLoans) expensesForm.setValue("otherLoans", formData.otherLoans);

    if (formData.propertyType) propertyForm.setValue("propertyType", formData.propertyType);
    if (formData.propertyPrice) propertyForm.setValue("propertyPrice", formData.propertyPrice);
    if (formData.depositAmount) propertyForm.setValue("depositAmount", formData.depositAmount);
    if (formData.loanTerm) propertyForm.setValue("loanTerm", formData.loanTerm);

    if (formData.creditScore) creditForm.setValue("creditScore", formData.creditScore);
    if (formData.missedPayments) creditForm.setValue("missedPayments", formData.missedPayments);
    if (formData.bankruptcies) creditForm.setValue("bankruptcies", formData.bankruptcies);
    if (formData.judgments) creditForm.setValue("judgments", formData.judgments);
  }, [step, formData]);

  const handlePersonalInfoSubmit = (data: z.infer<typeof personalInfoSchema>) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const handleEmploymentSubmit = (data: z.infer<typeof employmentSchema>) => {
    setFormData({ ...formData, ...data });
    setStep(3);
  };

  const handleExpensesSubmit = (data: z.infer<typeof expensesSchema>) => {
    setFormData({ ...formData, ...data });
    setStep(4);
  };

  const handlePropertySubmit = (data: z.infer<typeof propertySchema>) => {
    setFormData({ ...formData, ...data });
    setStep(5);
  };

  const handleCreditSubmit = (data: z.infer<typeof creditSchema>) => {
    const allData = { ...formData, ...data };
    setFormData(allData);
    evaluateEligibility(allData as FormValues);
    setStep(6);
  };

  const evaluateEligibility = (data: FormValues) => {
    const reasons: string[] = [];
    let eligible = true;
    
    // Convert string values to numbers for calculations
    const age = parseInt(data.age);
    const grossIncome = parseInt(data.grossIncome.replace(/[^\d]/g, ""));
    const otherIncome = parseInt(data.otherIncome.replace(/[^\d]/g, "") || "0");
    const totalMonthlyExpenses = parseInt(data.totalMonthlyExpenses.replace(/[^\d]/g, ""));
    const creditCardDebt = parseInt(data.creditCardDebt.replace(/[^\d]/g, "") || "0");
    const personalLoans = parseInt(data.personalLoans.replace(/[^\d]/g, "") || "0");
    const carLoans = parseInt(data.carLoans.replace(/[^\d]/g, "") || "0");
    const otherLoans = parseInt(data.otherLoans.replace(/[^\d]/g, "") || "0");
    const propertyPrice = parseInt(data.propertyPrice.replace(/[^\d]/g, ""));
    const depositAmount = parseInt(data.depositAmount.replace(/[^\d]/g, ""));
    
    // Calculate loan amount
    const loanAmount = propertyPrice - depositAmount;
    const loanToValueRatio = (loanAmount / propertyPrice) * 100;
    
    // Calculate total monthly debt
    const totalMonthlyDebt = 
      (creditCardDebt / 100) * 5 + // Assume 5% monthly payment on credit card
      (personalLoans + carLoans + otherLoans) / 60; // Assume 5 year amortization for simplicity
    
    // Calculate total monthly income
    const totalMonthlyIncome = grossIncome + otherIncome;
    
    // Calculate debt-to-income ratio (including projected mortgage payment)
    const interestRate = 0.0975; // Assume 9.75% interest rate
    const loanTermMonths = parseInt(data.loanTerm) * 12;
    const monthlyRate = interestRate / 12;
    const monthlyLoanPayment = 
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    
    const dti = ((totalMonthlyExpenses + totalMonthlyDebt + monthlyLoanPayment) / totalMonthlyIncome) * 100;
    
    // Age check
    if (age < 18 || age > 70) {
      reasons.push("Age requirement: Applicants should typically be between 18 and 70 years old");
      eligible = false;
    }
    
    // Income check
    if (totalMonthlyIncome < 5000) {
      reasons.push("Income requirement: Minimum gross monthly income should be at least R5,000");
      eligible = false;
    }
    
    // LTV check
    if (loanToValueRatio > 90) {
      reasons.push("Loan-to-value ratio: Maximum LTV is typically 90%. Consider a larger deposit");
      eligible = false;
    }
    
    // DTI check
    if (dti > 45) {
      reasons.push("Debt-to-income ratio: Your DTI ratio exceeds 45%. Consider reducing debt or expenses");
      eligible = false;
    }
    
    // Credit history checks
    if (data.creditScore === "poor" || data.creditScore === "very-poor") {
      reasons.push("Credit score: Banks typically require a fair to excellent credit score");
      eligible = false;
    }
    
    if (data.missedPayments === "yes-many" || data.judgments === "yes" || data.bankruptcies === "yes") {
      reasons.push("Credit history: Recent missed payments, judgments, or bankruptcies may affect approval");
      eligible = false;
    }
    
    // Employment stability
    if (data.employmentStatus === "unemployed") {
      reasons.push("Employment: Stable employment is typically required for loan approval");
      eligible = false;
    }
    
    if (data.employmentDuration === "less-than-6-months" && data.employmentStatus !== "self-employed") {
      reasons.push("Employment duration: At least 6 months in current job is typically preferred");
      eligible = false;
    }
    
    // Residency status
    if (!data.southAfricanCitizen && data.residentStatus === "temporary") {
      reasons.push("Residency status: Permanent residence or citizenship is typically preferred");
      eligible = false;
    }
    
    // If eligible, but with caveats
    if (eligible && loanToValueRatio > 80) {
      reasons.push("Note: Deposits larger than 20% typically secure better interest rates");
    }
    
    if (eligible && dti > 35) {
      reasons.push("Note: Your debt-to-income ratio is on the higher side. Reducing this may improve loan terms");
    }
    
    // Set suggested loan amount (possibly lower than requested if DTI is high)
    let suggestedLoanAmount = loanAmount;
    if (dti > 40 && dti <= 45) {
      suggestedLoanAmount = Math.round(loanAmount * 0.9); // Suggest 90% of requested amount
    }
    
    setResult({
      eligible,
      reasons,
      suggestedLoanAmount: eligible ? suggestedLoanAmount : undefined,
      suggestedMonthlyPayment: eligible ? Math.round(monthlyLoanPayment) : undefined,
      maxLTV: Math.round(loanToValueRatio * 10) / 10, // Round to 1 decimal place
      dti: Math.round(dti * 10) / 10, // Round to 1 decimal place
    });
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({});
    setResult(null);
    personalInfoForm.reset();
    employmentForm.reset();
    expensesForm.reset();
    propertyForm.reset();
    creditForm.reset();
  };

  const formatNumberInput = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/[^\d]/g, "");
    // Format with commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loan Eligibility Pre-Check</h2>
        <p className="text-gray-600 mb-6">
          This pre-check will give you a quick indication of your potential eligibility for a home loan.
          It's not a formal application but will help set expectations before you apply.
        </p>
        <div className="mb-2 flex justify-between text-sm">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Tell us about yourself to help us assess your loan eligibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...personalInfoForm}>
              <form onSubmit={personalInfoForm.handleSubmit(handlePersonalInfoSubmit)} className="space-y-6">
                <FormField
                  control={personalInfoForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="35" {...field} />
                      </FormControl>
                      <FormDescription>
                        You must be between 18 and 70 years old to qualify for most home loans.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalInfoForm.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalInfoForm.control}
                  name="dependents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Dependents</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Number of people financially dependent on you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalInfoForm.control}
                  name="southAfricanCitizen"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">South African Citizen</FormLabel>
                        <FormDescription>
                          Are you a South African citizen?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {!personalInfoForm.watch("southAfricanCitizen") && (
                  <FormField
                    control={personalInfoForm.control}
                    name="residentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residency Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your residency status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="permanent">Permanent Resident</SelectItem>
                            <SelectItem value="temporary">Temporary Resident</SelectItem>
                            <SelectItem value="work-visa">Work Visa Holder</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="flex justify-end">
                  <Button type="submit">
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Employment & Income
            </CardTitle>
            <CardDescription>
              Your employment status and income are key factors in loan approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...employmentForm}>
              <form onSubmit={employmentForm.handleSubmit(handleEmploymentSubmit)} className="space-y-6">
                <FormField
                  control={employmentForm.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your employment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time Employed</SelectItem>
                          <SelectItem value="part-time">Part-time Employed</SelectItem>
                          <SelectItem value="self-employed">Self-Employed</SelectItem>
                          <SelectItem value="contract">Contract Worker</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={employmentForm.control}
                  name="employmentDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration in Current Job/Business</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="less-than-6-months">Less than 6 months</SelectItem>
                          <SelectItem value="6-months-to-1-year">6 months to 1 year</SelectItem>
                          <SelectItem value="1-3-years">1-3 years</SelectItem>
                          <SelectItem value="3-5-years">3-5 years</SelectItem>
                          <SelectItem value="more-than-5-years">More than 5 years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Longer employment duration improves your chances of loan approval.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={employmentForm.control}
                  name="incomeFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Income Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={employmentForm.control}
                  name="grossIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross {employmentForm.watch("incomeFrequency")} Income (R)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            placeholder="15,000"
                            onChange={(e) => {
                              field.onChange(formatNumberInput(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Your income before tax and deductions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={employmentForm.control}
                  name="otherIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Monthly Income (R) (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            placeholder="0"
                            onChange={(e) => {
                              field.onChange(formatNumberInput(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Include rental income, dividends, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevious}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="submit">
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Expenses & Debt
            </CardTitle>
            <CardDescription>
              Your monthly expenses and existing debt affect how much you can borrow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...expensesForm}>
              <form onSubmit={expensesForm.handleSubmit(handleExpensesSubmit)} className="space-y-6">
                <FormField
                  control={expensesForm.control}
                  name="totalMonthlyExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Monthly Expenses (R)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            placeholder="8,000"
                            onChange={(e) => {
                              field.onChange(formatNumberInput(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Include rent, utilities, groceries, etc. (exclude debt payments)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={expensesForm.control}
                  name="existingDebt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have existing debt?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              No, I don't have any debt
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Yes, I have some debt (please specify below)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {expensesForm.watch("existingDebt") === "yes" && (
                  <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                    <h4 className="font-medium">Debt Details</h4>
                    
                    <FormField
                      control={expensesForm.control}
                      name="creditCardDebt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Card Balance (R)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R</span>
                              </div>
                              <Input
                                {...field}
                                className="pl-8"
                                placeholder="0"
                                onChange={(e) => {
                                  field.onChange(formatNumberInput(e.target.value));
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={expensesForm.control}
                      name="personalLoans"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Loan Monthly Payments (R)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R</span>
                              </div>
                              <Input
                                {...field}
                                className="pl-8"
                                placeholder="0"
                                onChange={(e) => {
                                  field.onChange(formatNumberInput(e.target.value));
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={expensesForm.control}
                      name="carLoans"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Car Loan Monthly Payments (R)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R</span>
                              </div>
                              <Input
                                {...field}
                                className="pl-8"
                                placeholder="0"
                                onChange={(e) => {
                                  field.onChange(formatNumberInput(e.target.value));
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={expensesForm.control}
                      name="otherLoans"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Loan Monthly Payments (R)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R</span>
                              </div>
                              <Input
                                {...field}
                                className="pl-8"
                                placeholder="0"
                                onChange={(e) => {
                                  field.onChange(formatNumberInput(e.target.value));
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevious}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="submit">
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5 text-primary" />
              Property Details
            </CardTitle>
            <CardDescription>
              Tell us about the property you're interested in buying.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...propertyForm}>
              <form onSubmit={propertyForm.handleSubmit(handlePropertySubmit)} className="space-y-6">
                <FormField
                  control={propertyForm.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="house">Free-standing House</SelectItem>
                          <SelectItem value="apartment">Apartment / Flat</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="vacant-land">Vacant Land</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={propertyForm.control}
                  name="propertyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Purchase Price (R)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            placeholder="1,500,000"
                            onChange={(e) => {
                              field.onChange(formatNumberInput(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={propertyForm.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Amount (R)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R</span>
                          </div>
                          <Input
                            {...field}
                            className="pl-8"
                            placeholder="150,000"
                            onChange={(e) => {
                              field.onChange(formatNumberInput(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Banks typically require a minimum 10% deposit, though 100% loans are sometimes available.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={propertyForm.control}
                  name="loanTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Term (Years): {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          value={[parseInt(field.value)]}
                          min={5}
                          max={30}
                          step={5}
                          onValueChange={(value) => field.onChange(value[0].toString())}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5 years</span>
                        <span>30 years</span>
                      </div>
                      <FormDescription>
                        Standard home loan terms in South Africa range from 20 to 30 years.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevious}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="submit">
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Credit History
            </CardTitle>
            <CardDescription>
              Your credit profile is one of the most important factors in loan approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...creditForm}>
              <form onSubmit={creditForm.handleSubmit(handleCreditSubmit)} className="space-y-6">
                <FormField
                  control={creditForm.control}
                  name="creditScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Score Range</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your credit score range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent (700+)</SelectItem>
                          <SelectItem value="good">Good (680-699)</SelectItem>
                          <SelectItem value="fair">Fair (620-679)</SelectItem>
                          <SelectItem value="poor">Poor (580-619)</SelectItem>
                          <SelectItem value="very-poor">Very Poor (Below 580)</SelectItem>
                          <SelectItem value="unknown">I Don't Know</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Higher credit scores typically qualify for better interest rates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={creditForm.control}
                  name="missedPayments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Have you missed any loan/credit payments in the last 12 months?</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no">No, all payments made on time</SelectItem>
                          <SelectItem value="yes-few">Yes, 1-2 missed payments</SelectItem>
                          <SelectItem value="yes-many">Yes, 3 or more missed payments</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={creditForm.control}
                  name="judgments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have any judgments or legal actions against you?</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="rehabilitated">Rehabilitated/Settled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={creditForm.control}
                  name="bankruptcies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Have you been declared bankrupt or had debt review in the last 10 years?</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="rehabilitated">Rehabilitated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevious}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="submit">
                    Check Eligibility
                    <ThumbsUp className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 6 && result && (
        <Card className={result.eligible ? "border-green-500" : "border-red-500"}>
          <CardHeader className={
            result.eligible 
              ? "bg-green-50 border-b border-green-100" 
              : "bg-red-50 border-b border-red-100"
          }>
            <CardTitle className="flex items-center">
              {result.eligible
                ? <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                : <XCircle className="mr-2 h-5 w-5 text-red-500" />
              }
              {result.eligible
                ? "You're Likely Eligible for a Home Loan"
                : "You May Face Challenges Getting Approved"
              }
            </CardTitle>
            <CardDescription>
              {result.eligible
                ? "Based on the information provided, you would likely be eligible for a home loan. Remember that this is just a pre-check and not a guarantee of approval."
                : "Based on the information provided, you might face some challenges in getting approved for a home loan. See below for details."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Key Indicators Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.maxLTV && (
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-gray-500">Loan-to-Value Ratio</h3>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{result.maxLTV}%</span>
                      <span className="ml-2 text-sm text-gray-500">
                        {result.maxLTV <= 80 
                          ? "(Excellent)" 
                          : result.maxLTV <= 90 
                            ? "(Good)" 
                            : "(High)"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {result.maxLTV <= 80 
                        ? "Your deposit is substantial, which improves your chances of approval." 
                        : result.maxLTV <= 90 
                          ? "Your LTV is acceptable, but a larger deposit may secure better rates." 
                          : "Your LTV is high. Consider increasing your deposit if possible."}
                    </p>
                  </div>
                )}
                
                {result.dti && (
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-gray-500">Debt-to-Income Ratio</h3>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{result.dti}%</span>
                      <span className="ml-2 text-sm text-gray-500">
                        {result.dti <= 35 
                          ? "(Excellent)" 
                          : result.dti <= 45 
                            ? "(Acceptable)" 
                            : "(High)"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {result.dti <= 35 
                        ? "Your income comfortably covers your expenses and debt." 
                        : result.dti <= 45 
                          ? "Your debt load is manageable but consider reducing other debts." 
                          : "Your DTI is high. Reducing debt or increasing income would help."}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Results Details */}
              <div className="space-y-4">
                {result.eligible && result.suggestedLoanAmount && (
                  <div className="bg-green-50 rounded-md p-4">
                    <h3 className="font-medium text-green-800">Potential Loan Details</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Suggested Loan Amount</p>
                        <p className="text-lg font-medium">{formatCurrency(result.suggestedLoanAmount)}</p>
                      </div>
                      {result.suggestedMonthlyPayment && (
                        <div>
                          <p className="text-sm text-gray-600">Estimated Monthly Payment</p>
                          <p className="text-lg font-medium">{formatCurrency(result.suggestedMonthlyPayment)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className={
                  result.eligible 
                    ? "bg-blue-50 rounded-md p-4" 
                    : "bg-red-50 rounded-md p-4"
                }>
                  <h3 className={
                    result.eligible 
                      ? "font-medium text-blue-800" 
                      : "font-medium text-red-800"
                  }>
                    {result.eligible ? "Key Considerations" : "Eligibility Challenges"}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {result.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        {result.eligible 
                          ? <InfoCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          : <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        }
                        <span className={
                          result.eligible 
                            ? "text-sm text-blue-700" 
                            : "text-sm text-red-700"
                        }>
                          {reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Next Steps */}
              <div className="rounded-md border p-4">
                <h3 className="font-medium text-gray-900 mb-2">Next Steps</h3>
                <ul className="space-y-2">
                  {result.eligible ? (
                    <>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">Get in touch with our consultants for a formal pre-approval.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">Prepare your documents: ID, proof of income, bank statements, etc.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">Start exploring properties within your price range.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">Work on addressing the challenges highlighted above.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">Consider speaking with our consultants for personalized advice.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">Revisit this pre-check after improving your financial situation.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={handleReset}>
              Start Over
            </Button>
            <Button 
              className={result.eligible ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Contact a Consultant
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}