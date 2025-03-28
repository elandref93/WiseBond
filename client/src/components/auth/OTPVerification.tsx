import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';

// OTP form validation schema
const formSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

type OTPFormValues = z.infer<typeof formSchema>;

interface OTPVerificationProps {
  userId: number;
  email: string;
  onVerified: () => void;
}

export default function OTPVerification({ userId, email, onVerified }: OTPVerificationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<OTPFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange"
  });
  
  // Manually register the OTP field
  useEffect(() => {
    form.register("otp");
  }, [form]);

  const onSubmit = async (values: OTPFormValues) => {
    setIsLoading(true);
    try {
      await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          otp: values.otp,
        }),
      });

      toast({
        title: "Success",
        description: "Your account has been verified.",
        variant: "default",
      });

      onVerified();
    } catch (error) {
      console.error('OTP verification failed:', error);
      toast({
        title: "Verification failed",
        description: "Invalid OTP code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await apiRequest('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ userId, email }),
      });

      toast({
        title: "OTP Sent",
        description: `A new verification code has been sent to ${email}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast({
        title: "Failed to resend",
        description: "We couldn't send a new verification code. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your Account</CardTitle>
        <CardDescription>
          Enter the 6-digit verification code sent to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <InputOTP
              maxLength={6}
              value={form.watch('otp') || ''}
              onChange={(value) => form.setValue('otp', value, { shouldValidate: true })}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, i) => (
                    <InputOTPSlot key={i} index={i} {...slot} />
                  ))}
                </InputOTPGroup>
              )}
            />
            {form.formState.errors.otp && (
              <p className="text-sm text-red-500">
                {form.formState.errors.otp.message}
              </p>
            )}
            <Button 
              className="w-full" 
              type="submit" 
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          Didn't receive a code?
        </p>
        <Button 
          variant="outline" 
          onClick={handleResendOTP} 
          disabled={isResending}
        >
          {isResending ? "Sending..." : "Resend"}
        </Button>
      </CardFooter>
    </Card>
  );
}