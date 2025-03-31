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
  
  // Format currency values using the same format as our y-axis labels
  let principalFormatted, interestFormatted;
  
  if (principal >= 1000000) {
    principalFormatted = `${(principal / 1000000).toFixed(2)} M`;
  } else if (principal >= 1000) {
    principalFormatted = `${(principal / 1000).toFixed(2)} K`;
  } else {
    principalFormatted = Math.round(principal).toLocaleString('en-ZA');
  }
  
  if (interest >= 1000000) {
    interestFormatted = `${(interest / 1000000).toFixed(2)} M`;
  } else if (interest >= 1000) {
    interestFormatted = `${(interest / 1000).toFixed(2)} K`;
  } else {
    interestFormatted = Math.round(interest).toLocaleString('en-ZA');
  }
  
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
    <g transform="translate(300, 120)">
      <!-- Principal legend -->
      <rect x="0" y="0" width="20" height="20" fill="hsl(210, 79%, 51%)" />
      <text x="30" y="15" font-family="Segoe UI" font-size="14">Principal</text>
      <text x="30" y="35" font-family="Segoe UI" font-size="12">R ${principalFormatted}</text>
      
      <!-- Interest legend -->
      <rect x="0" y="50" width="20" height="20" fill="hsl(26, 79%, 51%)" />
      <text x="30" y="65" font-family="Segoe UI" font-size="14">Interest</text>
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
  
  // Chart dimensions - increased width and left padding for y-axis labels
  const width = 750;
  const height = 300;
  const leftPadding = 70; // Increased padding for left labels
  const rightPadding = 70; // Increased padding for right labels
  const topBottomPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topBottomPadding * 2;
  
  // Generate chart points for each dataset
  const balancePoints = generatePoints(years, balance, maxBalance, chartWidth, chartHeight, leftPadding);
  const principalPoints = generatePoints(years, principalPaid, maxPaid, chartWidth, chartHeight, leftPadding);
  const interestPoints = generatePoints(years, interestPaid, maxPaid, chartWidth, chartHeight, leftPadding);
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- X and Y axes -->
    <line x1="${leftPadding}" y1="${height - topBottomPadding}" x2="${width - rightPadding}" y2="${height - topBottomPadding}" stroke="#333" stroke-width="1" />
    <line x1="${leftPadding}" y1="${topBottomPadding}" x2="${leftPadding}" y2="${height - topBottomPadding}" stroke="#333" stroke-width="1" />
    
    <!-- X-axis labels -->
    ${years.map((year, i) => {
      const x = leftPadding + (i * (chartWidth / (years.length - 1)));
      return `<text x="${x}" y="${height - topBottomPadding + 20}" text-anchor="middle" font-family="Segoe UI" font-size="10">${year}</text>`;
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
    
    <!-- Legend -->
    <g transform="translate(${leftPadding + 20}, ${topBottomPadding + 20})">
      <!-- Balance legend -->
      <line x1="0" y1="0" x2="20" y2="0" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
      <text x="30" y="5" font-family="Segoe UI" font-size="12">Outstanding Balance</text>
      
      <!-- Principal Paid legend -->
      <line x1="0" y1="20" x2="20" y2="20" stroke="hsl(26, 79%, 51%)" stroke-width="2" stroke-dasharray="5,5" />
      <text x="30" y="25" font-family="Segoe UI" font-size="12">Principal Paid</text>
      
      <!-- Interest Paid legend -->
      <line x1="0" y1="40" x2="20" y2="40" stroke="hsl(142, 76%, 36%)" stroke-width="2" stroke-dasharray="2,2" />
      <text x="30" y="45" font-family="Segoe UI" font-size="12">Interest Paid</text>
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
  // Chart dimensions - increased width and padding for y-axis labels
  const width = 750;
  const height = 300;
  const leftPadding = 70; // Increased padding for left labels
  const rightPadding = 40;
  const topBottomPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topBottomPadding * 2;
  
  // Find max value for scaling
  const maxValue = Math.max(...standardValues, ...additionalValues);
  
  // Bar width
  const groupWidth = chartWidth / labels.length;
  const barWidth = groupWidth * 0.4; // 40% of available width
  const spacing = groupWidth * 0.2; // 20% spacing
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- X and Y axes -->
    <line x1="${leftPadding}" y1="${height - topBottomPadding}" x2="${width - rightPadding}" y2="${height - topBottomPadding}" stroke="#333" stroke-width="1" />
    <line x1="${leftPadding}" y1="${topBottomPadding}" x2="${leftPadding}" y2="${height - topBottomPadding}" stroke="#333" stroke-width="1" />
    
    <!-- X-axis labels -->
    ${labels.map((label, i) => {
      const x = leftPadding + (i * groupWidth) + groupWidth/2;
      return `<text x="${x}" y="${height - topBottomPadding + 20}" text-anchor="middle" font-family="Segoe UI" font-size="10">${label}</text>`;
    }).join('')}
    
    <!-- Y-axis labels with more space for large numbers -->
    ${generateYAxisLabels(maxValue, 5, leftPadding, chartHeight, 'left')}
    
    <!-- Standard payment bars -->
    ${standardValues.map((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = leftPadding + (i * groupWidth) + spacing;
      const y = height - topBottomPadding - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="hsl(210, 79%, 51%)" />`;
    }).join('')}
    
    <!-- Additional payment bars -->
    ${additionalValues.map((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = leftPadding + (i * groupWidth) + spacing + barWidth;
      const y = height - topBottomPadding - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="hsl(26, 79%, 51%)" />`;
    }).join('')}
    
    <!-- Legend -->
    <g transform="translate(${leftPadding + 20}, ${topBottomPadding + 20})">
      <!-- Standard payment legend -->
      <rect x="0" y="0" width="15" height="15" fill="hsl(210, 79%, 51%)" />
      <text x="25" y="12" font-family="Segoe UI" font-size="12">Standard Bond</text>
      
      <!-- Additional payment legend -->
      <rect x="150" y="0" width="15" height="15" fill="hsl(26, 79%, 51%)" />
      <text x="175" y="12" font-family="Segoe UI" font-size="12">With Additional Payment</text>
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
  // Chart dimensions - increased width and padding for y-axis labels
  const width = 750;
  const height = 300;
  const leftPadding = 70; // Increased padding for left labels
  const rightPadding = 40;
  const topBottomPadding = 40;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topBottomPadding * 2;
  
  // Find the highest value for scaling
  const maxBalance = Math.max(...standardBalance, ...additionalBalance);
  
  // Generate chart points for each dataset
  const standardPoints = generatePoints(years, standardBalance, maxBalance, chartWidth, chartHeight, leftPadding);
  const additionalPoints = generatePoints(years, additionalBalance, maxBalance, chartWidth, chartHeight, leftPadding);
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- X and Y axes -->
    <line x1="${leftPadding}" y1="${height - topBottomPadding}" x2="${width - rightPadding}" y2="${height - topBottomPadding}" stroke="#333" stroke-width="1" />
    <line x1="${leftPadding}" y1="${topBottomPadding}" x2="${leftPadding}" y2="${height - topBottomPadding}" stroke="#333" stroke-width="1" />
    
    <!-- X-axis labels -->
    ${years.map((year, i) => {
      const x = leftPadding + (i * (chartWidth / (years.length - 1)));
      return `<text x="${x}" y="${height - topBottomPadding + 20}" text-anchor="middle" font-family="Segoe UI" font-size="10">${year}</text>`;
    }).join('')}
    
    <!-- Y-axis labels with more space for large numbers -->
    ${generateYAxisLabels(maxBalance, 5, leftPadding, chartHeight, 'left')}
    
    <!-- Standard balance line -->
    <path d="${standardPoints}" fill="rgba(59, 130, 246, 0.1)" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
    
    <!-- Additional payment balance line -->
    <path d="${additionalPoints}" fill="rgba(234, 88, 12, 0.1)" stroke="hsl(26, 79%, 51%)" stroke-width="2" />
    
    <!-- Legend -->
    <g transform="translate(${leftPadding + 20}, ${topBottomPadding + 20})">
      <!-- Standard balance legend -->
      <line x1="0" y1="0" x2="20" y2="0" stroke="hsl(210, 79%, 51%)" stroke-width="2" />
      <text x="30" y="5" font-family="Segoe UI" font-size="12">Standard Bond Balance</text>
      
      <!-- Additional payment balance legend -->
      <line x1="0" y1="20" x2="20" y2="20" stroke="hsl(26, 79%, 51%)" stroke-width="2" />
      <text x="30" y="25" font-family="Segoe UI" font-size="12">With Additional Payment</text>
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
  padding: number
): string {
  // Start with the path's start point
  let path = '';
  
  // Build the main line path
  xValues.forEach((x, i) => {
    const xPos = padding + (i * (chartWidth / (xValues.length - 1)));
    const yPos = (chartHeight + padding) - ((yValues[i] / maxY) * chartHeight);
    
    if (i === 0) {
      path = `M ${xPos} ${yPos}`;
    } else {
      path += ` L ${xPos} ${yPos}`;
    }
  });
  
  // For filling area under the curve, add points to the bottom right and left
  // Use the actual chartWidth to determine the right edge
  const lastX = padding + chartWidth;
  const lastY = chartHeight + padding;
  const firstX = padding;
  
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
  
  for (let i = 0; i <= count; i++) {
    const value = i * step;
    const y = chartHeight + 40 - (i * (chartHeight / count));
    
    // Format large numbers in a more compact way (using K, M for thousands, millions)
    let formattedValue;
    if (value >= 1000000) {
      // For values in millions, display as "R X.XX M"
      formattedValue = `R ${(value / 1000000).toFixed(2)} M`;
    } else if (value >= 1000) {
      // For values in thousands, display as "R X.XX K"
      formattedValue = `R ${(value / 1000).toFixed(2)} K`;
    } else {
      // For smaller values, display as regular currency
      formattedValue = `R ${Math.round(value).toLocaleString('en-ZA')}`;
    }
    
    labels += `<text x="${x + xOffset}" y="${y}" text-anchor="${textAnchor}" font-family="Segoe UI" font-size="10">${formattedValue}</text>`;
  }
  
  return labels;
}