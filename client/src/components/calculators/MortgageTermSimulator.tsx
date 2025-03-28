import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line
} from "recharts";
import { formatCurrency } from "@/lib/calculators";

interface MortgageTermSimulatorProps {
  initialLoanAmount: number;
  initialInterestRate: number;
}

interface SimulationResult {
  term: number;
  monthlyPayment: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  color: string;
}

const termColors = {
  10: "#10b981", // Shorter term - green (less interest)
  15: "#22c55e",
  20: "#6366f1", // Medium term - blue
  25: "#f59e0b",
  30: "#ef4444"  // Longer term - red (more interest)
};

export default function MortgageTermSimulator({
  initialLoanAmount,
  initialInterestRate,
}: MortgageTermSimulatorProps) {
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [paymentOverTime, setPaymentOverTime] = useState<any[]>([]);

  const terms = [10, 15, 20, 25, 30]; // Loan terms in years
  
  // Calculate monthly payment for a given loan term
  const calculateMonthlyPayment = (term: number) => {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = term * 12;
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    return (loanAmount * x * monthlyRate) / (x - 1);
  };
  
  // Calculate total interest paid for a given loan term
  const calculateTotalInterestPaid = (term: number) => {
    const monthlyPayment = calculateMonthlyPayment(term);
    return (monthlyPayment * term * 12) - loanAmount;
  };
  
  // Generate simulation results for all terms
  useEffect(() => {
    const results = terms.map(term => {
      const monthlyPayment = calculateMonthlyPayment(term);
      const totalInterestPaid = calculateTotalInterestPaid(term);
      const totalAmountPaid = loanAmount + totalInterestPaid;
      
      return {
        term,
        monthlyPayment,
        totalInterestPaid,
        totalAmountPaid,
        color: termColors[term as keyof typeof termColors]
      };
    });
    
    setSimulationResults(results);
    
    // Select the middle term by default if none is selected
    if (selectedTerm === null) {
      setSelectedTerm(20);
    }
  }, [loanAmount, interestRate, selectedTerm]);
  
  // Generate payment over time data for selected term
  useEffect(() => {
    if (selectedTerm === null) return;
    
    const data = [];
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = selectedTerm * 12;
    const monthlyPayment = calculateMonthlyPayment(selectedTerm);
    
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
  
  // Format tooltip value
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };
  
  // Get selected term data
  const selectedTermData = simulationResults.find(result => result.term === selectedTerm);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mortgage Term Impact Simulator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
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
          
          {/* Term Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Loan Term</h3>
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
          
          {/* Term Comparison Chart - Monthly Payments */}
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-4">Monthly Payment Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={simulationResults}
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
                    hide
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
                    {simulationResults.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Term Comparison Chart - Total Interest */}
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-4">Total Interest Paid Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={simulationResults}
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
                    hide
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
                    {simulationResults.map((entry, index) => (
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
          
          {/* Summary Card */}
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
        </div>
      </CardContent>
    </Card>
  );
}