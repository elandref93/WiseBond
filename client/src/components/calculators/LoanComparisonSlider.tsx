import { useState } from "react";
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
  LineChart,
  Line,
  Cell, // Import Cell component
} from "recharts";
import { formatCurrency } from "@/lib/calculators";

interface LoanComparisonSliderProps {
  initialLoanAmount: number;
  initialInterestRate: number;
  initialLoanTerm: number;
}

interface Rate {
  label: string;
  value: number;
  color: string;
}

interface DataPoint {
  name: string;
  monthlyPayment?: number;
  totalInterest?: number;
  color: string;
  rate: number;
}

export default function LoanComparisonSlider({
  initialLoanAmount,
  initialInterestRate,
  initialLoanTerm,
}: LoanComparisonSliderProps) {
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTerm, setLoanTerm] = useState(initialLoanTerm);
  
  // South African banks and typical rates (current prime rate is around 11.25%)
  const rates: Rate[] = [
    { label: "Prime", value: 11.25, color: "#4f46e5" },
    { label: "Prime - 0.5%", value: 10.75, color: "#06b6d4" },
    { label: "Prime - 1%", value: 10.25, color: "#10b981" },
    { label: "Prime + 0.5%", value: 11.75, color: "#f59e0b" },
    { label: "Prime + 1%", value: 12.25, color: "#ef4444" },
  ];
  
  // Calculate monthly payment for a given interest rate
  const calculateMonthlyPayment = (rate: number) => {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    return (loanAmount * x * monthlyRate) / (x - 1);
  };
  
  // Calculate total interest for a given interest rate
  const calculateTotalInterest = (rate: number) => {
    const monthlyPayment = calculateMonthlyPayment(rate);
    return (monthlyPayment * loanTerm * 12) - loanAmount;
  };

  // Calculate monthly and total payments for all rates
  const calculateAllPayments = () => {
    return rates.map((rate) => {
      const monthlyPayment = calculateMonthlyPayment(rate.value);
      const totalInterest = calculateTotalInterest(rate.value);
      const totalPayment = loanAmount + totalInterest;
      
      return {
        label: rate.label,
        rate: rate.value,
        monthlyPayment: monthlyPayment,
        totalInterest: totalInterest,
        totalPayment: totalPayment,
        color: rate.color,
      };
    });
  };
  
  // Monthly payment comparison data
  const monthlyPaymentData: DataPoint[] = calculateAllPayments().map((item) => ({
    name: item.label,
    monthlyPayment: item.monthlyPayment,
    color: item.color,
    rate: item.rate,
  }));
  
  // Total interest comparison data
  const totalInterestData: DataPoint[] = calculateAllPayments().map((item) => ({
    name: item.label,
    totalInterest: item.totalInterest,
    color: item.color,
    rate: item.rate,
  }));
  
  // Generate amortization schedule for two rates (default and best)
  const generateComparisonData = () => {
    const defaultRate = rates[0]; // Prime
    const bestRate = rates[2]; // Prime - 1%
    
    const result = [];
    
    for (let year = 1; year <= loanTerm; year++) {
      // Calculate remaining balance at this year for both rates
      const defaultBalance = calculateRemainingBalance(defaultRate.value, year);
      const bestBalance = calculateRemainingBalance(bestRate.value, year);
      
      result.push({
        year,
        [defaultRate.label]: defaultBalance,
        [bestRate.label]: bestBalance,
        defaultColor: defaultRate.color,
        bestColor: bestRate.color,
      });
    }
    
    return result;
  };
  
  // Calculate remaining balance at a specific year
  const calculateRemainingBalance = (rate: number, targetYear: number) => {
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = calculateMonthlyPayment(rate);
    let balance = loanAmount;
    
    for (let month = 1; month <= targetYear * 12; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      if (balance < 0) balance = 0;
    }
    
    return balance;
  };
  
  const amortizationData = generateComparisonData();
  
  // Custom tooltip for bar charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label} ({payload[0].payload.rate}%)</p>
          <p>
            {payload[0].name === "monthlyPayment" 
              ? `Monthly Payment: ${formatCurrency(payload[0].value)}`
              : `Total Interest: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interactive Loan Comparison</CardTitle>
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
              max={5000000}
              step={50000}
              onValueChange={(value) => setLoanAmount(value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>R500,000</span>
              <span>R5,000,000</span>
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
              onValueChange={(value) => setLoanTerm(value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 years</span>
              <span>30 years</span>
            </div>
          </div>
          
          {/* Monthly Payment Comparison */}
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-4">Monthly Repayment Comparison (Rands)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPaymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    type="number" 
                    tickFormatter={(value) => formatCurrency(value).toString()} 
                    label={{ 
                      value: 'Monthly Repayment (R)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 5,
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(value) => `${value} (${monthlyPaymentData.find(d => d.name === value)?.rate}%)`}
                  />
                  <Bar 
                    dataKey="monthlyPayment" 
                    name="Monthly Repayment"
                  >
                    {monthlyPaymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Total Interest Comparison */}
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-4">Total Interest Comparison (Rands)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalInterestData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    type="number" 
                    tickFormatter={(value) => formatCurrency(value).toString()} 
                    label={{ 
                      value: 'Total Interest (R)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 5,
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(value) => `${value} (${totalInterestData.find(d => d.name === value)?.rate}%)`}
                  />
                  <Bar 
                    dataKey="totalInterest" 
                    name="Total Interest"
                  >
                    {totalInterestData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Amortization Comparison */}
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-4">Loan Balance Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={amortizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: 0 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value).toString()} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Prime" 
                    stroke={amortizationData[0]?.defaultColor || "#4f46e5"} 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Prime - 1%" 
                    stroke={amortizationData[0]?.bestColor || "#10b981"} 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary Card */}
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <h3 className="font-medium mb-2">Potential Savings</h3>
            <p className="text-sm text-gray-700">
              By securing a rate of <span className="font-medium">Prime - 1%</span> instead of 
              <span className="font-medium"> Prime</span>, you could save approximately 
              <span className="font-medium text-green-600"> {formatCurrency(calculateTotalInterest(11.25) - calculateTotalInterest(10.25))}</span> in
              total interest over the life of your loan.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}