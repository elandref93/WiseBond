import { useState } from "react";
import { CalculationResult } from "@/lib/calculators";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DownloadPdfButtonProps {
  result: CalculationResult;
  formValues?: any;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function DownloadPdfButton({ 
  result, 
  formValues,
  size = "default",
  variant = "default"
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleDownload = async () => {
    setLoading(true);
    
    try {
      // Check if user is authenticated first
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please log in to download PDF reports. Your calculation data will be saved.",
          variant: "default",
        });
        window.location.href = "/login?redirect=calculators";
        return;
      }
      
      
      // For bond calculator
      if (result.type === 'bond') {
        await handleBondRepaymentDownload();
      } 
      // For additional payment calculator
      else if (result.type === 'additional') {
        await handleAdditionalPaymentDownload();
      }
      else {
        // If we add support for other calculator types, handle them here
        toast({
          title: "Feature Not Available",
          description: "PDF download is currently only available for bond repayment and additional payment calculations.",
          variant: "destructive",
        });
      }
    } catch (error) {
      
      // Handle 401 Unauthorized errors specifically
      if (error instanceof Error && error.message.includes("401")) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again to download PDFs.",
          variant: "destructive",
        });
        window.location.href = "/login?redirect=calculators";
        return;
      }
      
      // More detailed error feedback for debugging
      if (error instanceof Error) {
        const errorDetails = error.message || 'Unknown error';
        toast({
          title: "Download Failed",
          description: `Error: ${errorDetails}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Download Failed",
          description: "There was a problem generating your PDF report. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBondRepaymentDownload = async () => {
    // Log request details for debugging
    // Make sure we use the same origin as the current page
    const baseUrl = window.location.origin;
    const requestUrl = `${baseUrl}/api/reports/bond-repayment`;
    
    
    const requestData = {
      propertyValue: formValues?.propertyValue,
      interestRate: formValues?.interestRate,
      loanTerm: formValues?.loanTerm,
      deposit: formValues?.deposit,
      includeBondFees: formValues?.includeBondFees,
      calculationResult: result
    };
    
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    
    if (!response.ok) {
      // Try to get more detailed error information
      try {
        const errorText = await response.text();
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
      } catch (textError) {
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
      }
    }
    
    // Get the PDF as a blob
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wisebond-bond-repayment-report.pdf';
    document.body.appendChild(link);
    
    // Click the link to trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "PDF Downloaded",
      description: "Your bond repayment report has been downloaded.",
    });
  };

  const handleAdditionalPaymentDownload = async () => {
    // Make sure we use the same origin as the current page
    const baseUrl = window.location.origin;
    const requestUrl = `${baseUrl}/api/reports/additional-payment`;
    
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loanAmount: formValues?.loanAmount,
        interestRate: formValues?.interestRate,
        loanTerm: formValues?.loanTerm,
        additionalPayment: formValues?.additionalPayment,
        calculationResult: result
      }),
    });
    
    if (!response.ok) {
      // Try to get more detailed error information
      try {
        const errorData = await response.json();
        throw new Error(`Failed to generate PDF: ${errorData.message || 'Unknown error'}`);
      } catch (jsonError) {
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
      }
    }
    
    // Get the PDF as a blob
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wisebond-additional-payment-report.pdf';
    document.body.appendChild(link);
    
    // Click the link to trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "PDF Downloaded",
      description: "Your additional payment report has been downloaded.",
    });
  };
  
  return (
    <Button 
      onClick={handleDownload} 
      size={size} 
      variant={variant}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Download PDF
        </>
      )}
    </Button>
  );
}
