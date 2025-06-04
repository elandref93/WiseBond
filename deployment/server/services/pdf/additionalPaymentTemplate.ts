/**
 * Dynamic HTML template for additional payment report
 * 
 * This template is designed to generate a PDF report with the results 
 * of additional payment calculations.
 */

/**
 * Create a dynamic HTML template for additional payment report
 * Uses immediate execution of chart rendering to ensure charts are visible in PDF
 * @returns HTML template string
 */
export function createDynamicAdditionalPaymentTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Additional Payment Analysis</title>
  <style>
    /* Global styles */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Header styles */
    .header {
      padding: 20px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      max-height: 60px;
    }
    
    .report-title {
      color: #333;
      margin-top: 0;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: hsl(26, 79%, 51%);
    }
    
    /* Summary section */
    .summary-section {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin-top: 20px;
      border-left: 4px solid hsl(26, 79%, 51%);
    }
    
    .summary-title {
      margin-top: 0;
      color: #333;
    }
    
    /* Results section */
    .results-section {
      margin-top: 30px;
    }
    
    .results-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .result-card {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .result-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .result-value {
      font-size: 22px;
      font-weight: bold;
      color: hsl(26, 79%, 51%);
      margin: 0;
    }
    
    /* Chart section */
    .chart-section {
      margin-top: 15px;
    }
    
    .chart-container {
      height: 200px;
      margin-top: 10px;
    }
    
    /* Input details section */
    .input-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    
    .input-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .input-item {
      display: flex;
      justify-content: space-between;
    }
    
    .input-label {
      color: #666;
    }
    
    .input-value {
      font-weight: 500;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    
    /* Utility classes */
    .text-muted {
      color: #6c757d;
    }
    
    .text-primary {
      color: hsl(26, 79%, 51%);
    }
    
    .disclaimer {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      font-style: italic;
    }
    
    /* Canvas containers */
    #comparison-chart, #balance-chart {
      width: 100%;
      height: 200px;
    }
  </style>
  <!-- No external JavaScript dependencies needed for static SVG charts -->
  <style>
    .svg-container {
      width: 100%;
      height: 200px;
      margin: 0 auto;
    }
    .svg-container svg {
      width: 100%;
      height: 100%;
    }
  </style>
  <!-- No Chart.js initialization needed for static SVG charts -->
</head>
<body>
  <div class="container">
    <div class="header" style="padding: 5px 0; margin-bottom: 8px;">
      <div class="branding">
        <div class="company-name" style="font-size: 16px;">WiseBond</div>
        <div class="text-muted" style="font-size: 10px;">Bond Origination Specialists</div>
      </div>
      <div class="report-meta">
        <div class="report-title" style="font-size: 14px;">Additional Payment Analysis</div>
        <div class="text-muted" style="font-size: 10px;">Generated on {{generatedDate}}</div>
      </div>
    </div>
    
    <div class="summary-section" style="padding: 6px; margin-bottom: 8px;">
      <h2 class="summary-title" style="font-size: 14px; margin-top: 0; margin-bottom: 3px;">Additional Payment Summary</h2>
      <p style="font-size: 12px; margin: 0;">This report shows how making an additional monthly payment of {{additionalPayment}} can save you {{timeSaved}} off your loan term and {{interestSaved}} in interest payments.</p>
    </div>
    
    <div class="results-section" style="margin-top: 8px;">
      <h3 style="font-size: 14px; margin-top: 0; margin-bottom: 6px;">Analysis Results</h3>
      <div class="results-grid" style="gap: 8px; margin-top: 0;">
        {{resultCards}}
      </div>
    </div>
    
    <div class="chart-section">
      <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Payment Comparison</h3>
      <div style="display: flex; justify-content: center; width: 100%;">
        {{comparisonChart}}
      </div>
    </div>
    
    <div class="chart-section" style="margin-top: 20px;">
      <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Loan Balance Comparison</h3>
      <div style="display: flex; justify-content: center; width: 100%;">
        {{balanceComparisonChart}}
      </div>
    </div>
    
    <div class="input-section">
      <h3>Calculation Parameters</h3>
      <div class="input-grid">
        {{inputDetails}}
      </div>
    </div>
    
    <div class="disclaimer">
      This is an estimate based on the information provided. Actual amounts may vary depending on final approval from financial institutions and other factors.
    </div>
    
    <div class="footer">
      <p>WiseBond.co.za | Bond Origination Services | info@wisebond.co.za</p>
      <p>For more information or assistance, please visit our website or contact our customer service.</p>
    </div>
  </div>
  
  <!-- No JavaScript needed for static SVG charts -->
</body>
</html>`;
}