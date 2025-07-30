import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function AuthError() {
  const [, setLocation] = useLocation();
  const [errorType, setErrorType] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let errorType = 'unknown_error';
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      errorType = urlParams.get('error') || 'unknown_error';
      setErrorType(errorType);
    } catch (error) {
      setErrorType('unknown_error');
    }

    switch (errorType) {
      case 'oauth_error':
        setErrorMessage('Authentication was cancelled or failed. Please try again.');
        break;
      case 'no_code':
        setErrorMessage('No authorization code received from the provider.');
        break;
      case 'callback_failed':
        setErrorMessage('Authentication callback failed. Please try again.');
        break;
      case 'access_denied':
        setErrorMessage('Access was denied by the authentication provider.');
        break;
      default:
        setErrorMessage('An unknown error occurred during authentication.');
    }
  }, []);

  const handleRetry = () => {
    setLocation('/signup');
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We encountered an issue while signing you in
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Sign In Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Details
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errorMessage}</p>
                    {errorType && (
                      <p className="mt-1 text-xs text-red-600">
                        Error code: {errorType}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleRetry} 
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={handleGoHome} 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>
                Still having trouble?{" "}
                <a 
                  href="mailto:support@wisebond.co.za" 
                  className="font-medium text-primary hover:text-primary-600"
                >
                  Contact support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
