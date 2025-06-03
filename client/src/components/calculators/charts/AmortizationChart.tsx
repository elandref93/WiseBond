import { useState, useEffect } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/calculators";
import { generateAmortizationData } from "@/lib/amortizationUtils";

interface AmortizationChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
}

interface ChartDataPoint {
  name: string;
  principal: number;
  interest: number;
  balance: number;
}

export default function AmortizationChart({
  loanAmount,
  interestRate,
  loanTerm,
}: AmortizationChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Generate chart data using shared utility function
    const generateChartData = () => {
      const amortizationData = generateAmortizationData(loanAmount, interestRate, loanTerm);
      
      // Debug: CRITICAL MISMATCH DETECTION
      console.log('=== CHART VS TABLE MISMATCH DEBUG ===');
      console.log(`Chart receives: Loan=R${loanAmount.toLocaleString()}, Rate=${interestRate}%, Term=${loanTerm} years`);
      console.log('EXPECTED for R1M at 11.25% for 20 years:');
      
      // Calculate what the values SHOULD be for R1M at 11.25% for 20 years
      const expectedLoan = 1000000;
      const expectedRate = 11.25;
      const expectedTerm = 20;
      
      const expectedMonthlyRate = expectedRate / 100 / 12;
      const expectedMonthlyPayment = (expectedLoan * expectedMonthlyRate * Math.pow(1 + expectedMonthlyRate, expectedTerm * 12)) / (Math.pow(1 + expectedMonthlyRate, expectedTerm * 12) - 1);
      console.log(`Expected Monthly Payment: R${expectedMonthlyPayment.toFixed(2)}`);
      
      let expectedBalance = expectedLoan;
      for (let year = 1; year <= 5; year++) {
        for (let month = 1; month <= 12; month++) {
          const monthlyInterest = expectedBalance * expectedMonthlyRate;
          const monthlyPrincipal = expectedMonthlyPayment - monthlyInterest;
          expectedBalance -= monthlyPrincipal;
        }
        console.log(`Expected Year ${year}: Balance = R${expectedBalance.toFixed(2)}`);
      }
      
      console.log('\\nChart is calculating with WRONG VALUES!');
      console.log(`Chart Loan: R${loanAmount} vs Expected: R${expectedLoan}`);
      console.log(`Chart Term: ${loanTerm} years vs Expected: ${expectedTerm} years`);
      
      // Format data for the chart
      const chartData = amortizationData.map(yearData => ({
        name: yearData.year === 0 ? "Start" : `Year ${yearData.year}`,
        principal: yearData.cumulativePrincipal || 0,
        interest: yearData.cumulativeInterest || 0,
        balance: yearData.balance,
      }));
      
      return chartData;
    };

    setChartData(generateChartData());
  }, [loanAmount, interestRate, loanTerm]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <span>Principal Paid: {formatCurrency(payload[0].value)}</span>
            </p>
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Interest Paid: {formatCurrency(payload[1].value)}</span>
            </p>
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              <span>Remaining Balance: {formatCurrency(payload[2].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `R${Math.round(value / 1000000)}M`;
              } else if (value >= 1000) {
                return `R${Math.round(value / 1000)}K`;
              }
              return `R${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#2563eb"
            fill="#93c5fd"
            name="Principal Paid"
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#16a34a"
            fill="#86efac"
            name="Interest Paid"
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#eab308"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
            name="Remaining Balance"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}