import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BondRepaymentCalculator from "@/components/calculators/BondRepaymentCalculator";
import AffordabilityCalculator from "@/components/calculators/AffordabilityCalculator";
import DepositSavingsCalculator from "@/components/calculators/DepositSavingsCalculator";
import BondsTransferCostsCalculator from "@/components/calculators/BondsTransferCostsCalculator";
import AdditionalPaymentCalculator from "@/components/calculators/AdditionalPaymentCalculator";
import AmortizationCalculator from "@/components/calculators/AmortizationCalculator";
import LoanComparisonSimulator from "@/components/calculators/LoanComparisonSimulator";
import AdditionalPaymentChart from "@/components/calculators/charts/AdditionalPaymentChart";
import CalculationResults from "@/components/calculators/CalculationResults";
import PrimeRateIndicator from "@/components/calculators/PrimeRateIndicator";
import { CalculationResult } from "@/lib/calculators";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HomeIcon, CreditCardIcon, CalendarIcon, BadgeIcon, BarChart4Icon, CalculatorIcon, InfoIcon, TrendingUpIcon, ClockIcon, LineChartIcon } from "lucide-react";

export default function Calculators() {
  // Check if tab is specified in URL
  const queryParams = new URLSearchParams(window.location.search);
  const tabParam = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam || "bond");
  const [calculationResults, setCalculationResults] = useState<CalculationResult | null>(null);
  const [formValues, setFormValues] = useState<any>(null);
  const { user } = useAuth();

  // Fetch user's saved calculations if logged in
  const { data: savedCalculations = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/calculations'],
    enabled: !!user, // Only run query if user is logged in
  });

  const handleCalculationComplete = (results: CalculationResult, values?: any) => {
    setCalculationResults(results);
    if (values) {
      setFormValues(values);
    }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Our Financial Calculators
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Bond Repayment Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <HomeIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Repayments calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      See what your total monthly repayment amount would be on your new home.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("bond");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {/* Affordability Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <BadgeIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Affordability calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Find out how much you can afford to spend on your new home, based on your income and expenses.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("affordability");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {/* Bonds and Transfer Costs Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <CreditCardIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bonds and transfer costs calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Calculate the total bond registration and property transfer costs on your new home.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("transfer");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {/* Additional Payment Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <BarChart4Icon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Additional payment calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Calculate how much you can save, in terms of both time and money, by paying a little extra into your bond.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("additional");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {/* Deposit & Savings Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <CalendarIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Deposit & savings costs calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Calculate how much you need to save, and for how long, to put together a deposit on your dream home.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("deposit");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {/* Amortisation Calculator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <CalculatorIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Amortisations calculator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Understand how your home loan repayments are structured in terms of paying off capital and interest.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("amortisation");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>
            
            {/* Loan Comparison Simulator */}
            <Card className="overflow-hidden border-gray-200 hover:border-primary hover:shadow-md transition-all h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4 flex-grow">
                  <LineChartIcon className="w-10 h-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Loan comparison simulator
                    </h3>
                    <p className="text-sm text-gray-500">
                      Compare different loan terms and interest rates to see their impact on payments and total cost.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-auto"
                  onClick={() => {
                    setActiveTab("comparison");
                    window.location.href = "#calculator-detail";
                  }}
                >
                  Compare
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Calculator Detail Section */}
          <div id="calculator-detail" className="mt-16 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="bg-gray-100 rounded-lg p-2 mb-8">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 py-2">
                    <h3 className="text-lg font-semibold mb-2 md:mb-0">Choose a calculator</h3>
                    <PrimeRateIndicator />
                  </div>
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-transparent p-0">
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="bond">Repayments</TabsTrigger>
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="affordability">Affordability</TabsTrigger>
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="transfer">Transfer Costs</TabsTrigger>
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="additional">Additional Payment</TabsTrigger>
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="deposit">Deposit Savings</TabsTrigger>
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="amortisation">Amortisation</TabsTrigger>
                    <TabsTrigger className="px-4 py-2 rounded-md border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:shadow-md" value="comparison">Loan Comparison</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="bond">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full">
                      <BondRepaymentCalculator onCalculate={handleCalculationComplete} />
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

                <TabsContent value="transfer">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <BondsTransferCostsCalculator onCalculate={handleCalculationComplete} />
                    </div>
                    <div className="md:col-span-2">
                      {calculationResults && calculationResults.type === 'transfer' ? (
                        <CalculationResults results={calculationResults} />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Calculate Transfer and Bond Costs
                            </h3>
                            <p className="text-gray-500">
                              Calculate all the registration, transfer, and legal fees
                              that come with buying a property in South Africa.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional">
                  {calculationResults && calculationResults.type === 'additional' ? (
                    <div className="flex flex-col space-y-6 sm:space-y-8">
                      {/* Top section: Calculator form and basic results side by side */}
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-1">
                          <AdditionalPaymentCalculator onCalculate={handleCalculationComplete} />
                        </div>
                        <div className="lg:col-span-2">
                          <CalculationResults results={calculationResults} formValues={formValues} />
                        </div>
                      </div>
                      
                      {/* Bottom section: Full-width chart area */}
                      <div className="w-full bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                        <AdditionalPaymentChart 
                          loanAmount={calculationResults.loanAmount}
                          interestRate={calculationResults.interestRate}
                          loanTerm={calculationResults.loanTermYears}
                          additionalPayment={calculationResults.additionalPayment}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                      <div className="lg:col-span-1">
                        <AdditionalPaymentCalculator onCalculate={handleCalculationComplete} />
                      </div>
                      <div className="lg:col-span-2">
                        <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-50 rounded-lg p-6 sm:p-8">
                          <div className="text-center">
                            <h3 className="text-base font-medium text-gray-900 mb-2 sm:text-lg">
                              Calculate Additional Payment Benefits
                            </h3>
                            <p className="text-sm text-gray-500 sm:text-base">
                              See how making additional payments on your bond can
                              save you time and money over the loan term.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="amortisation">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-span-1">
                      <AmortizationCalculator onCalculate={handleCalculationComplete} />
                    </div>
                    <div className="lg:col-span-2">
                      {calculationResults && calculationResults.type === 'amortisation' ? (
                        <CalculationResults results={calculationResults} formValues={formValues} />
                      ) : (
                        <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-50 rounded-lg p-6 sm:p-8">
                          <div className="text-center">
                            <h3 className="text-base font-medium text-gray-900 mb-2 sm:text-lg">
                              Understand Your Loan Amortisation
                            </h3>
                            <p className="text-sm text-gray-500 sm:text-base">
                              See how your loan payments break down between principal and
                              interest over the life of your loan.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comparison">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white mr-0 sm:mr-4 mb-2 sm:mb-0 self-center sm:self-auto">
                        <LineChartIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base leading-6 font-medium text-gray-900 text-center sm:text-left sm:text-lg">
                        Interactive Loan Comparison Simulator
                      </h3>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex">
                        <InfoIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-blue-700">
                          This comprehensive interactive tool allows you to compare both different interest rates and loan terms. Use the tabs to toggle between term and rate comparisons. Adjust the loan amount, interest rate, and term using the sliders to see the impact on your loan costs in real-time with detailed visualizations.
                        </div>
                      </div>
                    </div>

                    <LoanComparisonSimulator 
                      initialLoanAmount={1500000} 
                      initialInterestRate={11.25} 
                      initialLoanTerm={20} 
                    />
                    
                    <div className="mt-6 sm:mt-8 bg-gray-50 p-4 sm:p-6 rounded-lg">
                      <h3 className="text-base font-medium mb-3 sm:text-lg sm:mb-4">Understanding Interest Rates in South Africa</h3>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 sm:mb-4">
                        <PrimeRateIndicator />
                      </div>
                      <p className="text-sm text-gray-600 mb-3 sm:text-base sm:mb-4">
                        Home loan interest rates in South Africa are typically expressed in relation to the prime rate, which is the benchmark rate that banks use to determine interest rates for loans.
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4 sm:mt-6">
                        <div className="border rounded-lg p-3 sm:p-4 bg-white">
                          <h4 className="text-sm font-medium mb-2 sm:text-base">Factors Affecting Your Rate</h4>
                          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 sm:text-sm">
                            <li>Credit score and history</li>
                            <li>Loan-to-value ratio (size of your deposit)</li>
                            <li>Employment stability and income</li>
                            <li>Existing relationship with the bank</li>
                            <li>Property value and type</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3 sm:p-4 bg-white">
                          <h4 className="text-sm font-medium mb-2 sm:text-base">Tips to Secure a Better Rate</h4>
                          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 sm:text-sm">
                            <li>Improve your credit score before applying</li>
                            <li>Save for a larger deposit (aim for 10-20%)</li>
                            <li>Compare offers from multiple banks</li>
                            <li>Consider using a bond originator (like us!)</li>
                            <li>Look into special programs for first-time buyers</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Calculations Section - Mobile-optimized */}
      {user && (
        <div className="py-8 px-4 sm:py-12 md:py-16 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-2 sm:text-2xl md:text-3xl">
                Your Saved Calculations
              </h2>
              <p className="text-sm text-gray-600 sm:text-base">
                Access your previous calculations and track your home loan planning progress
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-600">Loading saved calculations...</span>
                </div>
              </div>
            ) : Array.isArray(savedCalculations) && savedCalculations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {/* Process calculations to avoid duplicates */}
                {(() => {
                  // Create a map to track unique calculations by type and result signature
                  const uniqueCalculations = new Map();
                  
                  // Process all calculations to find the most recent unique ones
                  savedCalculations.forEach((calc: any) => {
                    const calcType = calc.calculationType;
                    const resultSignature = calc.resultData; // Use the full result as the signature
                    
                    const key = `${calcType}-${resultSignature}`;
                    
                    // If we haven't seen this calculation or this one is newer, keep it
                    if (!uniqueCalculations.has(key) || 
                        new Date(calc.createdAt) > new Date(uniqueCalculations.get(key).createdAt)) {
                      uniqueCalculations.set(key, calc);
                    }
                  });
                  
                  // Get all unique calculations and sort by date (newest first)
                  const filteredCalculations = Array.from(uniqueCalculations.values())
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 6); // Show only the 6 most recent unique calculations
                  
                  // Return the mapped components
                  return filteredCalculations.map((calc: any, index: number) => {
                    const parsedResult = JSON.parse(calc.resultData);
                    const parsedInput = JSON.parse(calc.inputData);
                    
                    return (
                      <Card key={index} className="h-full flex flex-col border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base sm:text-lg">
                            {calc.calculationType === 'bond' && 'Bond Repayment'}
                            {calc.calculationType === 'affordability' && 'Affordability'}
                            {calc.calculationType === 'deposit' && 'Deposit Savings'}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Saved on {new Date(calc.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="space-y-2">
                            {parsedResult.displayResults && 
                              parsedResult.displayResults.map((result: any, i: number) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 sm:text-sm">{result.label}:</span>
                                  <span className="text-xs font-medium sm:text-sm">{result.value}</span>
                                </div>
                              ))
                            }
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
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

      {/* Calculator Guides - Mobile-optimized */}
      <div className="py-8 px-4 sm:py-12 md:py-16 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2 sm:text-2xl md:text-3xl">
              Understanding Our Calculators
            </h2>
            <p className="text-sm text-gray-600 sm:text-base">
              Detailed guides to help you make the most of each calculator
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {activeTab === "bond" && (
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-3 sm:text-lg">
                  Bond Repayment Calculator
                </h3>
                <p className="text-sm text-gray-500 mb-4 sm:text-base">
                  Calculate your monthly bond repayments based on the property value,
                  interest rate, loan term, and deposit amount. This helps you plan
                  your budget and understand the total cost of your loan.
                </p>
                <Separator className="my-3 sm:my-4" />
                <h4 className="text-sm font-medium text-gray-900 mt-3 mb-2 sm:text-base sm:mt-4">What you'll need:</h4>
                <ul className="list-disc pl-4 sm:pl-5 text-xs text-gray-500 space-y-1 sm:text-sm">
                  <li>Property value</li>
                  <li>Interest rate (current prime rate is approximately 11.25%)</li>
                  <li>Loan term (typically 20-30 years)</li>
                  <li>Deposit amount (if any)</li>
                </ul>
              </div>
            )}
            
            {activeTab === "affordability" && (
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-3 sm:text-lg">
                  Affordability Calculator
                </h3>
                <p className="text-sm text-gray-500 mb-4 sm:text-base">
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
            )}
            
            {activeTab === "deposit" && (
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
            )}
            
            {activeTab === "comparison" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Loan Comparison Simulator
                </h3>
                <p className="text-gray-500 mb-4">
                  Compare the impact of different loan terms and interest rates on your monthly 
                  payments and total costs. This interactive simulator helps you understand how 
                  various lending scenarios affect your financial commitments.
                </p>
                <Separator className="my-4" />
                <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll explore:</h4>
                <ul className="list-disc pl-5 text-gray-500 space-y-1">
                  <li>Compare loan terms from 10 to 30 years</li>
                  <li>See how different interest rates affect payments</li>
                  <li>Visualize total interest paid across scenarios</li>
                  <li>Understand monthly payment differences</li>
                  <li>Make informed decisions on loan structure</li>
                </ul>
              </div>
            )}
            
            {activeTab === "transfer" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Bonds and Transfer Costs Calculator
                </h3>
                <p className="text-gray-500 mb-4">
                  Calculate the total bond registration and property transfer costs on your new home.
                  Understanding these additional expenses is essential for proper budgeting when purchasing property.
                </p>
                <Separator className="my-4" />
                <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll need:</h4>
                <ul className="list-disc pl-5 text-gray-500 space-y-1">
                  <li>Purchase price of the property</li>
                  <li>Loan amount (if applying for a bond)</li>
                  <li>Whether you're a first-time buyer</li>
                </ul>
              </div>
            )}
            
            {activeTab === "additional" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Additional Payment Calculator
                </h3>
                <p className="text-gray-500 mb-4">
                  Calculate how making additional payments on your home loan can save you money and time.
                  See the impact of extra payments on your loan term and total interest paid.
                </p>
                <Separator className="my-4" />
                <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll need:</h4>
                <ul className="list-disc pl-5 text-gray-500 space-y-1">
                  <li>Original loan amount</li>
                  <li>Current interest rate</li>
                  <li>Original loan term</li>
                  <li>Additional monthly or annual payment amount</li>
                </ul>
              </div>
            )}
            
            {activeTab === "amortisation" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Amortisation Calculator
                </h3>
                <p className="text-gray-500 mb-4">
                  Understand how your home loan repayments are structured in terms of paying off capital and interest 
                  over time. See a detailed breakdown of your loan amortization schedule.
                </p>
                <Separator className="my-4" />
                <h4 className="font-medium text-gray-900 mt-4 mb-2">What you'll need:</h4>
                <ul className="list-disc pl-5 text-gray-500 space-y-1">
                  <li>Loan amount</li>
                  <li>Interest rate</li>
                  <li>Loan term</li>
                  <li>Payment frequency (monthly, bi-weekly, etc.)</li>
                </ul>
              </div>
            )}
            
            {/* Add an image or illustration related to the calculator */}
            <div className="hidden md:block">
              <div className="bg-gray-50 p-6 rounded-lg h-full flex items-center justify-center">
                {activeTab === "bond" && (
                  <div className="text-center">
                    <HomeIcon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your Home, Your Terms</h3>
                    <p className="text-gray-500">Find the perfect bond repayment structure for your dream home.</p>
                  </div>
                )}
                {activeTab === "affordability" && (
                  <div className="text-center">
                    <BadgeIcon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Know Your Limits</h3>
                    <p className="text-gray-500">Understand exactly what you can afford before you start house hunting.</p>
                  </div>
                )}
                {activeTab === "deposit" && (
                  <div className="text-center">
                    <CalendarIcon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Saving For Tomorrow</h3>
                    <p className="text-gray-500">Plan your deposit savings journey with realistic timelines.</p>
                  </div>
                )}
                {activeTab === "transfer" && (
                  <div className="text-center">
                    <CreditCardIcon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Hidden Costs Revealed</h3>
                    <p className="text-gray-500">Be prepared for all the costs associated with buying your property.</p>
                  </div>
                )}
                {activeTab === "additional" && (
                  <div className="text-center">
                    <BarChart4Icon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Pay Less, Finish Faster</h3>
                    <p className="text-gray-500">See how small additional payments can make a big difference.</p>
                  </div>
                )}
                {activeTab === "amortisation" && (
                  <div className="text-center">
                    <CalculatorIcon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Track Every Rand</h3>
                    <p className="text-gray-500">Understand exactly where your money goes throughout your loan term.</p>
                  </div>
                )}
                {activeTab === "comparison" && (
                  <div className="text-center">
                    <LineChartIcon className="h-20 w-20 text-primary/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Compare & Choose</h3>
                    <p className="text-gray-500">See different loan options side by side to make the best choice.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
