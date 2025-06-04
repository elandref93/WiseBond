import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseSharedCalculation } from '@/lib/shareUtils';
import { CalculationResult } from '@/lib/calculators';
import { ArrowLeft, Calculator } from 'lucide-react';
import ShareCalculation from '@/components/calculators/ShareCalculation';
import EmailCalculationButton from '@/components/calculators/EmailCalculationButton';

export default function SharedCalculation() {
  const [location, navigate] = useLocation();
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  // State to manage the calculation result
  
  useEffect(() => {
    // Get the encoded data from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    if (encodedData) {
      try {
        // Parse the encoded data
        const result = parseSharedCalculation(encodedData);
        if (result) {
          setCalculationResult(result);
        } else {
          // Handle invalid data
          console.error('Invalid calculation data');
        }
      } catch (error) {
        console.error('Error parsing calculation data:', error);
      }
    } else {
      // No data parameter in URL
      console.error('No calculation data found in URL');
    }
  }, []);
  
  // Get calculator title based on type
  const getCalculatorTitle = (type: string) => {
    const titles: Record<string, string> = {
      'bond': 'Bond Repayment Calculator',
      'affordability': 'Affordability Calculator',
      'deposit': 'Deposit Savings Calculator',
      'additional': 'Additional Payment Calculator',
      'transfer': 'Transfer Costs Calculator',
      'amortisation': 'Amortization Schedule Calculator'
    };
    return titles[type] || 'Calculation Results';
  };
  
  // If no calculation data is found, show error message
  if (!calculationResult) {
    return (
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Calculation Not Found</CardTitle>
            <CardDescription>
              The shared calculation could not be loaded or may have expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please try again or create a new calculation.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/calculators')}>
              <Calculator className="mr-2 h-4 w-4" />
              Go to Calculators
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{getCalculatorTitle(calculationResult.type)}</CardTitle>
            <CardDescription>Shared calculation results</CardDescription>
          </div>
          <div className="flex gap-2">
            {calculationResult && (
              <>
                <EmailCalculationButton result={calculationResult} />
                <ShareCalculation result={calculationResult} />
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calculationResult.displayResults.map((item, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          
          {/* Display any additional data or charts */}
          {calculationResult.type === 'amortisation' && calculationResult.schedule && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Amortization Schedule</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Year</th>
                      <th className="px-4 py-2 text-right">Principal</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {calculationResult.schedule.map((entry: { year: string; principal: string; interest: string; balance: string }, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="px-4 py-2">{entry.year}</td>
                        <td className="px-4 py-2 text-right">{entry.principal}</td>
                        <td className="px-4 py-2 text-right">{entry.interest}</td>
                        <td className="px-4 py-2 text-right">{entry.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-6 bg-muted/20 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Need Help With Your Home Loan?</h3>
            <p className="text-muted-foreground mb-4">
              Our consultants can help you find the best home loan option tailored to your specific needs. Click the "Email Results" button above to receive these calculation results by email along with personalized advice from our consultants.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/calculators')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Calculators
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}