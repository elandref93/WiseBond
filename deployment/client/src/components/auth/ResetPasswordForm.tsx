import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { createPasswordSchema } from "@/lib/passwordValidation";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, ShieldCheck, X, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema with validation
const formSchema = z.object({
  password: createPasswordSchema(),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

type ResetPasswordFormValues = z.infer<typeof formSchema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Default form values
  const defaultValues: ResetPasswordFormValues = {
    password: "",
    confirmPassword: "",
  };

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  // Calculate password strength whenever password changes
  useEffect(() => {
    const password = form.watch("password");
    
    if (!password) {
      setPasswordStrength(0);
      setPasswordChecks({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
      return;
    }
    
    // Calculate individual checks
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    
    setPasswordChecks(checks);
    
    // Calculate strength as percentage (0-100)
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strengthPercentage = (passedChecks / 5) * 100;
    setPasswordStrength(strengthPercentage);
  }, [form.watch("password")]);

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return "None";
    if (strength <= 20) return "Very Weak";
    if (strength <= 40) return "Weak";
    if (strength <= 60) return "Medium";
    if (strength <= 80) return "Strong";
    return "Very Strong";
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-gray-200";
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-green-500";
    return "bg-green-700";
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: values.password
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }
      
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      // Redirect to login page
      setTimeout(() => {
        setLocation("/login");
      }, 1500);
    } catch (error) {
      let errorMessage = "Password reset failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Please create a strong, unique password for your account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      autoComplete="new-password" 
                    />
                  </FormControl>
                  <div className="mt-2">
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Strength:</span>
                      <span className={passwordStrength > 60 ? "text-green-600" : passwordStrength > 30 ? "text-yellow-600" : "text-red-600"}>
                        {getStrengthLabel(passwordStrength)}
                      </span>
                    </div>
                    <Progress 
                      value={passwordStrength} 
                      className={`h-2 ${getStrengthColor(passwordStrength)}`}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center text-sm">
                      {passwordChecks.length ? <Check size={14} className="text-green-600 mr-1"/> : <X size={14} className="text-red-600 mr-1"/>}
                      <span>8+ characters</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {passwordChecks.uppercase ? <Check size={14} className="text-green-600 mr-1"/> : <X size={14} className="text-red-600 mr-1"/>}
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {passwordChecks.lowercase ? <Check size={14} className="text-green-600 mr-1"/> : <X size={14} className="text-red-600 mr-1"/>}
                      <span>Lowercase letter</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {passwordChecks.number ? <Check size={14} className="text-green-600 mr-1"/> : <X size={14} className="text-red-600 mr-1"/>}
                      <span>Number</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {passwordChecks.special ? <Check size={14} className="text-green-600 mr-1"/> : <X size={14} className="text-red-600 mr-1"/>}
                      <span>Special character</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert variant="default" className="bg-blue-50 text-blue-900 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-600 font-medium">Password tip</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm">
                Create a unique password that you don't use on other websites. 
                Consider using a phrase with special characters and numbers.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => setLocation("/login")}>
          Return to login
        </Button>
      </CardFooter>
    </Card>
  );
}