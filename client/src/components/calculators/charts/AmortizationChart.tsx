import { useState, useEffect } from 'react';
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PieChartIcon, BarChartIcon, TrendingUpIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/calculators';
import { useIsMobile } from '@/hooks/use-mobile';

interface AmortizationChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
}

export default function AmortizationChart({ loanAmount, interestRate, loanTerm }: AmortizationChartProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [yearView, setYearView] = useState(1);
  const [chartType, setChartType] = useState<'area' | 'pie'>('area');
  const isMobile = useIsMobile();
  
  // Calculate monthly payment
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const x = Math.pow(1 + monthlyRate, numberOfPayments);
  const monthlyPayment = (loanAmount * x * monthlyRate) / (x - 1);
  
  // Generate yearly data for overview
  const generateYearlyData = () => {
    const yearlyData = [];
    let balance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    for (let year = 1; year <= loanTerm; year++) {
      let yearInterest = 0;
      let yearPrincipal = 0;
      
      // Calculate each month in this year
      for (let month = 1; month <= 12; month++) {
        if ((year - 1) * 12 + month <= numberOfPayments) {
          const interestPayment = balance * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          
          yearInterest += interestPayment;
          yearPrincipal += principalPayment;
          balance -= principalPayment;
        }
      }
      
      totalInterestPaid += yearInterest;
      totalPrincipalPaid += yearPrincipal;
      
      yearlyData.push({
        year,
        yearlyInterest: yearInterest,
        yearlyPrincipal: yearPrincipal,
        remainingBalance: Math.max(0, balance),
        totalInterestPaid,
        totalPrincipalPaid,
      });
    }
    
    return yearlyData;
  };
  
  // Generate monthly data for current year
  const generateMonthlyData = () => {
    const monthlyData = [];
    let balance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    // Fast-forward to the year we're interested in
    for (let month = 1; month < (yearView - 1) * 12; month++) {
      if (month <= numberOfPayments) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;
      }
    }
    
    // Now calculate each month in the current year
    for (let month = 1; month <= 12; month++) {
      const absoluteMonth = (yearView - 1) * 12 + month;
      
      if (absoluteMonth <= numberOfPayments) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;
        
        monthlyData.push({
          month,
          absoluteMonth,
          principalPayment,
          interestPayment,
          balance,
          totalInterestPaid,
          totalPrincipalPaid,
          principalPercentage: (principalPayment / monthlyPayment) * 100,
          interestPercentage: (interestPayment / monthlyPayment) * 100,
        });
      }
    }
    
    return monthlyData;
  };
  
  // Format currency for tooltip and axis labels
  const formatChartCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (isMobile) {
      // On mobile, use a more compact display
      return numValue >= 1000000 
        ? `R${(numValue / 1000000).toFixed(1)}M` 
        : numValue >= 1000 
          ? `R${(numValue / 1000).toFixed(0)}K` 
          : formatCurrency(numValue);
    }
    return formatCurrency(numValue).toString();
  };
  
  // Total loan cost data for pie chart
  const totalCostData = [
    { name: 'Principal', value: loanAmount },
    { name: 'Interest', value: monthlyPayment * numberOfPayments - loanAmount }
  ];
  
  // Pie chart colors
  const COLORS = ['#8884d8', '#82ca9d'];
  
  const yearlyData = generateYearlyData();
  const monthlyData = generateMonthlyData();
  
  // For responsive design - smaller tick counts on mobile
  const getTickCount = () => isMobile ? 3 : 5;
  
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Loan Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <BarChartIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Monthly Breakdown</span>
            <span className="sm:hidden">Monthly</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4 m-0">
          {/* Chart toggle buttons */}
          <div className="flex justify-end mb-4">
            <div className="bg-muted inline-flex rounded-md p-1">
              <Button 
                variant={chartType === 'area' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setChartType('area')}
                className="h-8 px-2"
              >
                <TrendingUpIcon className="h-4 w-4" />
                <span className="sr-only">Area Chart</span>
              </Button>
              <Button 
                variant={chartType === 'pie' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setChartType('pie')}
                className="h-8 px-2"
              >
                <PieChartIcon className="h-4 w-4" />
                <span className="sr-only">Pie Chart</span>
              </Button>
            </div>
          </div>
          
          {/* Chart display */}
          <div className="h-[300px] md:h-[350px]">
            {chartType === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={yearlyData}
                  margin={{ top: 10, right: 5, left: 5, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ 
                      value: 'Years', 
                      position: 'insideBottomRight', 
                      offset: -5 
                    }}
                    tickCount={getTickCount()}
                  />
                  <YAxis 
                    tickFormatter={formatChartCurrency}
                    width={isMobile ? 40 : 60}
                  />
                  <Tooltip 
                    formatter={formatChartCurrency}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="totalPrincipalPaid"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Principal"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInterestPaid"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Interest"
                  />
                  <Area
                    type="monotone"
                    dataKey="remainingBalance"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalCostData}
                    cx="50%"
                    cy="50%"
                    labelLine={!isMobile}
                    outerRadius={isMobile ? 80 : 110}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      !isMobile && `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {totalCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={formatChartCurrency}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend 
                    formatter={(value, entry, index) => {
                      const amount = totalCostData[index].value;
                      return `${value}: ${formatChartCurrency(amount)} (${((amount / (loanAmount + (monthlyPayment * numberOfPayments - loanAmount))) * 100).toFixed(0)}%)`;
                    }}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="pt-4 m-0">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setYearView(Math.max(1, yearView - 1))}
              disabled={yearView <= 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <div className="text-sm font-medium">
              Year {yearView} of {loanTerm}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setYearView(Math.min(loanTerm, yearView + 1))}
              disabled={yearView >= loanTerm}
              className="h-8"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* Monthly breakdown chart */}
          <div className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 5, left: 5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} 
                  tickCount={isMobile ? 6 : 12}
                />
                <YAxis 
                  tickFormatter={formatChartCurrency}
                  width={isMobile ? 40 : 60}
                />
                <Tooltip 
                  formatter={formatChartCurrency}
                  labelFormatter={(label) => `Month ${label}`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="principalPayment" stackId="a" fill="#8884d8" name="Principal" />
                <Bar dataKey="interestPayment" stackId="a" fill="#82ca9d" name="Interest" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Year summary for current year */}
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-center">
            {yearView <= yearlyData.length ? (
              <>
                <span className="font-medium">Year {yearView} Summary:</span>{' '}
                Principal: {formatChartCurrency(yearlyData[yearView - 1].yearlyPrincipal)},{' '}
                Interest: {formatChartCurrency(yearlyData[yearView - 1].yearlyInterest)},{' '}
                Balance: {formatChartCurrency(yearlyData[yearView - 1].remainingBalance)}
              </>
            ) : (
              <span>No data for year {yearView}</span>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}