import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Smartphone } from 'lucide-react';
import { Input } from "@/components/ui/input";

// OTP form validation schema
const formSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

type OTPFormValues = z.infer<typeof formSchema>;

interface OTPVerificationProps {
  userId: number;
  email: string;
  onVerified: () => void;
  developmentOtp?: string;
  emailError?: boolean;
}

export default function OTPVerification({ userId, email, onVerified, developmentOtp, emailError }: OTPVerificationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdownTime, setCountdownTime] = useState(60);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const form = useForm<OTPFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange"
  });
  
  // Set focus on first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  // Countdown timer for resend button
  useEffect(() => {
    if (countdownTime > 0) {
      const timer = setTimeout(() => {
        setCountdownTime(countdownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownTime]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Update the digit at this position
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1); // Only take the last character if multiple are pasted
    setOtpDigits(newOtpDigits);
    
    // Combine all digits into a single OTP value
    const newOtp = newOtpDigits.join('');
    form.setValue('otp', newOtp, { shouldValidate: true });
    
    // Auto-advance to next field or auto-submit if complete
    if (value && index < 5) {
      // Move to next input
      const nextInput = inputRefs.current[index + 1];
      if (nextInput !== null && nextInput !== undefined) {
        nextInput.focus();
      }
    } else if (index === 5 && newOtp.length === 6) {
      // Auto-submit if all 6 digits are filled
      form.handleSubmit(onSubmit)();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous field
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    // Handle arrow keys for navigation between inputs
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // If the pasted content is 6 digits, fill all inputs
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      form.setValue('otp', pastedData, { shouldValidate: true });
      
      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  // Global paste handler for the entire form
  const handleGlobalPaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData('text').trim();
    
    // If the pasted content is 6 digits, fill all inputs
    if (/^\d{6}$/.test(pastedData)) {
      e.preventDefault();
      const digits = pastedData.split('');
      setOtpDigits(digits);
      form.setValue('otp', pastedData, { shouldValidate: true });
      
      // Focus the last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const onSubmit = async (values: OTPFormValues) => {
    if (!values.otp || values.otp.length !== 6) {
      toast({
        title: "Incomplete code",
        description: "Please enter all 6 digits of your verification code.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Verify the OTP
      await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          otp: values.otp,
        }),
      });

      // Set the session by logging in with the verified user credentials
      try {
        // Log user in automatically after successful verification
        const loginResponse = await apiRequest('/api/auth/login-verified-user', {
          method: 'POST',
          body: JSON.stringify({
            userId,
          }),
        });
        
        // Check if login was successful
        const loginData = await loginResponse.json();
        if (!loginData.user) {
          throw new Error("Failed to log in automatically");
        }
        
        console.log("Auto-login successful after OTP verification");
        console.log("User data received:", loginData.user);
        
        // Set the user data immediately in the query cache
        queryClient.setQueryData(['/api/auth/me'], loginData.user);
        console.log("Query cache updated with user data");
        
        // Also invalidate the auth context to ensure it refreshes
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        console.log("Auth queries invalidated");
      } catch (loginError) {
        console.error('Auto-login after verification failed:', loginError);
        // Show a warning but still continue with verification success
        toast({
          title: "Verification successful but login failed",
          description: "Your account is verified but you'll need to log in manually.",
          variant: "destructive",
        });
        
        // We'll still call onVerified to redirect, but with a different experience
        onVerified();
        return;
      }

      toast({
        title: "Success",
        description: "Your account has been verified.",
        variant: "default",
      });

      // Small delay to ensure authentication state is updated
      setTimeout(() => {
        onVerified();
      }, 500);
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
    if (countdownTime > 0) return;
    
    setIsResending(true);
    try {
      const response = await apiRequest('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (data.emailError && data.developmentOtp) {
        toast({
          title: "Development Mode - Email Delivery Failed",
          description: `Use this OTP code: ${data.developmentOtp}`,
          variant: "default",
        });
      } else {
        toast({
          title: "OTP Sent",
          description: `A new verification code has been sent to ${email}`,
          variant: "default",
        });
      }
      
      // Set countdown timer for 60 seconds
      setCountdownTime(60);
      
      // Clear the current OTP
      setOtpDigits(['', '', '', '', '', '']);
      form.setValue('otp', '', { shouldValidate: false });
      
      // Focus the first input
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
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
        
        {/* Development mode OTP display */}
        {emailError && developmentOtp && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Development Mode:</strong> Email delivery failed
              <br />
              <span className="font-mono text-lg">{developmentOtp}</span>
            </p>
          </div>
        )}
        
        {/* Email delivery warning */}
        {emailError && !developmentOtp && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 text-center">
              Email delivery failed. Please try resending or check your spam folder.
            </p>
          </div>
        )}
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} onPaste={handleGlobalPaste}>
        <div className="space-y-6">
          {/* Custom OTP input grid */}
          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, index) => (
              <Input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className="w-12 h-12 text-center text-lg border-gray-300"
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                ref={(el) => { inputRefs.current[index] = el; }}
                autoComplete="off"
              />
            ))}
          </div>
          
          {form.formState.errors.otp && (
            <p className="text-sm text-red-500 text-center">
              {form.formState.errors.otp.message}
            </p>
          )}
          
          <Button 
            className="w-full bg-amber-200 hover:bg-amber-300 text-black font-medium py-3"
            type="submit" 
            disabled={isLoading || otpDigits.join('').length !== 6}
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
              disabled={isResending || countdownTime > 0}
              className="text-blue-600 font-medium p-0"
            >
              {isResending ? "Sending..." : countdownTime > 0 ? `Resend (${countdownTime}s)` : "Resend"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}