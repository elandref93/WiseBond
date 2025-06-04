import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";

// Form schema with validation
const formSchema = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .refine(
      (val) => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val),
      { message: "Please enter a valid email address" }
    ),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Default form values
  const defaultValues: ForgotPasswordFormValues = {
    email: "",
  };

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process request");
      }
      
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      
      // Reset form
      form.reset();
    } catch (error) {
      let errorMessage = "Failed to process your request. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <CardTitle className="mt-3 text-center text-xl font-semibold leading-9 text-gray-900">
              Check your email
            </CardTitle>
            <CardDescription className="text-center">
              We've sent a password reset link to <span className="font-medium">{submittedEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              If you don't see the email in your inbox, check your spam folder. The link will expire in 1 hour.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
            >
              Return to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Button variant="link" className="p-0" onClick={() => setLocation("/login")}>
              Sign in
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}