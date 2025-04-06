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
    <div className="w-full space-y-8">
      {/* Summary Section - Full Width Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-600 mb-2">Loan End Date</p>
          <p className="text-3xl font-bold text-green-600">{formattedEndDate}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-600 mb-2">Total Interest Paid</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-600 mb-2">Total Paid</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPayment)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-600 mb-2">Interest Only Payment</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(interestOnlyPayment)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-sm text-gray-600 mb-2">Principal and Interest Payment</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(monthlyPayment)}</p>
        </div>
      </div>

      {/* Amortization Chart - Full Width */}
      <div className="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Payment Breakdown by Year</h3>
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                domain={[0, 'dataMax']}
                axisLine={{ stroke: '#e0e0e0' }}
                label={{ 
                  value: 'Amount', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right" 
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`R${value.toLocaleString()}`, undefined]}
                labelFormatter={(name) => `Year: ${name}`}
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px' }} />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="balance" 
                stroke="#F97316" 
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Remaining Balance"
              />
              <Bar 
                yAxisId="left"
                dataKey="principal" 
                fill="#4ADE80" 
                name="Principal" 
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="left"
                dataKey="interest" 
                fill="#60A5FA" 
                name="Interest" 
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yearly Breakdown Table - Full Width */}
      <div className="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Yearly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Year</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Principal Paid</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Interest Paid</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Paid</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((data: YearlyDataItem, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 border-t border-b border-gray-200'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Year {data.year}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(data.principalToDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(data.interestToDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(data.principalToDate + data.interestToDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(loanAmount - data.principalToDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        <p>
          This amortization schedule is an estimate based on the information provided. 
          Actual amounts may vary based on the exact terms of your loan, payment dates,
          and any changes in your interest rate over the term of the loan.
        </p>
      </div>
    </div>
  );
}