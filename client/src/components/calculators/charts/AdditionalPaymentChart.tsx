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
  
  // Calculate percentages
  const originalPrincipalPercent = Math.round((loanAmount / (loanAmount + totalOriginalInterest)) * 100);
  const originalInterestPercent = Math.round((totalOriginalInterest / (loanAmount + totalOriginalInterest)) * 100);
  const additionalPrincipalPercent = Math.round((loanAmount / (loanAmount + totalInterestPaid)) * 100);
  const additionalInterestPercent = Math.round((totalInterestPaid / (loanAmount + totalInterestPaid)) * 100);

  // Pie chart data for interest vs principal
  const originalPieData = [
    { name: `Principal: ${originalPrincipalPercent}% (${formatCurrency(loanAmount)})`, value: loanAmount, color: '#8884d8' },
    { name: `Interest: ${originalInterestPercent}% (${formatCurrency(totalOriginalInterest)})`, value: totalOriginalInterest, color: '#82ca9d' }
  ];
  
  const additionalPaymentPieData = [
    { name: `Principal: ${additionalPrincipalPercent}% (${formatCurrency(loanAmount)})`, value: loanAmount, color: '#8884d8' },
    { name: `Interest: ${additionalInterestPercent}% (${formatCurrency(totalInterestPaid)})`, value: totalInterestPaid, color: '#82ca9d' }
  ];

  // Summary stats for display
  const summaryStats = [
    {
      title: "Original Loan Term",
      value: `${loanTerm} years`,
      subtitle: "Standard repayment schedule"
    },
    {
      title: "New Loan Term",
      value: timeToPayOffText,
      subtitle: `You'll save ${timeSavedText}`,
      highlight: true
    },
    {
      title: "Standard Payment",
      value: formatCurrency(monthlyPayment),
      subtitle: "Current monthly payment"
    },
    {
      title: "Additional Payment",
      value: formatCurrency(additionalPayment),
      subtitle: "Extra amount per month"
    },
    {
      title: "Total Interest Saved",
      value: formatCurrency(moneySaved),
      subtitle: "By making additional payments",
      highlight: true
    }
  ];
  
  return (
    <div className="w-full space-y-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Additional Payment Impact</h2>
      
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {summaryStats.map((stat, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg shadow-sm ${stat.highlight 
              ? 'bg-green-50 border border-green-200'
              : 'bg-white border border-gray-200'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            <p className={`text-2xl font-bold ${stat.highlight ? 'text-green-600' : 'text-gray-800'}`}>
              {stat.value}
            </p>
            <p className="text-xs mt-1 text-gray-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>
      
      {/* Main Chart Section - Full Width */}
      <div className="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Loan Balance Comparison</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={comparisonData}
              margin={{ top: 10, right: 30, left: 50, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                label={{ 
                  value: 'Years', 
                  position: 'insideBottomRight', 
                  offset: -10
                }} 
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                label={{
                  value: 'Remaining Balance',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend verticalAlign="top" height={40} />
              <Line
                type="monotone"
                dataKey="originalBalance"
                stroke="#8884d8"
                name="Standard Repayment"
                strokeWidth={3}
                dot={{r: 6}}
                activeDot={{r: 8}}
              />
              <Line
                type="monotone"
                dataKey="additionalPaymentBalance"
                stroke="#82ca9d"
                name="With Additional Payment"
                strokeWidth={3}
                dot={{r: 6}}
                activeDot={{r: 8}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Interest Breakdown Section - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Standard Repayment</h3>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={originalPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {originalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <div className="space-y-4 p-4">
                <div className="p-3 border border-gray-100 rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Principal Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(loanAmount)}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Total Interest</p>
                  <p className="text-xl font-bold">{formatCurrency(totalOriginalInterest)}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(loanAmount + totalOriginalInterest)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">With Additional Payment</h3>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={additionalPaymentPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {additionalPaymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <div className="space-y-4 p-4">
                <div className="p-3 border border-gray-100 rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Principal Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(loanAmount)}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Total Interest</p>
                  <p className="text-xl font-bold">{formatCurrency(totalInterestPaid)}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded bg-gray-50">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(loanAmount + totalInterestPaid)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Box - Full Width */}
      <div className="w-full bg-green-50 p-8 rounded-lg border border-green-200 shadow-sm">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-green-600 mb-2">Your Savings Summary</h3>
          <p className="text-3xl font-bold text-green-700 mb-4">
            Save {formatCurrency(moneySaved)} in interest
          </p>
          <p className="text-lg text-gray-700">
            By paying an additional {formatCurrency(additionalPayment)} per month on your R{formatCurrency(loanAmount).substring(1)} loan, 
            you'll save {formatCurrency(moneySaved)} in interest and pay off your loan {timeSavedText} sooner.
          </p>
        </div>
      </div>
    </div>
  );
}