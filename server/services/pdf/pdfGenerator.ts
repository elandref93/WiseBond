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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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
    #chart-breakdown {
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
      const ctx = document.getElementById('chart-breakdown').getContext('2d');
      
      // Get the data from the template
      const principalAmount = {{principal}};
      const interestAmount = {{interest}};
      
      // Create the chart
      new Chart(ctx, {
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
  
  // Set chart data
  if (calculationResult) {
    const loanAmount = parseFloat(String(calculationResult.loanAmount)) || 0;
    const totalInterest = parseFloat(String(calculationResult.totalInterest)) || 0;
    
    html = html.replace('{{principal}}', loanAmount.toString());
    html = html.replace('{{interest}}', totalInterest.toString());
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