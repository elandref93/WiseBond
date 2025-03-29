import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/calculators';

interface AmortizationChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
}

export default function AmortizationChart({ loanAmount, interestRate, loanTerm }: AmortizationChartProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [yearView, setYearView] = useState(1);
  
  // Calculate monthly payment
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const x = Math.pow(1 + monthlyRate, numberOfPayments);
  const monthlyPayment = (loanAmount * x * monthlyRate) / (x - 1);
  
  // Generate amortization schedule
  const generateAmortizationSchedule = () => {
    let balance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    const schedule = [];
    
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;
      
      const year = Math.ceil(month / 12);
      
      if (month % 12 === 0 || month === 1 || month === numberOfPayments) {
        schedule.push({
          month,
          year,
          payment: monthlyPayment,
          principalPayment,
          interestPayment,
          balance: Math.max(0, balance),
          totalInterestPaid,
          totalPrincipalPaid,
          totalPaid: totalInterestPaid + totalPrincipalPaid,
          principalPercentage: (principalPayment / monthlyPayment) * 100,
          interestPercentage: (interestPayment / monthlyPayment) * 100,
        });
      }
    }
    
    return schedule;
  };
  
  // Generate yearly data for overview
  const generateYearlyData = () => {
    const yearlyData = [];
    const monthlySchedule = generateMonthlySchedule();
    
    for (let year = 1; year <= loanTerm; year++) {
      const monthsInYear = monthlySchedule.filter(item => Math.ceil(item.month / 12) === year);
      const lastMonth = monthsInYear[monthsInYear.length - 1];
      
      yearlyData.push({
        year,
        remainingBalance: lastMonth.balance,
        totalPrincipalPaid: lastMonth.totalPrincipalPaid,
        totalInterestPaid: lastMonth.totalInterestPaid,
      });
    }
    
    return yearlyData;
  };
  
  // Generate detailed monthly data
  const generateMonthlySchedule = () => {
    let balance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    const schedule = [];
    
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;
      
      schedule.push({
        month,
        year: Math.ceil(month / 12),
        payment: monthlyPayment,
        principalPayment,
        interestPayment,
        balance: Math.max(0, balance),
        totalInterestPaid,
        totalPrincipalPaid,
        principalPercentage: (principalPayment / monthlyPayment) * 100,
        interestPercentage: (interestPayment / monthlyPayment) * 100,
      });
    }
    
    return schedule;
  };
  
  // Get data for current year view
  const getCurrentYearData = () => {
    const monthlyData = generateMonthlySchedule();
    return monthlyData.filter(item => item.year === yearView);
  };
  
  // Format currency for tooltip and axis labels - using our central formatting function
  const formatChartCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? Number(value) : value;
    return formatCurrency(numValue).toString();
  };
  
  const yearlyData = generateYearlyData();
  const currentYearData = getCurrentYearData();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bond Repayment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Loan Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={yearlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: 0 }} />
                  <YAxis tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={formatChartCurrency} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalPrincipalPaid"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Principal Paid"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInterestPaid"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Interest Paid"
                  />
                  <Area
                    type="monotone"
                    dataKey="remainingBalance"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="Remaining Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Principal</p>
                    <p className="text-2xl font-bold">{formatCurrency(loanAmount)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Interest</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyPayment * numberOfPayments - loanAmount)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyPayment * numberOfPayments)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monthly">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setYearView(Math.max(1, yearView - 1))}
                disabled={yearView <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Year
              </Button>
              
              <div className="text-sm font-medium">
                Year {yearView} of {loanTerm}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setYearView(Math.min(loanTerm, yearView + 1))}
                disabled={yearView >= loanTerm}
              >
                Next Year
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentYearData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => ((value - 1) % 12 + 1).toString()}
                    label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }} 
                  />
                  <YAxis tickFormatter={formatChartCurrency} />
                  <Tooltip 
                    formatter={formatChartCurrency}
                    labelFormatter={(label) => `Month ${(Number(label) - 1) % 12 + 1}`}
                  />
                  <Legend />
                  <Bar dataKey="principalPayment" stackId="a" fill="#8884d8" name="Principal" />
                  <Bar dataKey="interestPayment" stackId="a" fill="#82ca9d" name="Interest" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Balance End of Year {yearView}</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(currentYearData[currentYearData.length - 1]?.balance || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Principal vs Interest</p>
                    <p className="text-2xl font-bold">
                      {Math.round(currentYearData[0]?.principalPercentage || 0)}% / {Math.round(currentYearData[0]?.interestPercentage || 0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}