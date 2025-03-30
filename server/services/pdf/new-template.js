function createDynamicAdditionalPaymentTemplate() {
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
      margin-top: 30px;
    }
    
    .chart-container {
      height: 300px;
      margin-top: 20px;
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
      height: 300px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="branding">
        <div class="company-name">WiseBond</div>
        <div class="text-muted">Bond Origination Specialists</div>
      </div>
      <div class="report-meta">
        <div class="report-title">Additional Payment Analysis</div>
        <div class="text-muted">Generated on {{generatedDate}}</div>
      </div>
    </div>
    
    <div class="summary-section">
      <h2 class="summary-title">Additional Payment Summary</h2>
      <p>This report shows how making an additional monthly payment of {{additionalPayment}} can save you {{timeSaved}} off your loan term and {{interestSaved}} in interest payments.</p>
    </div>
    
    <div class="results-section">
      <h3>Analysis Results</h3>
      <div class="results-grid">
        {{resultCards}}
      </div>
    </div>
    
    <div class="chart-section">
      <h3>Payment Comparison</h3>
      <div class="chart-container">
        <canvas id="comparison-chart"></canvas>
      </div>
    </div>
    
    <div class="chart-section">
      <h3>Loan Balance Comparison</h3>
      <div class="chart-container">
        <canvas id="balance-chart"></canvas>
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
  
  <script>
    // Get chart data from the template
    const standardPayment = {{standardPayment}};
    const newPayment = {{newPayment}};
    const standardTerm = {{standardTerm}};
    const newTerm = {{newTerm}};
    const standardInterest = {{standardInterest}};
    const newInterest = {{newInterest}};
    
    const years = {{balanceYears}};
    const standardBalance = {{standardBalance}};
    const additionalBalance = {{additionalBalance}};
    
    console.log('Chart data:', {
      standardPayment, newPayment, standardTerm, newTerm, standardInterest, newInterest,
      years, standardBalance, additionalBalance
    });
    
    // Function to render charts
    function renderCharts() {
      console.log('Rendering charts for PDF');
      
      // Payment Comparison Chart
      const comparisonCanvas = document.getElementById('comparison-chart');
      if (comparisonCanvas) {
        new Chart(comparisonCanvas, {
          type: 'bar',
          data: {
            labels: ['Monthly Payment', 'Loan Term (Months)', 'Total Interest Paid'],
            datasets: [
              {
                label: 'Standard Bond',
                data: [standardPayment, standardTerm, standardInterest],
                backgroundColor: 'hsl(210, 79%, 51%)',
                borderColor: 'hsl(210, 79%, 51%)',
                borderWidth: 1
              },
              {
                label: 'With Additional Payment',
                data: [newPayment, newTerm, newInterest],
                backgroundColor: 'hsl(26, 79%, 51%)',
                borderColor: 'hsl(26, 79%, 51%)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                position: 'top'
              }
            }
          }
        });
        console.log('Comparison chart rendered');
      } else {
        console.error('Comparison chart canvas not found');
      }
      
      // Balance Comparison Chart
      const balanceCanvas = document.getElementById('balance-chart');
      if (balanceCanvas) {
        new Chart(balanceCanvas, {
          type: 'line',
          data: {
            labels: years,
            datasets: [
              {
                label: 'Standard Bond Balance',
                data: standardBalance,
                borderColor: 'hsl(210, 79%, 51%)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'With Additional Payment',
                data: additionalBalance,
                borderColor: 'hsl(26, 79%, 51%)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Loan Balance (R)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Year'
                }
              }
            },
            plugins: {
              legend: {
                position: 'top'
              }
            }
          }
        });
        console.log('Balance chart rendered');
      } else {
        console.error('Balance chart canvas not found');
      }
    }
    
    // Execute charts rendering immediately for PDF generation
    renderCharts();
  </script>
</body>
</html>`;
}
