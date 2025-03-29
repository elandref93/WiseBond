import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdditionalPaymentChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  additionalPayment: number;
}

export default function AdditionalPaymentChart({
  loanAmount,
  interestRate,
  loanTerm,
  additionalPayment
}: AdditionalPaymentChartProps) {
  // Calculate original loan details
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const x = Math.pow(1 + monthlyRate, numberOfPayments);
  const monthlyPayment = (loanAmount * x * monthlyRate) / (x - 1);
  const totalOriginalPayment = monthlyPayment * numberOfPayments;
  const totalOriginalInterest = totalOriginalPayment - loanAmount;

  // Calculate with additional payment
  const calculateWithAdditionalPayment = () => {
    let balance = loanAmount;
    let totalInterestPaid = 0;
    let monthsToPayOff = 0;
    
    // Keep track of data points for graph
    const yearlyData = [];
    let previousYear = 0;
    
    while (balance > 0) {
      monthsToPayOff++;
      
      const interestPayment = balance * monthlyRate;
      const standardPrincipalPayment = monthlyPayment - interestPayment;
      const principalPayment = standardPrincipalPayment + additionalPayment;
      
      totalInterestPaid += interestPayment;
      
      balance -= principalPayment;
      if (balance < 0) balance = 0;
      
      const currentYear = Math.ceil(monthsToPayOff / 12);
      
      // Track yearly data points
      if (currentYear > previousYear || balance === 0) {
        yearlyData.push({
          year: currentYear,
          balance: balance,
          interestPaid: totalInterestPaid
        });
        previousYear = currentYear;
      }
    }
    
    return {
      monthsToPayOff,
      totalInterestPaid,
      yearlyData
    };
  };
  
  // Calculate original schedule for comparison
  const calculateOriginalSchedule = () => {
    let balance = loanAmount;
    let totalInterestPaid = 0;
    const yearlyData = [];
    
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      totalInterestPaid += interestPayment;
      balance -= principalPayment;
      
      if (balance < 0) balance = 0;
      
      const currentYear = Math.ceil(month / 12);
      
      // Store yearly data points
      if (month % 12 === 0 || month === numberOfPayments) {
        yearlyData.push({
          year: currentYear,
          balance: balance,
          interestPaid: totalInterestPaid
        });
      }
    }
    
    return { yearlyData };
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const { monthsToPayOff, totalInterestPaid, yearlyData: additionalPaymentData } = calculateWithAdditionalPayment();
  const { yearlyData: originalData } = calculateOriginalSchedule();
  
  // Format for display
  const yearsToPayOff = Math.floor(monthsToPayOff / 12);
  const remainingMonths = monthsToPayOff % 12;
  const timeToPayOffText = `${yearsToPayOff} years${remainingMonths > 0 ? `, ${remainingMonths} months` : ''}`;
  
  // Calculate savings
  const moneySaved = totalOriginalInterest - totalInterestPaid;
  const timeSaved = numberOfPayments - monthsToPayOff;
  const yearsSaved = Math.floor(timeSaved / 12);
  const monthsSaved = timeSaved % 12;
  const timeSavedText = `${yearsSaved} years${monthsSaved > 0 ? `, ${monthsSaved} months` : ''}`;
  
  // Generate comparison data for graph
  const comparisonData = originalData.map(original => {
    const additionalPaymentPoint = additionalPaymentData.find(point => point.year === original.year);
    
    return {
      year: original.year,
      originalBalance: original.balance,
      additionalPaymentBalance: additionalPaymentPoint ? additionalPaymentPoint.balance : 0
    };
  });
  
  // Pie chart data for interest vs principal
  const originalPieData = [
    { name: 'Principal', value: loanAmount, color: '#8884d8' },
    { name: 'Interest', value: totalOriginalInterest, color: '#82ca9d' }
  ];
  
  const additionalPaymentPieData = [
    { name: 'Principal', value: loanAmount, color: '#8884d8' },
    { name: 'Interest', value: totalInterestPaid, color: '#82ca9d' }
  ];
  
  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Additional Payment Impact</h2>
        <Tabs defaultValue="comparison">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">Payment Comparison</TabsTrigger>
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="space-y-4">
            <div className="h-[500px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={comparisonData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: 0 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="originalBalance"
                    stroke="#8884d8"
                    name="Standard Repayment"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="additionalPaymentBalance"
                    stroke="#82ca9d"
                    name="With Additional Payment"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">New Loan Term</p>
                    <p className="text-2xl font-bold">{timeToPayOffText}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {timeSaved > 0 ? `Save ${timeSavedText}` : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Interest Paid</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalInterestPaid)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {moneySaved > 0 ? `Save ${formatCurrency(moneySaved)}` : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Monthly + Additional</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyPayment + additionalPayment)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ({formatCurrency(monthlyPayment)} + {formatCurrency(additionalPayment)})
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-center mb-4">Standard Repayment</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={originalPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {originalPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(loanAmount + totalOriginalInterest)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-center mb-4">With Additional Payment</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={additionalPaymentPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {additionalPaymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(loanAmount + totalInterestPaid)}</p>
                </div>
              </div>
            </div>
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Savings</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(moneySaved)}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    By paying an additional {formatCurrency(additionalPayment)} per month, you'll save {formatCurrency(moneySaved)} in interest and pay off your loan {timeSavedText} sooner.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}