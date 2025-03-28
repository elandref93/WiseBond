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
  
  // Prepare data for the chart, but create yearly breakdown data for entire loan term
  // This will give us a full amortization schedule per year for the chart
  const chartData: ChartDataItem[] = [];
  const yearsArray: number[] = [];
  
  // Create array with all years from 1 to loan term
  for (let year = 1; year <= loanTermYears; year++) {
    yearsArray.push(year);
  }
  
  // Construct complete yearly data set
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  
  // Find the matching year data or estimate if not found
  yearsArray.forEach(year => {
    const yearData = yearlyData.find(data => data.year === year);
    
    if (yearData) {
      cumulativeInterest = yearData.interestToDate;
      cumulativePrincipal = yearData.principalToDate;
    } else if (year > 1) {
      // If we don't have data for this year, estimate based on proportional calculation
      // This is to create a smooth chart even if we don't have data for every year
      const yearFraction = year / loanTermYears;
      cumulativeInterest = totalInterest * yearFraction;
      cumulativePrincipal = loanAmount * yearFraction;
    }
    
    chartData.push({
      name: year.toString(),
      year: year,
      interest: Math.round(cumulativeInterest),
      principal: Math.round(cumulativePrincipal),
      balance: Math.max(0, Math.round(loanAmount - cumulativePrincipal)),
    });
  });

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
                  domain={[0, Math.max(loanAmount, totalInterest) * 1.1]}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  domain={[0, Math.max(monthlyPayment * 12, interestOnlyPayment * 12) * 1.2]}
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