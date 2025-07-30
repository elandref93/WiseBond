import { formatCurrency, CalculationResult } from "@/lib/calculators";
import { Card, CardContent } from "@/components/ui/card";
import { format, addYears } from "date-fns";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";

// Define the expected yearly data structure
interface YearlyDataItem {
  year: number;
  interestPaid: number;
  principalPaid: number;
  totalPaid: number;
  remainingPrincipal: number;
  interestToDate: number;
  principalToDate: number;
}

// Define a more specific type for the Amortization results
interface AmortizationData {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  yearlyData: YearlyDataItem[];
  type: string;
  displayResults: Array<{label: string; value: string; tooltip?: string}>;
}

interface AmortizationResultsProps {
  results: AmortizationData;
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

  // Define the chart data structure
  interface ChartDataItem {
    name: string;
    year: number;
    interest: number;
    principal: number;
    balance: number;
  }
  
  // Use the actual calculated yearly data for the chart
  const chartData: ChartDataItem[] = yearlyData.map(data => ({
    name: data.year.toString(),
    year: data.year,
    interest: Math.round(data.interestToDate),
    principal: Math.round(data.principalToDate),
    balance: Math.round(data.remainingPrincipal),
  }));
  

  return (
    <div className="mt-8 space-y-8">
      {/* Summary Section - Styled like the provided image */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Loan End Date</p>
          <p className="text-4xl font-bold text-green-500">{formattedEndDate}</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Interest Paid</p>
          <p className="text-4xl font-bold text-green-500">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-4xl font-bold text-green-500">{formatCurrency(totalPayment)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Interest Only Payment</p>
          <p className="text-4xl font-bold text-green-500">{formatCurrency(interestOnlyPayment)}</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-sm text-gray-600 mb-1">Principal and Interest Payment</p>
          <p className="text-4xl font-bold text-green-500">{formatCurrency(monthlyPayment)}</p>
        </div>
      </div>

      {/* Amortization Chart - Styled to match the provided image */}
      <Card>
        <CardContent className="p-6">
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  domain={[0, 'dataMax']}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  domain={[0, 'dataMax']}
                  axisLine={false}
                  hide
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), ""]} 
                  labelFormatter={(label) => `${label}`}
                />
                <Legend 
                  verticalAlign="top"
                  align="left"
                  iconType="square"
                  wrapperStyle={{paddingBottom: "10px"}}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#000000" 
                  strokeDasharray="4 4"
                  name="Balance"
                  dot={false}
                  strokeWidth={2}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="principal" 
                  fill="#4ADE80" 
                  name="Principal" 
                  stackId="a"
                />
                <Bar 
                  yAxisId="left"
                  dataKey="interest" 
                  fill="#60A5FA" 
                  name="Interest" 
                  stackId="a"
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
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Paid</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Paid</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yearlyData.map((data: YearlyDataItem, index: number) => (
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
          </div>
          <p className="text-xs text-gray-400 mt-2">Scroll to view all {yearlyData.length} years</p>
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
