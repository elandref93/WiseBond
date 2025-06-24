import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyAnalysis, formatCurrency } from "@/lib/propertyCalculations";

interface PropertyAnalysisChartProps {
  analysis: PropertyAnalysis;
}

export default function PropertyAnalysisChart({ analysis }: PropertyAnalysisChartProps) {
  // Generate chart data for the first 60 payments to keep visualization manageable
  const maxPayments = Math.min(60, analysis.baselineSchedule.length);
  const chartData = Array.from({ length: maxPayments }, (_, index) => {
    const paymentNumber = index + 1;
    const baselinePayment = analysis.baselineSchedule[index];
    
    const dataPoint: any = {
      paymentNumber,
      baseline: baselinePayment?.remainingBalance || 0,
    };

    // Add scenario data
    analysis.scenarioResults.forEach((result, scenarioIndex) => {
      const scenarioPayment = result.amortizationSchedule[index];
      dataPoint[`scenario${scenarioIndex}`] = scenarioPayment?.remainingBalance || 0;
    });

    // Add combined scenario data if available
    if (analysis.combinedScenarioResult) {
      const combinedPayment = analysis.combinedScenarioResult.amortizationSchedule[index];
      dataPoint.combined = combinedPayment?.remainingBalance || 0;
    }

    return dataPoint;
  });

  // Calculate chart dimensions and scales
  const chartWidth = 800;
  const chartHeight = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 80 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Find min and max values for scaling
  const allValues = chartData.flatMap(d => [
    d.baseline,
    ...analysis.scenarioResults.map((_, i) => d[`scenario${i}`]),
    ...(analysis.combinedScenarioResult ? [d.combined] : [])
  ]).filter(v => v > 0);

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;

  // Create scales
  const xScale = (paymentNumber: number) => (paymentNumber - 1) * (innerWidth / (maxPayments - 1));
  const yScale = (value: number) => innerHeight - ((value - minValue) / valueRange * innerHeight);

  // Generate path data for each line
  const generatePath = (dataKey: string) => {
    return chartData
      .filter(d => d[dataKey] > 0)
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.paymentNumber)} ${yScale(d[dataKey])}`)
      .join(' ');
  };

  const colors = [
    '#ef4444', // red for baseline
    '#3b82f6', // blue for scenario 1
    '#10b981', // green for scenario 2
    '#f59e0b', // amber for scenario 3
    '#8b5cf6', // purple for scenario 4
    '#ec4899', // pink for combined
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Balance Progression</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} className="w-full">
            {/* Background */}
            <rect 
              x={margin.left} 
              y={margin.top} 
              width={innerWidth} 
              height={innerHeight} 
              fill="#f8fafc" 
              stroke="#e2e8f0"
            />
            
            {/* Grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const y = margin.top + (i * innerHeight / 5);
              const value = maxValue - (i * valueRange / 5);
              return (
                <g key={i}>
                  <line 
                    x1={margin.left} 
                    y1={y} 
                    x2={margin.left + innerWidth} 
                    y2={y} 
                    stroke="#e2e8f0" 
                    strokeDasharray="2,2"
                  />
                  <text 
                    x={margin.left - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    fontSize="12" 
                    fill="#6b7280"
                  >
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const x = margin.left + (i * innerWidth / 5);
              const paymentNumber = Math.round(1 + (i * (maxPayments - 1) / 5));
              return (
                <text 
                  key={i}
                  x={x} 
                  y={chartHeight - 10} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill="#6b7280"
                >
                  {paymentNumber}
                </text>
              );
            })}

            {/* Baseline line */}
            <path
              d={generatePath('baseline')}
              fill="none"
              stroke={colors[0]}
              strokeWidth="3"
              transform={`translate(${margin.left}, ${margin.top})`}
            />

            {/* Scenario lines */}
            {analysis.scenarioResults.map((result, index) => (
              <path
                key={index}
                d={generatePath(`scenario${index}`)}
                fill="none"
                stroke={colors[index + 1]}
                strokeWidth="2"
                strokeDasharray="5,5"
                transform={`translate(${margin.left}, ${margin.top})`}
              />
            ))}

            {/* Combined scenario line */}
            {analysis.combinedScenarioResult && (
              <path
                d={generatePath('combined')}
                fill="none"
                stroke={colors[colors.length - 1]}
                strokeWidth="3"
                strokeDasharray="10,5"
                transform={`translate(${margin.left}, ${margin.top})`}
              />
            )}

            {/* Axis labels */}
            <text 
              x={chartWidth / 2} 
              y={chartHeight - 5} 
              textAnchor="middle" 
              fontSize="14" 
              fill="#374151"
              fontWeight="500"
            >
              Payment Number
            </text>
            <text 
              x={15} 
              y={chartHeight / 2} 
              textAnchor="middle" 
              fontSize="14" 
              fill="#374151"
              fontWeight="500"
              transform={`rotate(-90, 15, ${chartHeight / 2})`}
            >
              Remaining Balance
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-0.5"
              style={{ backgroundColor: colors[0] }}
            />
            <span>Baseline</span>
          </div>
          
          {analysis.scenarioResults.map((result, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-0.5 border-dashed border-2"
                style={{ borderColor: colors[index + 1] }}
              />
              <span>{result.scenario.name}</span>
            </div>
          ))}
          
          {analysis.combinedScenarioResult && (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-0.5 border-dashed border-2"
                style={{ borderColor: colors[colors.length - 1] }}
              />
              <span>Combined Scenarios</span>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Chart shows the first {maxPayments} payments. Dashed lines represent scenario projections.</p>
        </div>
      </CardContent>
    </Card>
  );
}