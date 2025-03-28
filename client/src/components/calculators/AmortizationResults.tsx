import { formatCurrency } from "@/lib/calculators";
import { Card, CardContent } from "@/components/ui/card";
import { format, addYears } from "date-fns";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";

interface AmortizationResultsProps {
  results: {
    loanAmount: number;
    interestRate: number;
    loanTermYears: number;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    yearlyData: {
      year: number;
      interestPaid: number;
      principalPaid: number;
      totalPaid: number;
      remainingPrincipal: number;
      interestToDate: number;
      principalToDate: number;
    }[];
  };
}

export default function AmortizationResults({ results }: AmortizationResultsProps) {
  if (!results) return null;

  const { 
    loanAmount, 
    interestRate, 
    loanTermYears, 
    monthlyPayment, 
    totalPayment, 
    totalInterest,
    yearlyData 
  } = results;

  // Calculate loan end date
  const currentDate = new Date();
  const loanEndDate = addYears(currentDate, loanTermYears);
  const formattedEndDate = format(loanEndDate, "MMM d, yyyy");

  // Interest-only payment
  const interestOnlyPayment = (loanAmount * (interestRate / 100)) / 12;

  // Prepare data for the chart
  const chartData = yearlyData.map((data) => {
    return {
      name: `${data.year}`,
      interest: Math.round(data.interestToDate),
      principal: Math.round(data.principalToDate),
      balance: Math.round(loanAmount - data.principalToDate),
      year: data.year
    };
  });

  return (
    <div className="mt-8 space-y-8">
      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Loan End Date</p>
          <p className="text-3xl font-bold text-green-500">{formattedEndDate}</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Interest Paid</p>
          <p className="text-3xl font-bold text-green-500">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-green-500">{formatCurrency(totalPayment)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Interest Only Payment</p>
          <p className="text-3xl font-bold text-green-500">{formatCurrency(interestOnlyPayment)}</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Principal and Interest Payment</p>
          <p className="text-3xl font-bold text-green-500">{formatCurrency(monthlyPayment)}</p>
        </div>
      </div>

      {/* Amortization Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Amortization Schedule</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  label={{ 
                    value: 'Year', 
                    position: 'insideBottom', 
                    offset: -10 
                  }} 
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  label={{ 
                    value: 'Amount (R)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ 
                    value: 'Monthly Payment (R)', 
                    angle: 90, 
                    position: 'insideRight' 
                  }}
                  domain={[0, Math.ceil(monthlyPayment * 12)]}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), ""]} 
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="principal" 
                  stackId="a" 
                  fill="#4ade80" 
                  name="Principal" 
                />
                <Bar 
                  yAxisId="left"
                  dataKey="interest" 
                  stackId="a" 
                  fill="#60a5fa" 
                  name="Interest" 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#111111" 
                  strokeDasharray="5 5" 
                  name="Balance"
                  dot={{ stroke: '#111111', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Breakdown Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Yearly Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Paid</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Paid</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {yearlyData.map((data, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Year {data.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.principalToDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.interestToDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.principalToDate + data.interestToDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(loanAmount - data.principalToDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500">
        <p>
          This amortization schedule is an estimate based on the information provided. 
          Actual amounts may vary based on the exact terms of your loan, payment dates,
          and any changes in your interest rate over the term of the loan.
        </p>
      </div>
    </div>
  );
}