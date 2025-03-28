import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BondRepaymentCalculator from "@/components/calculators/BondRepaymentCalculator";
import AffordabilityCalculator from "@/components/calculators/AffordabilityCalculator";
import DepositSavingsCalculator from "@/components/calculators/DepositSavingsCalculator";
import CalculationResults from "@/components/calculators/CalculationResults";
import { CalculationResult } from "@/lib/calculators";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Calculators() {
  const [activeTab, setActiveTab] = useState("bond");
  const [calculationResults, setCalculationResults] = useState<CalculationResult | null>(null);
  const { user } = useAuth();

  // Fetch user's saved calculations if logged in
  const { data: savedCalculations, isLoading } = useQuery({
    queryKey: ['/api/calculations'],
    enabled: !!user, // Only run query if user is logged in
  });

  const handleCalculationComplete = (results: CalculationResult) => {
    setCalculationResults(results);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Financial Calculators
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Use our calculators to help plan your home financing journey. Save and
            compare different scenarios to make informed decisions.
          </p>
        </div>
      </div>

      {/* Calculators Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <Tabs defaultValue="bond" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="bond">Bond Repayment</TabsTrigger>
                  <TabsTrigger value="affordability">Affordability</TabsTrigger>
                  <TabsTrigger value="deposit">Deposit Savings</TabsTrigger>
                </TabsList>

                <TabsContent value="bond">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <BondRepaymentCalculator onCalculate={handleCalculationComplete} />
                    </div>
                    <div className="md:col-span-2">
                      {calculationResults && calculationResults.type === 'bond' ? (
                        <CalculationResults results={calculationResults} />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Calculate Your Bond Repayments
                            </h3>
                            <p className="text-gray-500">
                              Fill in the form to see your estimated monthly
                              repayments and total interest over the loan term.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="affordability">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <AffordabilityCalculator onCalculate={handleCalculationComplete} />
                    </div>
                    <div className="md:col-span-2">
                      {calculationResults && calculationResults.type === 'affordability' ? (
                        <CalculationResults results={calculationResults} />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Check What You Can Afford
                            </h3>
                            <p className="text-gray-500">
                              Enter your income and expenses to find out how much
                              you could potentially borrow for a home loan.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="deposit">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <DepositSavingsCalculator onCalculate={handleCalculationComplete} />
                    </div>
                    <div className="md:col-span-2">
                      {calculationResults && calculationResults.type === 'deposit' ? (
                        <CalculationResults results={calculationResults} />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Plan Your Deposit Savings
                            </h3>
                            <p className="text-gray-500">
                              Find out how long it will take to save your home
                              deposit based on your target property price and
                              monthly savings.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Calculations Section */}
      {user && (
        <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Saved Calculations
            </h2>

            {isLoading ? (
              <div className="text-center py-8">Loading saved calculations...</div>
            ) : savedCalculations && savedCalculations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedCalculations.map((calc: any, index: number) => {
                  const parsedResult = JSON.parse(calc.resultData);
                  const parsedInput = JSON.parse(calc.inputData);
                  
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>
                          {calc.calculationType === 'bond' && 'Bond Repayment'}
                          {calc.calculationType === 'affordability' && 'Affordability'}
                          {calc.calculationType === 'deposit' && 'Deposit Savings'}
                        </CardTitle>
                        <CardDescription>
                          Saved on {new Date(calc.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {parsedResult.displayResults && 
                            parsedResult.displayResults.map((result: any, i: number) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-gray-500">{result.label}:</span>
                                <span className="font-medium">{result.value}</span>
                              </div>
                            ))
                          }
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>No saved calculations</AlertTitle>
                <AlertDescription>
                  When you perform calculations while logged in, they'll be saved here for future reference.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Calculator Guides */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Understanding Our Calculators
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Bond Repayment Calculator
              </h3>
              <p className="text-gray-500 mb-4">
                Calculate your monthly bond repayments based on the property value,
                interest rate, loan term, and deposit amount. This helps you plan
                your budget and understand the total cost of your loan.
              </p>
              <Separator className="my-4" />
              <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll need:</h4>
              <ul className="list-disc pl-5 text-gray-500 space-y-1">
                <li>Property value</li>
                <li>Interest rate (current prime rate is approximately 11.25%)</li>
                <li>Loan term (typically 20-30 years)</li>
                <li>Deposit amount (if any)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Affordability Calculator
              </h3>
              <p className="text-gray-500 mb-4">
                Determine how much you can afford to borrow based on your income,
                expenses, and existing debt. This calculator helps you set realistic
                expectations when house-hunting.
              </p>
              <Separator className="my-4" />
              <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll need:</h4>
              <ul className="list-disc pl-5 text-gray-500 space-y-1">
                <li>Gross monthly income</li>
                <li>Monthly expenses</li>
                <li>Existing debt repayments</li>
                <li>Current interest rate</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Deposit Savings Calculator
              </h3>
              <p className="text-gray-500 mb-4">
                Calculate how long it will take to save for your home deposit based
                on your target property price, deposit percentage, and monthly
                savings amount.
              </p>
              <Separator className="my-4" />
              <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll need:</h4>
              <ul className="list-disc pl-5 text-gray-500 space-y-1">
                <li>Target property price</li>
                <li>Desired deposit percentage</li>
                <li>Monthly amount you can save</li>
                <li>Expected interest rate on savings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
