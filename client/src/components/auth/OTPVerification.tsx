import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';
import { Smartphone } from 'lucide-react';

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
  const otpRef = useRef<HTMLInputElement>(null);

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
    
    // Focus on the first OTP field when component mounts
    if (otpRef.current) {
      setTimeout(() => {
        otpRef.current?.focus();
      }, 300);
    }
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
    <div className="w-full max-w-md mx-auto bg-white rounded-lg p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="bg-gray-50 p-3 rounded-full mb-4">
          <Smartphone className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Verify Your Account</h3>
        <p className="text-gray-600 text-center">
          Enter the 6-digit verification code sent to
          <br />
          <span className="font-medium text-gray-800">{email}</span>
        </p>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={form.watch('otp') || ''}
              onChange={(value) => form.setValue('otp', value, { shouldValidate: true })}
              render={({ slots }) => (
                <InputOTPGroup className="gap-2">
                  {slots.map((slot, i) => (
                    <InputOTPSlot 
                      key={i} 
                      index={i} 
                      {...slot} 
                      className="w-12 h-12 text-lg border-gray-300"
                      ref={i === 0 ? otpRef : undefined}
                    />
                  ))}
                </InputOTPGroup>
              )}
            />
          </div>
          
          {form.formState.errors.otp && (
            <p className="text-sm text-red-500 text-center">
              {form.formState.errors.otp.message}
            </p>
          )}
          
          <Button 
            className="w-full bg-amber-200 hover:bg-amber-300 text-black font-medium py-3"
            type="submit" 
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Didn't receive a code?
            </p>
            <Button 
              variant="link" 
              onClick={handleResendOTP} 
              disabled={isResending}
              className="text-blue-600 font-medium p-0"
            >
              {isResending ? "Sending..." : "Resend"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}