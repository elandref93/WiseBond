/**
 * Static Chart Generation Utility
 * 
 * This module provides functions to generate static chart data for PDF reports
 * using SVG format, which is more reliable for PDF rendering than dynamic Chart.js
 */

/**
 * Generate pie chart SVG for payment breakdown
 * @param principal Principal amount
 * @param interest Interest amount
 * @returns SVG markup for pie chart
 */
export function generatePaymentBreakdownSvg(principal: number, interest: number): string {
  // Calculate total and percentages
  const total = principal + interest;
  const principalPercent = (principal / total * 100).toFixed(1);
  const interestPercent = (interest / total * 100).toFixed(1);
  
  // Format currency values - display full values without abbreviations for the pie chart
  let principalFormatted, interestFormatted;
  
  // For pie chart, always show full values without abbreviations
  principalFormatted = Math.round(principal).toLocaleString('en-ZA');
  interestFormatted = Math.round(interest).toLocaleString('en-ZA');
  
  // Calculate pie chart angles
  const principalAngle = principal / total * 360;

  return `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <!-- Main pie chart -->
    <g transform="translate(150, 150)">
      <!-- Principal slice -->
      <path d="M 0 0 L ${getCoordinatesForAngle(0, 100).x} ${getCoordinatesForAngle(0, 100).y} A 100 100 0 ${principalAngle > 180 ? 1 : 0} 1 ${getCoordinatesForAngle(principalAngle, 100).x} ${getCoordinatesForAngle(principalAngle, 100).y} Z" 
        fill="hsl(210, 79%, 51%)" stroke="#ffffff" stroke-width="1" />
      
      <!-- Interest slice -->
      <path d="M 0 0 L ${getCoordinatesForAngle(principalAngle, 100).x} ${getCoordinatesForAngle(principalAngle, 100).y} A 100 100 0 ${360 - principalAngle > 180 ? 1 : 0} 1 ${getCoordinatesForAngle(0, 100).x} ${getCoordinatesForAngle(0, 100).y} Z" 
        fill="hsl(26, 79%, 51%)" stroke="#ffffff" stroke-width="1" />
      
      <!-- Principal label inside slice -->
      <text x="${getCoordinatesForAngle(principalAngle/2, 60).x}" y="${getCoordinatesForAngle(principalAngle/2, 60).y}" 
        fill="white" font-weight="bold" font-size="12" text-anchor="middle" dy=".3em">${principalPercent}%</text>
      
      <!-- Interest label inside slice -->
      <text x="${getCoordinatesForAngle(principalAngle + (360-principalAngle)/2, 60).x}" y="${getCoordinatesForAngle(principalAngle + (360-principalAngle)/2, 60).y}" 
        fill="white" font-weight="bold" font-size="12" text-anchor="middle" dy=".3em">${interestPercent}%</text>
    </g>
    
    <!-- Legend -->
    <g transform="translate(270, 120)">
      <!-- Principal legend -->
      <rect x="0" y="0" width="20" height="20" fill="hsl(210, 79%, 51%)" />
      <text x="30" y="15" font-family="Segoe UI" font-size="12">Principal</text>
      <text x="30" y="35" font-family="Segoe UI" font-size="12">R ${principalFormatted}</text>
      
      <!-- Interest legend -->
      <rect x="0" y="50" width="20" height="20" fill="hsl(26, 79%, 51%)" />
      <text x="30" y="65" font-family="Segoe UI" font-size="12">Interest</text>
      <text x="30" y="85" font-family="Segoe UI" font-size="12">R ${interestFormatted}</text>
    </g>
  </svg>`;
}

/**
 * Generate line chart SVG for loan overview
 * @param years Array of year labels
 * @param balance Array of balance values
 * @param principalPaid Array of principal paid values
 * @param interestPaid Array of interest paid values
 * @returns SVG markup for line chart
 */
export function generateLoanOverviewSvg(
  years: number[], 
  balance: number[], 
  principalPaid: number[], 
  interestPaid: number[]
): string {
  // Find the highest value for scaling
  const maxBalance = Math.max(...balance);
  const maxPaid = Math.max(...principalPaid, ...interestPaid);
  
  // Chart dimensions - increased width and padding for labels and legend
  const width = 800;
  const height = 350;
  const leftPadding = 80; // Increased padding for left labels
  const rightPadding = 80; // Increased padding for right labels
  const topPadding = 60;   // Increased top padding for legend
  const bottomPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  
  // Generate chart points for each dataset
  const balancePoints = generatePoints(years, balance, maxBalance, chartWidth, chartHeight, leftPadding);
  const principalPoints = generatePoints(years, principalPaid, maxPaid, chartWidth, chartHeight, leftPadding);
  const interestPoints = generatePoints(years, interestPaid, maxPaid, chartWidth, chartHeight, leftPadding);
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- X and Y axes - ensure they don't overlap with zero values -->
    <line x1="${leftPadding}" y1="${height - bottomPadding}" x2="${width - rightPadding}" y2="${height - bottomPadding}" stroke="#333" stroke-width="1" />
    <line x1="${leftPadding}" y1="${topPadding}" x2="${leftPadding}" y2="${height - bottomPadding}" stroke="#333" stroke-width="1" />
    
    <!-- X-axis labels -->
    ${years.map((year, i) => {
      const x = leftPadding + (i * (chartWidth / (years.length - 1)));
      return `<text x="${x}" y="${height - bottomPadding + 20}" text-anchor="middle" font-family="Segoe UI" font-size="10">${year}</text>`;
    }).join('')}
    
    <!-- Y-axis labels for balance (left side) with more space -->
    ${generateYAxisLabels(maxBalance, 5, leftPadding, chartHeight, 'left')}
    
    <!-- Y-axis labels for paid amounts (right side) with more space -->
    ${generateYAxisLabels(maxPaid, 5, width - rightPadding, chartHeight, 'right')}
    
    <!-- Balance line -->
    <path d="${balancePoints}" fill="rgba(59, 130, 246, 0.1)" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
    
    <!-- Principal Paid line -->
    <path d="${principalPoints}" fill="none" stroke="hsl(26, 79%, 51%)" stroke-width="2" stroke-dasharray="5,5" />
    
    <!-- Interest Paid line -->
    <path d="${interestPoints}" fill="none" stroke="hsl(142, 76%, 36%)" stroke-width="2" stroke-dasharray="2,2" />
    
    <!-- Legend - moved to the top of the chart, outside the plotting area -->
    <g transform="translate(${leftPadding + 40}, 30)">
      <!-- Balance legend -->
      <line x1="0" y1="0" x2="20" y2="0" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
      <text x="30" y="5" font-family="Segoe UI" font-size="12">Outstanding Balance</text>
      
      <!-- Principal Paid legend -->
      <line x1="200" y1="0" x2="220" y2="0" stroke="hsl(26, 79%, 51%)" stroke-width="2" stroke-dasharray="5,5" />
      <text x="230" y="5" font-family="Segoe UI" font-size="12">Principal Paid</text>
      
      <!-- Interest Paid legend -->
      <line x1="400" y1="0" x2="420" y2="0" stroke="hsl(142, 76%, 36%)" stroke-width="2" stroke-dasharray="2,2" />
      <text x="430" y="5" font-family="Segoe UI" font-size="12">Interest Paid</text>
    </g>
  </svg>`;
}

/**
 * Generate a bar chart comparing standard and additional payment data
 * @param labels Chart labels
 * @param standardValues Standard payment values
 * @param additionalValues Additional payment values
 * @returns SVG markup for bar chart
 */
export function generateComparisonBarChartSvg(
  labels: string[],
  standardValues: number[],
  additionalValues: number[]
): string {
  // Chart dimensions - increased width and padding for labels and legend
  const width = 800;
  const height = 350;
  const leftPadding = 80; // Increased padding for left labels
  const rightPadding = 40;
  const topPadding = 60;   // Increased top padding for legend
  const bottomPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  
  // Find max value for scaling
  const maxValue = Math.max(...standardValues, ...additionalValues);
  
  // Bar width
  const groupWidth = chartWidth / labels.length;
  const barWidth = groupWidth * 0.4; // 40% of available width
  const spacing = groupWidth * 0.2; // 20% spacing
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- X and Y axes - ensure they don't overlap with zero values -->
    <line x1="${leftPadding}" y1="${height - bottomPadding}" x2="${width - rightPadding}" y2="${height - bottomPadding}" stroke="#333" stroke-width="1" />
    <line x1="${leftPadding}" y1="${topPadding}" x2="${leftPadding}" y2="${height - bottomPadding}" stroke="#333" stroke-width="1" />
    
    <!-- X-axis labels -->
    ${labels.map((label, i) => {
      const x = leftPadding + (i * groupWidth) + groupWidth/2;
      return `<text x="${x}" y="${height - bottomPadding + 20}" text-anchor="middle" font-family="Segoe UI" font-size="10">${label}</text>`;
    }).join('')}
    
    <!-- Y-axis labels with more space for large numbers -->
    ${generateYAxisLabels(maxValue, 5, leftPadding, chartHeight, 'left')}
    
    <!-- Standard payment bars -->
    ${standardValues.map((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = leftPadding + (i * groupWidth) + spacing;
      const y = height - bottomPadding - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="hsl(210, 79%, 51%)" />`;
    }).join('')}
    
    <!-- Additional payment bars -->
    ${additionalValues.map((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = leftPadding + (i * groupWidth) + spacing + barWidth;
      const y = height - bottomPadding - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="hsl(26, 79%, 51%)" />`;
    }).join('')}
    
    <!-- Legend - moved to the top of the chart, outside the plotting area -->
    <g transform="translate(${leftPadding + 40}, 30)">
      <!-- Standard payment legend -->
      <rect x="0" y="0" width="15" height="15" fill="hsl(210, 79%, 51%)" />
      <text x="25" y="12" font-family="Segoe UI" font-size="12">Standard Bond</text>
      
      <!-- Additional payment legend -->
      <rect x="200" y="0" width="15" height="15" fill="hsl(26, 79%, 51%)" />
      <text x="225" y="12" font-family="Segoe UI" font-size="12">With Additional Payment</text>
    </g>
  </svg>`;
}

/**
 * Generate line chart comparing standard and additional payment balance over time
 * @param years Year labels
 * @param standardBalance Standard payment balance values
 * @param additionalBalance Additional payment balance values
 * @returns SVG markup for line chart
 */
export function generateBalanceComparisonSvg(
  years: number[],
  standardBalance: number[],
  additionalBalance: number[]
): string {
  // Chart dimensions - increased width and padding for labels and legend
  const width = 800;
  const height = 350;
  const leftPadding = 80; // Increased padding for left labels
  const rightPadding = 40;
  const topPadding = 60;   // Increased top padding for legend
  const bottomPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  
  // Find the highest value for scaling
  const maxBalance = Math.max(...standardBalance, ...additionalBalance);
  
  // Generate chart points for each dataset
  const standardPoints = generatePoints(years, standardBalance, maxBalance, chartWidth, chartHeight, leftPadding);
  const additionalPoints = generatePoints(years, additionalBalance, maxBalance, chartWidth, chartHeight, leftPadding);
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- X and Y axes - ensure they don't overlap with zero values -->
    <line x1="${leftPadding}" y1="${height - bottomPadding}" x2="${width - rightPadding}" y2="${height - bottomPadding}" stroke="#333" stroke-width="1" />
    <line x1="${leftPadding}" y1="${topPadding}" x2="${leftPadding}" y2="${height - bottomPadding}" stroke="#333" stroke-width="1" />
    
    <!-- X-axis labels -->
    ${years.map((year, i) => {
      const x = leftPadding + (i * (chartWidth / (years.length - 1)));
      return `<text x="${x}" y="${height - bottomPadding + 20}" text-anchor="middle" font-family="Segoe UI" font-size="10">${year}</text>`;
    }).join('')}
    
    <!-- Y-axis labels with more space for large numbers -->
    ${generateYAxisLabels(maxBalance, 5, leftPadding, chartHeight, 'left')}
    
    <!-- Standard balance line -->
    <path d="${standardPoints}" fill="rgba(59, 130, 246, 0.1)" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
    
    <!-- Additional payment balance line -->
    <path d="${additionalPoints}" fill="rgba(234, 88, 12, 0.1)" stroke="hsl(26, 79%, 51%)" stroke-width="2" />
    
    <!-- Legend - moved to the top of the chart, outside the plotting area -->
    <g transform="translate(${leftPadding + 40}, 30)">
      <!-- Standard balance legend -->
      <line x1="0" y1="0" x2="20" y2="0" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
      <text x="30" y="5" font-family="Segoe UI" font-size="12">Standard Bond Balance</text>
      
      <!-- Additional payment balance legend -->
      <line x1="300" y1="0" x2="320" y2="0" stroke="hsl(26, 79%, 51%)" stroke-width="2" />
      <text x="330" y="5" font-family="Segoe UI" font-size="12">With Additional Payment</text>
    </g>
  </svg>`;
}

// Helper functions

/**
 * Get x,y coordinates for an angle on a circle
 * @param angle Angle in degrees
 * @param radius Circle radius
 * @returns {x, y} coordinates
 */
function getCoordinatesForAngle(angle: number, radius: number): {x: number, y: number} {
  // Convert degrees to radians
  const radians = (angle - 90) * Math.PI / 180;
  
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius
  };
}

/**
 * Generate SVG path points for a line chart
 * @param xValues X-axis values
 * @param yValues Y-axis values
 * @param maxY Maximum Y value for scaling
 * @param chartWidth Chart width
 * @param chartHeight Chart height
 * @param padding Chart padding
 * @returns SVG path string
 */
function generatePoints(
  xValues: number[], 
  yValues: number[], 
  maxY: number, 
  chartWidth: number, 
  chartHeight: number, 
  leftPadding: number
): string {
  // Start with the path's start point
  let path = '';
  
  // For the updated layout, we need to use the topPadding value for y-coordinate calculations
  const topPadding = 60; // Same as declared in chart generating functions
  
  // Build the main line path
  xValues.forEach((x, i) => {
    const xPos = leftPadding + (i * (chartWidth / (xValues.length - 1)));
    // Calculate y position with correct top padding reference
    const yPos = (chartHeight + topPadding) - ((yValues[i] / maxY) * chartHeight);
    
    if (i === 0) {
      path = `M ${xPos} ${yPos}`;
    } else {
      path += ` L ${xPos} ${yPos}`;
    }
  });
  
  // For filling area under the curve, add points to the bottom right and left
  // Use the actual chartWidth to determine the right edge
  const lastX = leftPadding + chartWidth;
  const bottomPadding = 40; // Same as declared in chart generating functions
  const lastY = chartHeight + topPadding;
  const firstX = leftPadding;
  
  path += ` L ${lastX} ${lastY} L ${firstX} ${lastY} Z`;
  
  return path;
}

/**
 * Generate Y-axis labels for a chart
 * @param maxValue Maximum value
 * @param count Number of labels
 * @param x X position
 * @param chartHeight Chart height
 * @param align Text alignment
 * @returns SVG markup for Y-axis labels
 */
function generateYAxisLabels(
  maxValue: number, 
  count: number, 
  x: number, 
  chartHeight: number, 
  align: 'left' | 'right'
): string {
  let labels = '';
  const step = maxValue / count;
  const textAnchor = align === 'left' ? 'end' : 'start';
  
  // Increased offset to provide more space for labels
  const xOffset = align === 'left' ? -15 : 15;
  
  // Use the same topPadding as in chart generating functions
  const topPadding = 60;
  
  for (let i = 0; i <= count; i++) {
    const value = i * step;
    // Adjust y position to account for top padding
    const y = topPadding + chartHeight - (i * (chartHeight / count));
    
    // Format large numbers in a more compact way (using K, M for thousands, millions)
    let formattedValue;
    if (value >= 1000000) {
      // For values in millions, display as "R X.XX M"
      formattedValue = `R ${(value / 1000000).toFixed(2)} M`;
    } else if (value >= 1000) {
      // For values in thousands, display as "R X.XX K"
      formattedValue = `R ${(value / 1000).toFixed(2)} K`;
    } else {
      // For values less than 1000, display as regular currency
      formattedValue = `R ${Math.round(value).toLocaleString('en-ZA')}`;
    }
    
    // Make "0" value clearly visible, not overlapped by axis
    if (value === 0) {
      // Add a small offset for zero value to avoid being cut off by x-axis
      labels += `<text x="${x + xOffset}" y="${y - 5}" text-anchor="${textAnchor}" font-family="Segoe UI" font-size="10">${formattedValue}</text>`;
    } else {
      labels += `<text x="${x + xOffset}" y="${y}" text-anchor="${textAnchor}" font-family="Segoe UI" font-size="10">${formattedValue}</text>`;
    }
  }
  
  return labels;
}