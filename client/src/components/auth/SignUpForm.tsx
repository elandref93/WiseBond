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
import { 
  validateSAID, 
  extractDateOfBirth, 
  calculateAgeFromID,
  formatDateYYYYMMDD
} from "@/lib/saIDHelper";

// Form schema with validation
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
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
      description: "Your account has been verified. You can now log in.",
    });
    
    // Redirect to login page
    setLocation("/login");
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
                  <Input {...field} autoComplete="given-name" />
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
                  <Input {...field} autoComplete="family-name" />
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
                  <Input {...field} type="email" autoComplete="email" />
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="w-full">
              <svg
                className="w-5 h-5 mr-2"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.545,10.239v3.818h5.556c-0.451,2.867-2.698,4.958-5.556,4.958c-3.407,0-6.164-2.758-6.164-6.164 s2.758-6.164,6.164-6.164c1.442,0,2.765,0.503,3.813,1.337l2.879-2.879c-1.814-1.675-4.225-2.702-6.692-2.702 c-5.591,0-10.119,4.528-10.119,10.119s4.528,10.119,10.119,10.119c7.256,0,9.672-6.633,8.922-11.42H12.545z" />
              </svg>
              <span>Google</span>
            </Button>

            <Button variant="outline" type="button" className="w-full">
              <svg
                className="w-5 h-5 mr-2"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Facebook</span>
            </Button>
          </div>
        </div>

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
  );
}
