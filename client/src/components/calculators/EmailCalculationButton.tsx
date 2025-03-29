import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mail } from 'lucide-react';
import { CalculationResult } from '@/lib/calculators';
import EmailCalculationForm from './EmailCalculationForm';
import { useToast } from '@/hooks/use-toast';

interface EmailCalculationButtonProps {
  result: CalculationResult;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
}

export default function EmailCalculationButton({ 
  result, 
  size = "default", 
  variant = "default",
  className = ""
}: EmailCalculationButtonProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Handle email form success
  const handleEmailSuccess = () => {
    setOpen(false);
    toast({
      title: 'Email sent successfully',
      description: 'Thank you for your interest. A consultant may contact you to discuss further options.',
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Mail className="mr-2 h-4 w-4" />
          Email Results
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Calculation Results</DialogTitle>
          <DialogDescription>
            Get these results emailed to you and speak to a home loan consultant
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Our consultants can help you find the best home loan options based on your specific needs.
          </p>
          <EmailCalculationForm 
            result={result} 
            onSuccess={handleEmailSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}