import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { Loader2, AlertOctagon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  
  // Extract token from URL with multiple fallbacks
  useEffect(() => {
    let extractedToken = null;
    
    try {
      // Method 1: Try wouter's useSearch
      const searchParams = useSearch();
      if (searchParams) {
        extractedToken = new URLSearchParams(searchParams).get("token");
      }
    } catch (error) {
    }
    
    // Method 2: Fallback to window.location.search
    if (!extractedToken && typeof window !== 'undefined') {
      try {
        extractedToken = new URLSearchParams(window.location.search).get("token");
      } catch (error) {
      }
    }
    
    // Method 3: Manual parsing as last resort
    if (!extractedToken && typeof window !== 'undefined') {
      try {
        const url = window.location.href;
        const tokenMatch = url.match(/[?&]token=([^&]+)/);
        if (tokenMatch) {
          extractedToken = decodeURIComponent(tokenMatch[1]);
        }
      } catch (error) {
      }
    }
    
    setToken(extractedToken);
  }, []);
  
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No reset token provided. Please request a new password reset link.");
        setIsVerifying(false);
        return;
      }
      
      try {
        // Optional: Verify token validity before showing the form
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        
        if (response.ok) {
          setIsValid(true);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Invalid or expired token. Please request a new password reset link.");
        }
      } catch (error) {
        setError("Failed to verify reset token. Please try again later.");
      } finally {
        setIsVerifying(false);
      }
    };
    
    if (token !== null) {
      verifyToken();
    }
  }, [token]);
  
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Verifying reset token</h2>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we verify your reset link...
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-6 bg-white rounded-lg shadow-md">
          <AlertOctagon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Password Reset Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => setLocation("/forgot-password")}
              className="w-full"
              variant="outline"
            >
              Request New Reset Link
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
              variant="default"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isValid && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    );
  }
  
  // Fallback (should never reach here)
  return null;
}
