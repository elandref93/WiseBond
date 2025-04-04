import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell,
  ComposedChart,
} from "recharts";
import { formatCurrency } from "@/lib/calculators";

interface LoanComparisonSimulatorProps {
  initialLoanAmount: number;
  initialInterestRate: number;
  initialLoanTerm: number;
}

interface Rate {
  label: string;
  value: number;
  color: string;
}

interface TermResult {
  term: number;
  monthlyPayment: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  color: string;
}

interface DataPoint {
  name: string;
  monthlyPayment?: number;
  totalInterest?: number;
  color: string;
  rate: number;
}

const termColors = {
  10: "#10b981", // Shorter term - green (less interest)
  15: "#22c55e",
  20: "#6366f1", // Medium term - blue
  25: "#f59e0b",
  30: "#ef4444"  // Longer term - red (more interest)
};

export default function LoanComparisonSimulator({
  initialLoanAmount,
  initialInterestRate,
  initialLoanTerm,
}: LoanComparisonSimulatorProps) {
  // Common state
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTerm, setLoanTerm] = useState(initialLoanTerm);

  // Term-specific state
  const [selectedTerm, setSelectedTerm] = useState<number>(initialLoanTerm);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [paymentOverTime, setPaymentOverTime] = useState<any[]>([]);
  
  // Rate-specific state
  const rates: Rate[] = [
    { label: "Prime + 1%", value: 12.25, color: "#ef4444" },
    { label: "Prime + 0.5%", value: 11.75, color: "#f59e0b" },
    { label: "Prime", value: 11.25, color: "#6366f1" }, // Using blue to match term color
    { label: "Prime - 0.5%", value: 10.75, color: "#22c55e" },
    { label: "Prime - 1%", value: 10.25, color: "#10b981" },
  ];
  
  interface RateResults {
    monthlyPaymentData: DataPoint[];
    totalInterestData: DataPoint[];
  }
  
  const [selectedRateIndex, setSelectedRateIndex] = useState<number>(2); // Default to Prime
  const [rateResults, setRateResults] = useState<RateResults | null>(null);
  const [rateComparisonData, setRateComparisonData] = useState<any[]>([]);

  // Available terms
  const terms = [10, 15, 20, 25, 30]; // Loan terms in years
  
  // Calculate monthly payment based on term and rate
  const calculateMonthlyPayment = (principal: number, rate: number, termYears: number) => {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = termYears * 12;
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    return (principal * x * monthlyRate) / (x - 1);
  };
  
  // Calculate total interest based on term and rate
  const calculateTotalInterest = (principal: number, rate: number, termYears: number) => {
    const monthlyPayment = calculateMonthlyPayment(principal, rate, termYears);
    return (monthlyPayment * termYears * 12) - principal;
  };

  // Calculate remaining balance for a specific year
  const calculateRemainingBalance = (principal: number, rate: number, termYears: number, targetYear: number) => {
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = calculateMonthlyPayment(principal, rate, termYears);
    let balance = principal;
    
    for (let month = 1; month <= targetYear * 12; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      if (balance < 0) balance = 0;
    }
    
    return balance;
  };

  // Generate results for different terms (with the same interest rate)
  useEffect(() => {
    const results = terms.map(term => {
      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, term);
      const totalInterestPaid = calculateTotalInterest(loanAmount, interestRate, term);
      const totalAmountPaid = loanAmount + totalInterestPaid;
      
      return {
        term,
        monthlyPayment,
        totalInterestPaid,
        totalAmountPaid,
        color: termColors[term as keyof typeof termColors]
      };
    });
    
    setTermResults(results);
  }, [loanAmount, interestRate]);

  // Generate payment over time data for selected term
  useEffect(() => {
    if (!selectedTerm) return;
    
    const data = [];
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = selectedTerm * 12;
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, selectedTerm);
    
    let remainingPrincipal = loanAmount;
    
    // Generate yearly data points
    for (let year = 0; year <= selectedTerm; year++) {
      if (year === 0) {
        data.push({
          year,
          principal: loanAmount,
          term: selectedTerm
        });
        continue;
      }
      
      // Calculate remaining principal at this year
      for (let month = 1; month <= 12; month++) {
        if ((year - 1) * 12 + month > numberOfPayments) break;
        
        const interestForMonth = remainingPrincipal * monthlyRate;
        const principalForMonth = monthlyPayment - interestForMonth;
        remainingPrincipal -= principalForMonth;
        
        if (remainingPrincipal < 0) remainingPrincipal = 0;
      }
      
      data.push({
        year,
        principal: remainingPrincipal,
        term: selectedTerm
      });
    }
    
    setPaymentOverTime(data);
  }, [selectedTerm, loanAmount, interestRate]);

  // Generate results for different rates (with the same term)
  useEffect(() => {
    // Monthly payment comparison data
    const monthlyPaymentData = rates.map((rate) => {
      const payment = calculateMonthlyPayment(loanAmount, rate.value, loanTerm);
      return {
        name: rate.label,
        monthlyPayment: payment,
        color: rate.color,
        rate: rate.value,
      };
    });
    
    // Total interest comparison data
    const totalInterestData = rates.map((rate) => {
      const interest = calculateTotalInterest(loanAmount, rate.value, loanTerm);
      return {
        name: rate.label,
        totalInterest: interest,
        color: rate.color,
        rate: rate.value,
      };
    });
    
    setRateResults({ monthlyPaymentData, totalInterestData });
    
    // Generate amortization comparison for three rates: Prime+1, selected rate and best rate
    const selectedRate = rates[selectedRateIndex];
    const bestRate = rates[rates.length - 1]; // Prime - 1%
    const higherRate = rates[0]; // Prime + 1%
    
    const comparisonData = [];
    
    for (let year = 0; year <= loanTerm; year++) {
      // Calculate remaining balance at this year for all three rates
      const higherBalance = calculateRemainingBalance(
        loanAmount,
        higherRate.value,
        loanTerm,
        year
      );
      
      const selectedBalance = calculateRemainingBalance(
        loanAmount, 
        selectedRate.value, 
        loanTerm, 
        year
      );
      
      const bestBalance = calculateRemainingBalance(
        loanAmount,
        bestRate.value,
        loanTerm,
        year
      );
      
      comparisonData.push({
        year,
        [higherRate.label]: higherBalance,
        [selectedRate.label]: selectedBalance,
        [bestRate.label]: bestBalance,
        higherColor: higherRate.color,
        selectedColor: selectedRate.color,
        bestColor: bestRate.color,
      });
    }
    
    setRateComparisonData(comparisonData);
  }, [loanAmount, loanTerm, interestRate, selectedRateIndex]);

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };
  
  // Get selected term data
  const selectedTermData = termResults.find(result => result.term === selectedTerm);
  
  // Calculate potential savings
  const calculatePotentialSavings = () => {
    if (!rateResults?.totalInterestData) return 0;
    const selectedRate = rateResults.totalInterestData[selectedRateIndex];
    const bestRate = rateResults.totalInterestData[rateResults.totalInterestData.length - 1];
    return (selectedRate?.totalInterest || 0) - (bestRate?.totalInterest || 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interactive Loan Comparison & Term Simulator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Common Controls */}
          <div className="space-y-4">
            {/* Loan Amount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Loan Amount: {formatCurrency(loanAmount)}</span>
              </div>
              <Slider
                value={[loanAmount]}
                min={500000}
                max={10000000}
                step={100000}
                onValueChange={(value) => setLoanAmount(value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>R500,000</span>
                <span>R10,000,000</span>
              </div>
            </div>
            
            {/* Interest Rate & Term */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interest Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Interest Rate: {interestRate.toFixed(2)}%</span>
                </div>
                <Slider
                  value={[interestRate]}
                  min={5}
                  max={20}
                  step={0.25}
                  onValueChange={(value) => setInterestRate(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5%</span>
                  <span>20%</span>
                </div>
              </div>
              
              {/* Loan Term Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Loan Term: {loanTerm} years</span>
                </div>
                <Slider
                  value={[loanTerm]}
                  min={5}
                  max={30}
                  step={5}
                  onValueChange={(value) => {
                    setLoanTerm(value[0]);
                    setSelectedTerm(value[0]);
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 years</span>
                  <span>30 years</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs for Term vs Rate comparisons */}
          <Tabs defaultValue="term" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="term">Term Comparison</TabsTrigger>
              <TabsTrigger value="rate">Rate Comparison</TabsTrigger>
            </TabsList>
            
            {/* Term Comparison Tab */}
            <TabsContent value="term" className="space-y-8">
              {/* Term Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Select Loan Term to Compare</h3>
                <div className="grid grid-cols-5 gap-2">
                  {terms.map((term) => (
                    <button
                      key={term}
                      className={`p-2 rounded-md transition-colors ${
                        selectedTerm === term
                          ? "bg-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setSelectedTerm(term)}
                    >
                      {term} years
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Monthly Payment Comparison Chart */}
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-4">Monthly Payment Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={termResults}
                      margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="term"
                        tickFormatter={(value) => `${value} yrs`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="number"
                        tickFormatter={(value) => formatCurrency(value).toString()}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        formatter={(value: number) => formatTooltipValue(value)}
                        labelFormatter={(value: number) => `${value} Year Term`}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="monthlyPayment"
                        name="Monthly Payment"
                        radius={[5, 5, 0, 0]}
                        barSize={50}
                        label={{
                          position: "top",
                          formatter: (value: number) => formatCurrency(value).toString(),
                          fill: "#666",
                          fontSize: 12,
                          offset: 10
                        }}
                      >
                        {termResults.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Total Interest Comparison Chart */}
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-4">Total Interest Paid Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={termResults}
                      margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="term"
                        tickFormatter={(value) => `${value} yrs`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="number"
                        tickFormatter={(value) => formatCurrency(value).toString()}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        formatter={(value: number) => formatTooltipValue(value)}
                        labelFormatter={(value: number) => `${value} Year Term`}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="totalInterestPaid"
                        name="Total Interest"
                        radius={[5, 5, 0, 0]}
                        barSize={50}
                        label={{
                          position: "top",
                          formatter: (value: number) => formatCurrency(value).toString(),
                          fill: "#666",
                          fontSize: 12,
                          offset: 10
                        }}
                      >
                        {termResults.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Loan Balance Over Time for Selected Term */}
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-4">Loan Balance Over Time ({selectedTerm} years)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paymentOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'Years', position: 'insideBottomRight', offset: 0 }} 
                      />
                      <YAxis 
                        tickFormatter={(value: number) => formatCurrency(value).toString()}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatTooltipValue(value)}
                        labelFormatter={(value: number) => `Year ${value}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="principal"
                        name="Remaining Principal"
                        stroke={selectedTermData?.color || "#4f46e5"}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Term Summary Card */}
              {selectedTermData && (
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h3 className="font-medium mb-2">Loan Term Analysis - {selectedTerm} Year Term</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Loan Amount</p>
                      <p className="font-medium">{formatCurrency(loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Interest Rate</p>
                      <p className="font-medium">{interestRate.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly Payment</p>
                      <p className="font-medium">{formatCurrency(selectedTermData.monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Interest Paid</p>
                      <p className="font-medium">{formatCurrency(selectedTermData.totalInterestPaid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount Paid</p>
                      <p className="font-medium">{formatCurrency(selectedTermData.totalAmountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Interest as % of Loan</p>
                      <p className="font-medium">
                        {((selectedTermData.totalInterestPaid / loanAmount) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Rate Comparison Tab */}
            <TabsContent value="rate" className="space-y-8">
              {/* Rate Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Interest Rate Comparison</h3>
                <div className="grid grid-cols-5 gap-2">
                  {rates.map((rate, index) => (
                    <button
                      key={rate.label}
                      className={`p-2 rounded-md transition-colors ${
                        selectedRateIndex === index
                          ? "bg-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setSelectedRateIndex(index)}
                      style={{
                        borderLeft: `4px solid ${rate.color}`
                      }}
                    >
                      {rate.label}<br/>
                      <span className="text-xs">{rate.value}%</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Monthly Payment Comparison Chart */}
              {rateResults?.monthlyPaymentData && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-4">Monthly Repayment by Interest Rate ({loanTerm} years)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={rateResults.monthlyPaymentData}
                        margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="number" 
                          tickFormatter={(value) => formatCurrency(value).toString()} 
                          axisLine={false}
                          tickLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(Number(value))}
                          labelFormatter={(value: string) => `${value} (${rateResults.monthlyPaymentData.find(d => d.name === value)?.rate}%)`}
                          cursor={{fill: 'transparent'}}
                        />
                        <Bar 
                          dataKey="monthlyPayment" 
                          name="Monthly Repayment"
                          radius={[5, 5, 0, 0]}
                          barSize={50}
                          label={{
                            position: 'top',
                            formatter: (value: number) => formatCurrency(value).toString(),
                            fill: '#666',
                            fontSize: 12,
                            offset: 10
                          }}
                        >
                          {rateResults.monthlyPaymentData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* Total Interest Comparison Chart */}
              {rateResults?.totalInterestData && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-4">Total Interest by Interest Rate ({loanTerm} years)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={rateResults.totalInterestData}
                        margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="number" 
                          tickFormatter={(value) => formatCurrency(value).toString()} 
                          axisLine={false}
                          tickLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(Number(value))}
                          labelFormatter={(value: string) => `${value} (${rateResults.totalInterestData.find(d => d.name === value)?.rate}%)`}
                          cursor={{fill: 'transparent'}}
                        />
                        <Bar 
                          dataKey="totalInterest" 
                          name="Total Interest"
                          radius={[5, 5, 0, 0]}
                          barSize={50}
                          label={{
                            position: 'top',
                            formatter: (value: number) => formatCurrency(value).toString(),
                            fill: '#666',
                            fontSize: 12,
                            offset: 10
                          }}
                        >
                          {rateResults.totalInterestData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* Loan Balance Comparison Chart */}
              {rateComparisonData.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-4">Loan Balance Comparison Over Time</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rateComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: 0 }} />
                        <YAxis tickFormatter={(value: number) => formatCurrency(value).toString()} />
                        <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Prime + 1%" 
                          stroke={rateComparisonData[0]?.higherColor || "#ef4444"} 
                          strokeWidth={2} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey={rates[selectedRateIndex].label} 
                          stroke={rateComparisonData[0]?.selectedColor || "#4f46e5"} 
                          strokeWidth={2} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Prime - 1%" 
                          stroke={rateComparisonData[0]?.bestColor || "#10b981"} 
                          strokeWidth={2} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* Rate Summary Card */}
              {rateResults?.monthlyPaymentData && (
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h3 className="font-medium mb-2">Potential Interest Rate Savings</h3>
                  <p className="text-sm text-gray-700">
                    By securing a rate of <span className="font-medium">Prime - 1%</span> instead of 
                    <span className="font-medium"> {rates[selectedRateIndex].label}</span>, you could save approximately 
                    <span className="font-medium text-green-600"> {formatCurrency(calculatePotentialSavings())}</span> in
                    total interest over the {loanTerm}-year loan term.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Key Takeaways */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Key Insights</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
              <li>
                <span className="font-medium">Term Impact:</span> Shorter loan terms typically result in higher monthly payments but significantly less total interest paid.
              </li>
              <li>
                <span className="font-medium">Rate Impact:</span> Even a 0.5% difference in interest rate can lead to substantial savings over the life of your loan.
              </li>
              <li>
                <span className="font-medium">Balance Point:</span> Find the term and rate combination that balances affordable monthly payments with reasonable total interest costs.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}