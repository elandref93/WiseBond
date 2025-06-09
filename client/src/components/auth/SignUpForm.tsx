import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import OTPVerification from "./OTPVerification";
import { OAuthButtons } from "./OAuthButtons";
import { 
  validateSAID, 
  extractDateOfBirth, 
  calculateAgeFromID,
  formatDateYYYYMMDD
} from "@/lib/saIDHelper";

// Form schema with validation
const formSchema = z.object({
  firstName: z.string()
    .min(2, { message: "First name must be at least 2 characters." })
    .refine(
      (val) => /^[A-Za-z\s\-']+$/.test(val), 
      { message: "First name can only contain letters, spaces, hyphens and apostrophes." }
    ),
  lastName: z.string()
    .min(2, { message: "Last name must be at least 2 characters." })
    .refine(
      (val) => /^[A-Za-z\s\-']+$/.test(val), 
      { message: "Last name can only contain letters, spaces, hyphens and apostrophes." }
    ),
  email: z.string()
    .refine(
      (val) => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val),
      { message: "Please enter a valid email address." }
    ),
  phone: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Allow empty as it's optional
      // Match either 10 digits starting with 0 or +27 followed by 9 digits
      return /^(0\d{9}|\+27[1-9]\d{8})$/.test(val);
    },
    { message: "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)" }
  ),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

type SignUpFormValues = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'otp'>('form');
  const [userId, setUserId] = useState<number | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { register } = useAuth();

  // Default form values
  const defaultValues: SignUpFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    terms: false,
  };

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      // Initial registration - creates account but marks as unverified
      const user = await register({
        // Use email as username since we're removing the username field
        username: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || "",
        otpVerified: false,
        profileComplete: false,
      });

      // Store the user ID for OTP verification
      setUserId(user.id);
      
      // Move to OTP verification step
      setRegistrationStep('otp');
      
      toast({
        title: "Verification required",
        description: `We've sent a verification code to ${values.email}. Please enter it to complete your registration.`,
      });
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOTPVerified = () => {
    toast({
      title: "Verification successful",
      description: "Your account has been verified and you are now logged in.",
    });
    
    // Redirect to home page instead of login page
    setLocation("/");
  };

  if (registrationStep === 'otp' && userId && form.getValues().email) {
    return (
      <OTPVerification 
        userId={userId} 
        email={form.getValues().email} 
        onVerified={handleOTPVerified}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* OAuth Sign Up Options */}
      <div className="space-y-4">
        <OAuthButtons />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>
      </div>

      {/* Traditional Sign Up Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    autoComplete="given-name"
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens and apostrophes
                      const value = e.target.value;
                      const sanitized = value.replace(/[^A-Za-z\s\-']/g, '');
                      field.onChange(sanitized);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    autoComplete="family-name"
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens and apostrophes
                      const value = e.target.value;
                      const sanitized = value.replace(/[^A-Za-z\s\-']/g, '');
                      field.onChange(sanitized);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    className={form.formState.errors.email ? "border-red-500 focus:ring-red-500" : ""}
                    onChange={(e) => {
                      field.onChange(e);
                      // Live validation feedback
                      const emailRegex = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/;
                      const isValid = emailRegex.test(e.target.value);
                      const emailInput = e.target as HTMLInputElement;
                      if (e.target.value && !isValid) {
                        emailInput.classList.add("border-red-500");
                        emailInput.classList.add("bg-red-50");
                      } else {
                        emailInput.classList.remove("border-red-500");
                        emailInput.classList.remove("bg-red-50");
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="tel" 
                    autoComplete="tel" 
                    placeholder="e.g. 0821234567 or +27821234567"
                    pattern="(0[0-9]{9}|\+27[1-9][0-9]{8})"
                    maxLength={12}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only digits and plus sign
                      const sanitized = value.replace(/[^\d+]/g, '');
                      
                      // Enforce length constraints
                      if (sanitized.startsWith('+27') && sanitized.length > 12) {
                        field.onChange(sanitized.substring(0, 12));
                      } else if (sanitized.startsWith('0') && sanitized.length > 10) {
                        field.onChange(sanitized.substring(0, 10));
                      } else {
                        field.onChange(sanitized);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="new-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:text-primary-600">
                    terms and conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:text-primary-600">
                    privacy policy
                  </a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login">
              <a className="font-medium text-primary hover:text-primary-600">
                Log in
              </a>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
