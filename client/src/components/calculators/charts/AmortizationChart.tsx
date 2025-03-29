import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/calculators";

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

const calculateMonthlyPayment = (principal: number, interestRate: number, termYears: number) => {
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = termYears * 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1)
  );
};

export default function AmortizationChart({
  loanAmount,
  interestRate,
  loanTerm,
}: AmortizationChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Generate chart data
    const generateChartData = () => {
      const data: ChartDataPoint[] = [];
      let remainingBalance = loanAmount;
      let cumulativeInterest = 0;
      let cumulativePrincipal = 0;

      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

      // Calculate yearly data
      for (let year = 0; year <= loanTerm; year++) {
        if (year === 0) {
          // Starting point
          data.push({
            name: "Start",
            principal: 0,
            interest: 0,
            balance: loanAmount,
          });
          continue;
        }

        let yearlyPrincipal = 0;
        let yearlyInterest = 0;

        // Calculate monthly payments for the year
        for (let month = 1; month <= 12; month++) {
          if ((year - 1) * 12 + month <= loanTerm * 12) {
            const monthlyInterest = remainingBalance * (interestRate / 100 / 12);
            const monthlyPrincipal = monthlyPayment - monthlyInterest;

            yearlyInterest += monthlyInterest;
            yearlyPrincipal += monthlyPrincipal;
            remainingBalance -= monthlyPrincipal;
          }
        }

        cumulativeInterest += yearlyInterest;
        cumulativePrincipal += yearlyPrincipal;

        data.push({
          name: `Year ${year}`,
          principal: cumulativePrincipal,
          interest: cumulativeInterest,
          balance: Math.max(0, remainingBalance),
        });
      }

      return data;
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
        <AreaChart
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
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#eab308"
            fill="#fef08a"
            name="Remaining Balance"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}