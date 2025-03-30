/**
 * PDF Generator Service
 * 
 * This service handles the generation of PDF reports using Puppeteer
 * It renders HTML templates and converts them to PDFs with charts and styling
 */

import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CalculationResult as DBCalculationResult } from '../../../shared/schema';
import { CalculationResult } from '../../../client/src/lib/calculators';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PDF generation options
interface PdfGenerationOptions {
  title?: string;
  includeDate?: boolean;
  includeTimestamp?: boolean;
  orientation?: 'portrait' | 'landscape';
  footerTemplate?: string;
}

// Default options
const defaultOptions: PdfGenerationOptions = {
  title: 'WiseBond Report',
  includeDate: true,
  includeTimestamp: false,
  orientation: 'portrait',
  footerTemplate: '<div style="width: 100%; font-size: 8px; text-align: center; color: #999; padding: 10px;">' +
                  '<span>WiseBond | www.wisebond.co.za | Generated on {{date}}</span>' +
                  '<span style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>' +
                  '</div>'
};

/**
 * Generate a PDF from HTML content
 * @param htmlContent HTML content to be rendered to PDF
 * @param options PDF generation options
 * @returns Buffer containing the PDF file
 */
export async function generatePdfFromHtml(
  htmlContent: string, 
  options: PdfGenerationOptions = {}
): Promise<Buffer> {
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Format date for the footer if needed
  if (mergedOptions.includeDate && mergedOptions.footerTemplate) {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    mergedOptions.footerTemplate = mergedOptions.footerTemplate.replace('{{date}}', formattedDate);
    
    if (mergedOptions.includeTimestamp) {
      const formattedTime = date.toLocaleTimeString('en-ZA');
      mergedOptions.footerTemplate = mergedOptions.footerTemplate.replace('{{time}}', formattedTime);
    }
  }
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: mergedOptions.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>', // Empty header
      footerTemplate: mergedOptions.footerTemplate || '',
    });
    
    // Convert Uint8Array to Buffer if needed
    return Buffer.from(pdfBuffer);
  } finally {
    // Always close the browser
    await browser.close();
  }
}

/**
 * Generate a PDF report for bond repayment calculation
 * @param calculationResult The result of the bond repayment calculation
 * @param inputData Original input data for the calculation
 * @param options PDF generation options
 * @returns Buffer containing the PDF file
 */
export async function generateBondRepaymentPdf(
  calculationResult: CalculationResult,
  inputData: any,
  options: PdfGenerationOptions = {}
): Promise<Buffer> {
  // Use the dynamic template as the primary source
  // This avoids filesystem issues with different environments
  let templateHtml = createDynamicBondRepaymentTemplate();
  
  // Generate HTML content for the PDF
  const htmlContent = renderBondRepaymentTemplate(templateHtml, calculationResult, inputData);
  
  // Set title for the report
  const title = options.title || 'Bond Repayment Calculation';
  const pdfOptions = {
    ...options,
    title
  };
  
  // Generate the PDF
  return generatePdfFromHtml(htmlContent, pdfOptions);
}

/**
 * Create a dynamic HTML template for bond repayment report
 * @returns HTML template string
 */
function createDynamicBondRepaymentTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bond Repayment Report</title>
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
    
    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: #f9f9f9;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    
    /* Chart styles */
    #chart-breakdown, #chart-overview {
      width: 100%;
      height: 300px;
    }
    
    /* Table container styles */
    .table-container {
      margin-top: 20px;
      overflow-x: auto;
    }
    
    /* Yearly breakdown table */
    .yearly-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    .yearly-table th {
      background-color: hsl(26, 79%, 51%);
      color: white;
      font-weight: 600;
      padding: 10px;
      text-align: left;
    }
    
    .yearly-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #ddd;
    }
    
    .yearly-table tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    
    .yearly-table tr:hover {
      background-color: #f0f0f0;
    }
    
    /* Section spacing */
    .yearly-breakdown-section, .loan-overview-section {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #eee;
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
        <div class="report-title">Bond Repayment Report</div>
        <div class="text-muted">Generated on {{generatedDate}}</div>
      </div>
    </div>
    
    <div class="summary-section">
      <h2 class="summary-title">Bond Repayment Summary</h2>
      <p>This report provides a detailed analysis of your bond repayment calculation, including monthly installments, total interest paid, and payment breakdown over the loan term.</p>
    </div>
    
    <div class="results-section">
      <h3>Calculation Results</h3>
      <div class="results-grid">
        {{resultCards}}
      </div>
    </div>
    
    <div class="chart-section">
      <h3>Payment Breakdown</h3>
      <div class="chart-container">
        <canvas id="chart-breakdown"></canvas>
      </div>
    </div>
    
    <div class="loan-overview-section">
      <h3>Loan Overview</h3>
      <div class="chart-container">
        <canvas id="chart-overview"></canvas>
      </div>
    </div>
    
    <div class="yearly-breakdown-section">
      <h3>Yearly Breakdown</h3>
      <div class="table-container">
        <table class="yearly-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Opening Balance</th>
              <th>Interest Paid</th>
              <th>Principal Paid</th>
              <th>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {{yearlyData}}
          </tbody>
        </table>
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
    document.addEventListener('DOMContentLoaded', function() {
      // Payment Breakdown Pie Chart
      const ctxBreakdown = document.getElementById('chart-breakdown').getContext('2d');
      
      // Get the data from the template
      const principalAmount = {{principal}};
      const interestAmount = {{interest}};
      
      // Create the pie chart
      new Chart(ctxBreakdown, {
        type: 'pie',
        data: {
          labels: ['Principal', 'Interest'],
          datasets: [{
            data: [principalAmount, interestAmount],
            backgroundColor: [
              'hsl(210, 79%, 51%)',
              'hsl(26, 79%, 51%)'
            ],
            borderColor: [
              '#ffffff',
              '#ffffff'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                font: {
                  family: 'Segoe UI'
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': R ' + context.raw.toLocaleString('en-ZA');
                }
              }
            }
          }
        }
      });
      
      // Loan Overview Line Chart
      const ctxOverview = document.getElementById('chart-overview').getContext('2d');
      
      // Get the yearly data from the template
      const yearlyLabels = {{yearLabels}};
      const principalPaid = {{principalPaidData}};
      const interestPaid = {{interestPaidData}};
      const balanceData = {{balanceData}};
      
      // Create the line chart
      new Chart(ctxOverview, {
        type: 'line',
        data: {
          labels: yearlyLabels,
          datasets: [
            {
              label: 'Outstanding Balance',
              data: balanceData,
              borderColor: 'hsl(210, 79%, 51%)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: 'Principal Paid',
              data: principalPaid,
              borderColor: 'hsl(26, 79%, 51%)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              yAxisID: 'y1'
            },
            {
              label: 'Interest Paid',
              data: interestPaid,
              borderColor: 'hsl(142, 76%, 36%)',
              borderWidth: 2,
              borderDash: [2, 2],
              fill: false,
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: {
                  family: 'Segoe UI'
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': R ' + context.raw.toLocaleString('en-ZA');
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Outstanding Balance'
              },
              ticks: {
                callback: function(value) {
                  return 'R ' + value.toLocaleString('en-ZA');
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Amount Paid'
              },
              ticks: {
                callback: function(value) {
                  return 'R ' + value.toLocaleString('en-ZA');
                }
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Render the template with the calculation data
 * @param template HTML template string
 * @param calculationResult Calculation result data
 * @param inputData Original input data
 * @returns Completed HTML content
 */
function renderBondRepaymentTemplate(
  template: string, 
  calculationResult: CalculationResult,
  inputData: any
): string {
  let html = template;
  
  // Format date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  html = html.replace('{{generatedDate}}', formattedDate);
  
  // Generate result cards
  let resultCardsHtml = '';
  if (calculationResult.displayResults) {
    calculationResult.displayResults.forEach(result => {
      resultCardsHtml += `
        <div class="result-card">
          <div class="result-label">${result.label}</div>
          <div class="result-value">${result.value}</div>
        </div>
      `;
    });
  }
  html = html.replace('{{resultCards}}', resultCardsHtml);
  
  // Generate input details
  let inputDetailsHtml = '';
  if (inputData) {
    // Add property value
    if (inputData.propertyValue) {
      inputDetailsHtml += `
        <div class="input-item">
          <span class="input-label">Property Value:</span>
          <span class="input-value">R ${parseFloat(inputData.propertyValue).toLocaleString('en-ZA')}</span>
        </div>
      `;
    }
    
    // Add interest rate
    if (inputData.interestRate) {
      inputDetailsHtml += `
        <div class="input-item">
          <span class="input-label">Interest Rate:</span>
          <span class="input-value">${inputData.interestRate}%</span>
        </div>
      `;
    }
    
    // Add loan term
    if (inputData.loanTerm) {
      inputDetailsHtml += `
        <div class="input-item">
          <span class="input-label">Loan Term:</span>
          <span class="input-value">${inputData.loanTerm} years</span>
        </div>
      `;
    }
    
    // Add deposit
    if (inputData.deposit) {
      inputDetailsHtml += `
        <div class="input-item">
          <span class="input-label">Deposit Amount:</span>
          <span class="input-value">R ${parseFloat(inputData.deposit).toLocaleString('en-ZA')}</span>
        </div>
      `;
    }
  }
  html = html.replace('{{inputDetails}}', inputDetailsHtml);
  
  // Set chart data and prepare values for calculations
  if (calculationResult) {
    // Import the amortization utility functions - implement the calculation here directly
    // to avoid import path issues between client/server
    const generateAmortizationData = (
      loanAmount: number,
      interestRate: number,
      loanTerm: number
    ) => {
      // Calculate monthly payment function
      const calculateMonthlyPayment = (
        principal: number, 
        interestRate: number, 
        termYears: number
      ): number => {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = termYears * 12;
        return (
          (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        );
      };

      const data: Array<{
        year: number;
        principal: number;
        interest: number;
        balance: number;
        cumulativePrincipal?: number;
        cumulativeInterest?: number;
      }> = [];
      
      let remainingBalance = loanAmount;
      let cumulativeInterest = 0;
      let cumulativePrincipal = 0;

      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

      // Calculate yearly data
      for (let year = 0; year <= loanTerm; year++) {
        if (year === 0) {
          // Starting point
          data.push({
            year,
            principal: 0,
            interest: 0,
            balance: loanAmount,
            cumulativePrincipal: 0,
            cumulativeInterest: 0
          });
          continue;
        }

        let yearlyPrincipal = 0;
        let yearlyInterest = 0;

        // Calculate monthly payments for the year
        for (let month = 1; month <= 12; month++) {
          if ((year - 1) * 12 + month <= loanTerm * 12) {
            const monthlyInterest = remainingBalance * (interestRate / 100 / 12);
            const monthlyPrincipal = monthlyPayment - monthlyInterest;

            yearlyInterest += monthlyInterest;
            yearlyPrincipal += monthlyPrincipal;
            remainingBalance -= monthlyPrincipal;

            // Prevent negative balance from floating point errors
            if (remainingBalance < 0.01) remainingBalance = 0;
          }
        }

        cumulativeInterest += yearlyInterest;
        cumulativePrincipal += yearlyPrincipal;

        data.push({
          year,
          principal: yearlyPrincipal,
          interest: yearlyInterest,
          balance: Math.max(0, remainingBalance),
          cumulativePrincipal,
          cumulativeInterest
        });
      }

      return data;
    };
    
    // Helper function to parse currency values
    const parseCurrencyValue = (value: string | number | undefined): number => {
      if (!value) return 0;
      const valueStr = String(value).replace(/R\s*/g, '').replace(/,/g, '').trim();
      return parseFloat(valueStr) || 0;
    };
    
    // Calculate loan amount from input values - property value minus deposit
    let loanAmount = 0;
    if (inputData && inputData.propertyValue) {
      const propertyValue = parseCurrencyValue(inputData.propertyValue);
      const deposit = parseCurrencyValue(inputData.deposit || 0);
      loanAmount = propertyValue - deposit;
    } else if (calculationResult.loanAmount) {
      // Fallback to calculation result if input data isn't available
      loanAmount = parseCurrencyValue(calculationResult.loanAmount);
    }
    
    // Parse other values with currency format handling
    const totalInterest = parseCurrencyValue(calculationResult.totalInterest);
    const totalRepayment = parseCurrencyValue(calculationResult.totalRepayment);
    const monthlyPayment = parseCurrencyValue(calculationResult.monthlyPayment);
    
    // Add principal and interest values to the template for pie chart
    html = html.replace('{{principal}}', loanAmount.toString());
    html = html.replace('{{interest}}', totalInterest.toString());
    
    // Generate yearly breakdown data - using only values from the input data, with fallbacks to calculation results
    const loanTerm = inputData?.loanTerm 
      ? parseInt(String(inputData.loanTerm)) 
      : parseInt(String(calculationResult.loanTerm) || '20');
      
    const interestRate = inputData?.interestRate 
      ? parseFloat(String(inputData.interestRate)) 
      : parseFloat(String(calculationResult.interestRate || '0').replace('%', ''));
    
    // =====================================================================
    // IMPORTANT: Use the SHARED UTILITY - same as the frontend components
    // =====================================================================
    
    // Generate amortization data using the shared utility function
    const amortizationData = generateAmortizationData(loanAmount, interestRate, loanTerm);
    
    // Extract data for the chart and table
    const yearlyLabels = amortizationData.map((item: {year: number}) => item.year);
    const yearlyBalances = amortizationData.map((item: {balance: number}) => item.balance);
    const yearlyPrincipalPaid = amortizationData.map((item: {principal: number}) => item.principal);
    const yearlyInterestPaid = amortizationData.map((item: {interest: number}) => item.interest);
    
    // Generate HTML for the yearly breakdown table
    let yearlyTableRows = '';
    
    amortizationData.forEach((yearData: {
      year: number;
      principal: number;
      interest: number;
      balance: number;
    }) => {
      const openingBalance = yearData.year === 0 
        ? loanAmount 
        : (yearData.balance + yearData.principal); // Opening balance is closing balance + principal paid
      
      yearlyTableRows += `
        <tr>
          <td>${yearData.year}</td>
          <td>R ${openingBalance.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</td>
          <td>R ${yearData.interest.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</td>
          <td>R ${yearData.principal.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</td>
          <td>R ${yearData.balance.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    });
    
    // Add yearly data to template
    html = html.replace('{{yearlyData}}', yearlyTableRows);
    
    // Add chart data
    html = html.replace('{{yearLabels}}', JSON.stringify(yearlyLabels));
    html = html.replace('{{balanceData}}', JSON.stringify(yearlyBalances));
    html = html.replace('{{principalPaidData}}', JSON.stringify(yearlyPrincipalPaid));
    html = html.replace('{{interestPaidData}}', JSON.stringify(yearlyInterestPaid));
  }
  
  return html;
}

/**
 * Save PDF to a temporary file
 * @param pdfBuffer PDF file buffer
 * @param filename Optional filename (default: temp-file.pdf)
 * @returns Path to the saved file
 */
export function savePdfToTempFile(pdfBuffer: Buffer, filename = 'wisebond-report.pdf'): string {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, filename);
  
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}