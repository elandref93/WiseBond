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
  const [developmentOtp, setDevelopmentOtp] = useState<string | undefined>(undefined);
  const [emailError, setEmailError] = useState<boolean>(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { register } = useAuth();

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
    try {
      setIsSubmitting(true);
      
      const result = await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
      });

      setUserId((result as any).userId);
      
      // Handle development mode OTP display when email delivery fails
      if ((result as any).emailError && (result as any).developmentOtp) {
        setDevelopmentOtp((result as any).developmentOtp);
        setEmailError(true);
        toast({
          title: "Account created - Development Mode",
          description: `Email delivery failed. Use OTP: ${(result as any).developmentOtp}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email (including spam folder) for the verification code.",
        });
      }
      
      setRegistrationStep('otp');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check if the error is about duplicate email
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('Email already exists') || errorMessage.includes('already exists')) {
        toast({
          title: "Account already exists",
          description: "An account with this email already exists. Redirecting you to the login page...",
          variant: "destructive",
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          setLocation('/login');
        }, 2000);
      } else {
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
        developmentOtp={developmentOtp}
        emailError={emailError}
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
                  <FormLabel>Phone number (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="tel"
                      autoComplete="tel"
                      placeholder="e.g., 0821234567 or +27821234567"
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
                    <Input 
                      {...field} 
                      type="password"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="sm:col-span-6 flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{" "}
                      <Link href="/terms">
                        <a className="text-primary underline">terms and conditions</a>
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy">
                        <a className="text-primary underline">privacy policy</a>
                      </Link>
                    </FormLabel>
                  </div>
                  <FormMessage />
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