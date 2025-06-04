import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

// Define the steps of the determinator
const STEPS = [
  "purpose",
  "property_type",
  "price_range",
  "income",
  "employment",
  "credit_profile",
  "results"
];

// Define schemas for each step
const purposeSchema = z.object({
  purpose: z.enum(["first_time", "moving", "investment", "refinance", "building"]),
});

const propertyTypeSchema = z.object({
  property_type: z.enum(["house", "apartment", "townhouse", "vacant_land"]),
});

const priceRangeSchema = z.object({
  price_range: z.string().min(1, "Please select a price range"),
  deposit_percentage: z.string().min(1, "Please select a deposit percentage"),
});

const incomeSchema = z.object({
  monthly_income: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Monthly income must be a number",
  }),
  joint_application: z.enum(["yes", "no"]),
  partner_income: z.string().optional(),
});

const employmentSchema = z.object({
  employment_status: z.enum(["full_time", "part_time", "self_employed", "contract", "retired"]),
  employment_duration: z.enum(["less_than_6m", "6m_to_1y", "1y_to_3y", "more_than_3y"]),
});

const creditProfileSchema = z.object({
  credit_score: z.enum(["excellent", "good", "average", "poor", "unknown"]),
  existing_debt: z.string().refine((val) => !isNaN(Number(val.replace(/,/g, ""))), {
    message: "Existing debt must be a number",
  }),
});

type FormValues = z.infer<typeof purposeSchema> &
  z.infer<typeof propertyTypeSchema> &
  z.infer<typeof priceRangeSchema> &
  z.infer<typeof incomeSchema> &
  z.infer<typeof employmentSchema> &
  z.infer<typeof creditProfileSchema>;

// Product type for recommendations
type Product = {
  name: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  cta: string;
  ctaLink: string;
};

export default function Determinator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormValues>>({});
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get the current schema based on step
  const getSchemaForCurrentStep = () => {
    switch (STEPS[currentStep]) {
      case "purpose":
        return purposeSchema;
      case "property_type":
        return propertyTypeSchema;
      case "price_range":
        return priceRangeSchema;
      case "income":
        return incomeSchema;
      case "employment":
        return employmentSchema;
      case "credit_profile":
        return creditProfileSchema;
      default:
        return z.object({});
    }
  };

  const form = useForm<Partial<FormValues>>({
    resolver: zodResolver(getSchemaForCurrentStep()),
    defaultValues: formData,
  });

  const nextStep = (data: Partial<FormValues>) => {
    // Update the form data
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    // If this is the last step, calculate recommendations
    if (currentStep === STEPS.length - 2) {
      calculateRecommendations(updatedData);
    }

    // Move to the next step
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Function to calculate product recommendations based on form data
  const calculateRecommendations = (data: Partial<FormValues>) => {
    const products: Product[] = [];

    // Logic to determine products based on user answers
    if (data.purpose === "first_time") {
      products.push({
        name: "First-Time Buyer's Bond",
        description: "Designed specifically for those entering the property market for the first time.",
        benefits: [
          "Lower initial deposit requirements",
          "Possible FLISP subsidy qualification",
          "Competitive interest rates",
          "Dedicated first-time buyer specialist"
        ],
        icon: <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>,
        cta: "Apply for First-Time Bond",
        ctaLink: "/signup"
      });
    }

    if (data.purpose === "building" || data.property_type === "vacant_land") {
      products.push({
        name: "Building Loan",
        description: "Finance for constructing your dream home from the ground up.",
        benefits: [
          "Phased payments aligned with construction progress",
          "Interest-only payments during construction",
          "Professional guidance on building requirements",
          "Assistance with architect and building plans"
        ],
        icon: <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>,
        cta: "Apply for Building Loan",
        ctaLink: "/signup"
      });
    }

    if (data.purpose === "refinance") {
      products.push({
        name: "Home Loan Refinancing",
        description: "Optimize your existing home loan to save money or access equity.",
        benefits: [
          "Secure lower interest rates on existing loans",
          "Access built-up equity for renovations",
          "Consolidate debt at lower interest rates",
          "Reduce monthly repayments through restructuring"
        ],
        icon: <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>,
        cta: "Refinance Now",
        ctaLink: "/signup"
      });
    }

    if (data.purpose === "investment") {
      products.push({
        name: "Investment Property Bond",
        description: "Specialized financing solutions for property investments.",
        benefits: [
          "Structured to accommodate rental income",
          "Options for interest-only periods",
          "Portfolio-based assessment for multiple properties",
          "Tax optimization guidance"
        ],
        icon: <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>,
        cta: "Invest Now",
        ctaLink: "/signup"
      });
    }

    // Default standard bond product
    products.push({
      name: "Standard Home Loan",
      description: "Our comprehensive home loan solution with competitive rates across multiple banks.",
      benefits: [
        "Compare offers from all major South African banks",
        "Negotiated rates better than going direct",
        "Flexible terms and repayment options",
        "Expert guidance throughout the process"
      ],
      icon: <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>,
      cta: "Apply for Home Loan",
      ctaLink: "/signup"
    });

    // If self-employed, add a specialized product
    if (data.employment_status === "self_employed") {
      products.push({
        name: "Self-Employed Home Loan",
        description: "Tailored solutions for business owners and freelancers.",
        benefits: [
          "Flexible income verification options",
          "Considers business financials holistically",
          "Specialized assessment criteria",
          "Options for irregular income patterns"
        ],
        icon: <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>,
        cta: "Apply as Self-Employed",
        ctaLink: "/signup"
      });
    }

    setRecommendations(products);
  };

  const progressPercentage = (currentStep / (STEPS.length - 1)) * 100;

  const renderStepContent = () => {
    switch (STEPS[currentStep]) {
      case "purpose":
        return (
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base">What's the purpose of your home loan?</FormLabel>
                <FormDescription>
                  Let us know why you're looking for a home loan so we can provide the most relevant options.
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="first_time" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        I'm a first-time home buyer
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="moving" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        I'm moving to a new home
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="investment" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        I'm buying an investment property
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="refinance" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        I want to refinance my existing home loan
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="building" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        I'm building a new home
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "property_type":
        return (
          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base">What type of property are you interested in?</FormLabel>
                <FormDescription>
                  The property type can affect loan conditions and requirements.
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="house" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Free-standing house
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="apartment" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Apartment / Flat
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="townhouse" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Townhouse / Cluster / Complex
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="vacant_land" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Vacant land
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "price_range":
        return (
          <>
            <FormField
              control={form.control}
              name="price_range"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">What is your estimated property price range?</FormLabel>
                  <FormDescription>
                    This helps us determine the appropriate loan size.
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="500000-1000000">R500,000 - R1,000,000</SelectItem>
                      <SelectItem value="1000001-1500000">R1,000,001 - R1,500,000</SelectItem>
                      <SelectItem value="1500001-2000000">R1,500,001 - R2,000,000</SelectItem>
                      <SelectItem value="2000001-3000000">R2,000,001 - R3,000,000</SelectItem>
                      <SelectItem value="3000001-5000000">R3,000,001 - R5,000,000</SelectItem>
                      <SelectItem value="5000001+">Above R5,000,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deposit_percentage"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">How much deposit are you planning to put down?</FormLabel>
                  <FormDescription>
                    A larger deposit typically means better interest rates.
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deposit percentage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">No deposit (100% bond)</SelectItem>
                      <SelectItem value="5">5% deposit</SelectItem>
                      <SelectItem value="10">10% deposit</SelectItem>
                      <SelectItem value="15">15% deposit</SelectItem>
                      <SelectItem value="20">20% deposit</SelectItem>
                      <SelectItem value="20+">More than 20% deposit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case "income":
        return (
          <>
            <FormField
              control={form.control}
              name="monthly_income"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">What is your gross monthly income?</FormLabel>
                  <FormDescription>
                    Before deductions like tax and retirement contributions.
                  </FormDescription>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R</span>
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        placeholder="e.g. 25,000"
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (!isNaN(Number(value))) {
                            field.onChange(formatCurrency(value));
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="joint_application"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">Are you applying with a co-applicant?</FormLabel>
                  <FormDescription>
                    A joint application can increase your borrowing power.
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("joint_application") === "yes" && (
              <FormField
                control={form.control}
                name="partner_income"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base">What is your co-applicant's gross monthly income?</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">R</span>
                        </div>
                        <Input
                          {...field}
                          className="pl-8"
                          placeholder="e.g. 20,000"
                          onBlur={(e) => {
                            const value = e.target.value.replace(/,/g, "");
                            if (!isNaN(Number(value))) {
                              field.onChange(formatCurrency(value));
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        );

      case "employment":
        return (
          <>
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">What is your employment status?</FormLabel>
                  <FormDescription>
                    Different employment types may have different documentation requirements.
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time employed</SelectItem>
                      <SelectItem value="part_time">Part-time employed</SelectItem>
                      <SelectItem value="self_employed">Self-employed</SelectItem>
                      <SelectItem value="contract">Contract worker</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="employment_duration"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">How long have you been in your current job/business?</FormLabel>
                  <FormDescription>
                    Longer employment history can improve your application.
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="less_than_6m">Less than 6 months</SelectItem>
                      <SelectItem value="6m_to_1y">6 months to 1 year</SelectItem>
                      <SelectItem value="1y_to_3y">1 to 3 years</SelectItem>
                      <SelectItem value="more_than_3y">More than 3 years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case "credit_profile":
        return (
          <>
            <FormField
              control={form.control}
              name="credit_score"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">How would you rate your credit score?</FormLabel>
                  <FormDescription>
                    Your credit score significantly affects your interest rate.
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit score" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent (700+)</SelectItem>
                      <SelectItem value="good">Good (670-699)</SelectItem>
                      <SelectItem value="average">Average (640-669)</SelectItem>
                      <SelectItem value="poor">Below average (below 640)</SelectItem>
                      <SelectItem value="unknown">I don't know my score</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="existing_debt"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">What is your total monthly debt repayment amount?</FormLabel>
                  <FormDescription>
                    Include car loans, credit cards, personal loans, etc.
                  </FormDescription>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R</span>
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        placeholder="e.g. 5,000"
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (!isNaN(Number(value))) {
                            field.onChange(formatCurrency(value));
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case "results":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Your Personalized Recommendations</h3>
              <p className="mt-2 text-gray-500">
                Based on your answers, we've identified the following products that best match your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {recommendations.map((product, index) => (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    {product.icon}
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {product.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href={product.ctaLink}>
                      <Button className="w-full">{product.cta}</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mt-8">
              <h4 className="font-medium text-gray-900">What happens next?</h4>
              <ol className="mt-4 space-y-4">
                <li className="flex">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-sm mr-3 shrink-0">1</span>
                  <p className="text-gray-600">Create an account or log in to start your application</p>
                </li>
                <li className="flex">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-sm mr-3 shrink-0">2</span>
                  <p className="text-gray-600">Complete your full application with supporting documents</p>
                </li>
                <li className="flex">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-sm mr-3 shrink-0">3</span>
                  <p className="text-gray-600">We'll submit to multiple banks to get you the best deal</p>
                </li>
                <li className="flex">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-sm mr-3 shrink-0">4</span>
                  <p className="text-gray-600">Review and accept your preferred offer</p>
                </li>
              </ol>
            </div>

            {!user && (
              <div className="text-center mt-8">
                <p className="text-gray-700 mb-4">Ready to get started with your home loan journey?</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg">Create Account</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg">Log In</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const onSubmit = (data: Partial<FormValues>) => {
    nextStep(data);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Find the Right Home Loan
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Answer a few questions to get personalized home loan recommendations
            that match your specific needs.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Form */}
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {currentStep < STEPS.length - 1 ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {renderStepContent()}
                    
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                      >
                        Back
                      </Button>
                      <Button type="submit">
                        {currentStep === STEPS.length - 2 ? "See Results" : "Continue"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                renderStepContent()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}