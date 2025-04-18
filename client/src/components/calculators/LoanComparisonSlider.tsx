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
    { label: "Prime + 1%", value: 12.25, color: "#ef4444" },
    { label: "Prime + 0.5%", value: 11.75, color: "#f59e0b" },
    { label: "Prime", value: 11.25, color: "#4f46e5" },
    { label: "Prime - 0.5%", value: 10.75, color: "#06b6d4" },
    { label: "Prime - 1%", value: 10.25, color: "#10b981" },
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
  
  // Generate amortization schedule for three rates (higher, default and best)
  const generateComparisonData = () => {
    const higherRate = rates[0]; // Prime + 1%
    const defaultRate = rates[2]; // Prime
    const bestRate = rates[4]; // Prime - 1%
    
    const result = [];
    
    for (let year = 1; year <= loanTerm; year++) {
      // Calculate remaining balance at this year for all three rates
      const higherBalance = calculateRemainingBalance(higherRate.value, year);
      const defaultBalance = calculateRemainingBalance(defaultRate.value, year);
      const bestBalance = calculateRemainingBalance(bestRate.value, year);
      
      result.push({
        year,
        [higherRate.label]: higherBalance,
        [defaultRate.label]: defaultBalance,
        [bestRate.label]: bestBalance,
        higherColor: higherRate.color,
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
              max={20000000}
              step={100000}
              onValueChange={(value) => setLoanAmount(value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>R500,000</span>
              <span>R20,000,000</span>
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
                <BarChart 
                  data={monthlyPaymentData}
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
                    hide
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(Number(value))}
                    labelFormatter={(value: string) => `${value} (${monthlyPaymentData.find(d => d.name === value)?.rate}%)`}
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar 
                    dataKey="monthlyPayment" 
                    name="Monthly Repayment"
                    radius={[5, 5, 0, 0]}
                    barSize={60}
                    label={{
                      position: 'top',
                      formatter: (value: number) => formatCurrency(value).toString(),
                      fill: '#666',
                      fontSize: 12,
                      offset: 10
                    }}
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
                <BarChart 
                  data={totalInterestData}
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
                    hide
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(Number(value))}
                    labelFormatter={(value: string) => `${value} (${totalInterestData.find(d => d.name === value)?.rate}%)`}
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar 
                    dataKey="totalInterest" 
                    name="Total Interest"
                    radius={[5, 5, 0, 0]}
                    barSize={60}
                    label={{
                      position: 'top',
                      formatter: (value: number) => formatCurrency(value).toString(),
                      fill: '#666',
                      fontSize: 12,
                      offset: 10
                    }}
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
                  <YAxis tickFormatter={(value: number) => formatCurrency(value).toString()} />
                  <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Prime + 1%" 
                    stroke={amortizationData[0]?.higherColor || "#ef4444"} 
                    strokeWidth={2} 
                  />
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
              <span className="font-medium text-green-600"> {formatCurrency(calculateTotalInterest(rates[2].value) - calculateTotalInterest(rates[4].value))}</span> in
              total interest over the life of your loan.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}