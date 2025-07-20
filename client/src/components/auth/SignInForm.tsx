import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { OAuthButtons } from "./OAuthButtons";

// Form schema with validation
const formSchema = z.object({
  email: z.string()
    .refine(
      (val) => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val),
      { message: "Please enter a valid email address." }
    ),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type SignInFormValues = z.infer<typeof formSchema>;

export default function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const defaultValues: SignInFormValues = {
    email: "",
    password: "",
  };

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: SignInFormValues) => {
    try {
      setIsSubmitting(true);
      
      const result = await login(values.email, values.password);
      
      if (result) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        
        // Redirect to home page
        setLocation("/");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error?.response?.data?.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* OAuth Sign In Options */}
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

      {/* Traditional Sign In Form */}
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
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password">
                    <a className="text-sm font-medium text-primary hover:text-primary-600">
                      Forgot your password?
                    </a>
                  </Link>
                </div>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password"
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <div className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup">
              <a className="font-medium text-primary hover:text-primary-600">
                Sign up
              </a>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}