import { useState } from "react";
import { CalculationResult } from "@/lib/calculators";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWatch } from "react-hook-form";

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
  
  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // For bond calculator
      if (result.type === 'bond') {
        const response = await fetch('/api/reports/bond-repayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyValue: formValues?.propertyValue,
            interestRate: formValues?.interestRate,
            loanTerm: formValues?.loanTerm,
            deposit: formValues?.deposit,
            calculationResult: result
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate PDF');
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
      } 
      // For additional payment calculator
      else if (result.type === 'additional') {
        const response = await fetch('/api/reports/additional-payment', {
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
          throw new Error('Failed to generate PDF');
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
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: "There was a problem generating your PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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