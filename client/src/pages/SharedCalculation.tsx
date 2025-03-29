import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { parseSharedCalculation } from '@/lib/shareUtils';
import { CalculationResult } from '@/lib/calculators';
import CalculationResults from '@/components/calculators/CalculationResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator, Download, Share2 } from 'lucide-react';
import ShareCalculation from '@/components/calculators/ShareCalculation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SharedCalculation() {
  const [location] = useLocation();
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract the encoded data from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');

    if (!encodedData) {
      setError('No calculation data found in URL');
      setIsLoading(false);
      return;
    }

    try {
      // Parse the shared calculation
      const result = parseSharedCalculation(encodedData);
      
      if (!result) {
        setError('Invalid calculation data');
      } else {
        setCalculationResult(result);
      }
    } catch (err) {
      console.error('Error parsing shared calculation:', err);
      setError('Failed to load calculation data');
    }
    
    setIsLoading(false);
  }, [location]);

  // Function to go back to calculators page
  const goToCalculators = () => {
    window.location.href = '/calculators';
  };

  // Generate calculator title based on type
  const getCalculatorTitle = (type: string): string => {
    switch (type) {
      case 'bond':
        return 'Bond Repayment Calculator';
      case 'affordability':
        return 'Affordability Calculator';
      case 'deposit':
        return 'Deposit Savings Calculator';
      case 'additional':
        return 'Additional Payment Calculator';
      case 'transfer':
        return 'Transfer Costs Calculator';
      case 'amortisation':
        return 'Amortization Calculator';
      default:
        return 'Financial Calculator';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4 text-gray-600 hover:text-gray-900" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="my-8">
            <AlertTitle>Error Loading Calculation</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={goToCalculators}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Go to Calculators
            </Button>
          </Alert>
        ) : calculationResult ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {getCalculatorTitle(calculationResult.type)}
              </h1>
              <div className="flex space-x-2">
                <ShareCalculation result={calculationResult} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="text-sm text-gray-500 mb-6">
                This is a shared financial calculation. You can view the results below or try the calculator yourself.
              </div>
              
              <CalculationResults results={calculationResult} />
              
              <div className="mt-8 flex justify-center">
                <Button onClick={goToCalculators}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Try the Calculator Yourself
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}