/**
 * PDF Generator Service
 * 
 * This service handles the generation of PDF reports using Puppeteer
 * It renders HTML templates and converts them to PDFs with charts and styling
 */

import puppeteer from 'puppeteer';
import { 
  generatePaymentBreakdownSvg,
  generateLoanOverviewSvg,
  generateComparisonBarChartSvg,
  generateBalanceComparisonSvg
} from './staticCharts';
import * as path from 'path';
import * as fs from 'fs';
import { createDynamicAdditionalPaymentTemplate } from './additionalPaymentTemplate';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CalculationResult as DBCalculationResult } from '../../../shared/schema';
import { CalculationResult } from '../../../client/src/lib/calculators';
import { generateAmortizationData } from '../../../client/src/lib/amortizationUtils';

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
    
    // No chart initialization needed with static SVGs
    console.log('Using static SVG charts, no initialization required');
    
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
  <!-- No external JavaScript dependencies needed for static SVG charts -->
  <style>
    .svg-container {
      width: 100%;
      height: 300px;
      margin: 0 auto;
    }
    .svg-container svg {
      width: 100%;
      height: 100%;
    }
  </style>
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
      <div class="svg-container">
        {{paymentBreakdownChart}}
      </div>
    </div>
    
    <div class="loan-overview-section">
      <h3>Loan Overview</h3>
      <div class="svg-container">
        {{loanOverviewChart}}
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
    
    // Generate the static SVG charts
    const paymentBreakdownChart = generatePaymentBreakdownSvg(loanAmount, totalInterest);
    html = html.replace('{{paymentBreakdownChart}}', paymentBreakdownChart);
    
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
    const fullAmortizationData = generateAmortizationData(loanAmount, interestRate, loanTerm);
    
    // Include year 0 in the chart data as requested
    const amortizationData = fullAmortizationData;
    
    // Extract data for the chart and table - including year 0
    const yearlyLabels = amortizationData.map((item: {year: number}) => item.year);
    const yearlyBalances = amortizationData.map((item: {balance: number}) => item.balance);
    
    // For the chart, we need to use cumulative values (as in the frontend)
    // to match what the user sees on the website
    const yearlyPrincipalPaid = amortizationData.map((item: {
      principal: number;
      cumulativePrincipal?: number;
    }) => item.cumulativePrincipal || 0);
    
    const yearlyInterestPaid = amortizationData.map((item: {
      interest: number;
      cumulativeInterest?: number;
    }) => item.cumulativeInterest || 0);
    
    // Generate HTML for the yearly breakdown table
    let yearlyTableRows = '';
    
    // Filter out Year 0 from the yearly breakdown table as per user requirement
    // Year 0 should be included in charts but excluded from yearly breakdown tables in PDF reports
    const filteredData = amortizationData.filter(yearData => yearData.year > 0);
    
    filteredData.forEach((yearData: {
      year: number;
      principal: number;
      interest: number;
      balance: number;
    }) => {
      // Calculate opening balance
      let openingBalance;
      
      if (yearData.year === 1) {
        // First year opening balance is the loan amount
        openingBalance = loanAmount;
      } else {
        // For other years, opening balance is closing balance + principal paid from previous year
        openingBalance = yearData.balance + yearData.principal;
      }
      
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
    
    // Generate the loan overview chart using the static chart utility
    const loanOverviewChart = generateLoanOverviewSvg(
      yearlyLabels,
      yearlyBalances,
      yearlyPrincipalPaid,
      yearlyInterestPaid
    );
    html = html.replace('{{loanOverviewChart}}', loanOverviewChart);
  }
  
  return html;
}

/**
 * Save PDF to a temporary file
 * @param pdfBuffer PDF file buffer
 * @param filename Optional filename (default: temp-file.pdf)
 * @returns Path to the saved file
 */
/**
 * Generate a PDF report for additional payment calculation
 * @param calculationResult The result of the additional payment calculation
 * @param inputData Original input data for the calculation
 * @param options PDF generation options
 * @returns Buffer containing the PDF file
 */
export async function generateAdditionalPaymentPdf(
  calculationResult: CalculationResult,
  inputData: any,
  options: PdfGenerationOptions = {}
): Promise<Buffer> {
  try {
    console.log("Generating additional payment PDF with calculation result:", JSON.stringify(calculationResult));
    console.log("Input data:", JSON.stringify(inputData));
    
    // Create the HTML template using the imported implementation
    // This provides better Chart.js integration for PDF generation
    let templateHtml = createDynamicAdditionalPaymentTemplate();
    
    // Generate HTML content for the PDF
    const htmlContent = renderAdditionalPaymentTemplate(templateHtml, calculationResult, inputData);
    
    // Set title for the report
    const title = options.title || 'Additional Payment Calculation';
    const pdfOptions = {
      ...options,
      title
    };
    
    // Generate the PDF with longer wait times for chart rendering
    console.log("Generating PDF from HTML with chart.js content");
    return await generatePdfFromHtml(htmlContent, pdfOptions);
  } catch (error) {
    console.error("Error in generateAdditionalPaymentPdf:", error);
    throw error;
  }
}

/**
 * Create a dynamic HTML template for additional payment report
 * @returns HTML template string
 */
// Using the external implementation imported at the top
function _createDynamicAdditionalPaymentTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Additional Payment Report</title>
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
    
    /* Comparison section */
    .comparison-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .comparison-card {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
    }
    
    .comparison-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
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
    
    .text-success {
      color: #28a745;
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
    #comparison-chart, #balance-chart {
      width: 100%;
      height: 300px;
    }
    
    /* Table container styles */
    .table-container {
      margin-top: 20px;
      overflow-x: auto;
    }
    
    /* Comparison table */
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    .comparison-table th {
      background-color: hsl(26, 79%, 51%);
      color: white;
      font-weight: 600;
      padding: 10px;
      text-align: left;
    }
    
    .comparison-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #ddd;
    }
    
    .comparison-table tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    
    .comparison-table tr:hover {
      background-color: #f0f0f0;
    }
    
    /* Highlight row for savings */
    .highlight-row {
      background-color: #e8f4f8 !important;
      font-weight: bold;
    }
    
    /* Section spacing */
    .yearly-comparison-section, .balance-chart-section {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
    
    /* Savings highlight */
    .savings-highlight {
      background-color: #e8f4f8;
      padding: 15px;
      border-radius: 5px;
      margin-top: 25px;
      border-left: 4px solid #28a745;
    }
    
    .savings-title {
      color: #28a745;
      margin-top: 0;
      font-weight: bold;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
  <script>
    // Define variable to avoid TypeScript errors
    let ChartDataLabels;
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="branding">
        <div class="company-name">WiseBond</div>
        <div class="text-muted">Bond Origination Specialists</div>
      </div>
      <div class="report-meta">
        <div class="report-title">Additional Payment Report</div>
        <div class="text-muted">Generated on {{generatedDate}}</div>
      </div>
    </div>
    
    <div class="summary-section">
      <h2 class="summary-title">Additional Payment Summary</h2>
      <p>This report provides a detailed analysis of how making additional monthly payments on your bond can save you time and money over the loan term.</p>
    </div>
    
    <div class="results-section">
      <h3>Calculation Results</h3>
      <div class="results-grid">
        {{resultCards}}
      </div>
    </div>
    
    <div class="savings-highlight">
      <h3 class="savings-title">Your Savings Summary</h3>
      <p>By making an additional payment of {{additionalPayment}} each month, you will:</p>
      <ul>
        <li><strong>Save {{timeSaved}} of payments</strong> on your bond term</li>
        <li><strong>Save {{interestSaved}} in interest payments</strong> over the life of the loan</li>
      </ul>
    </div>
    
    <div class="chart-section">
      <h3>Payment Comparison</h3>
      <div class="chart-container">
        <canvas id="comparison-chart"></canvas>
      </div>
    </div>
    
    <div class="balance-chart-section">
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
    // Immediately execute chart creation for PDF generation
    // We can't rely on DOMContentLoaded for PDFs since Puppeteer needs to render immediately
    function initCharts() {
      try {
        console.log('Initializing charts for PDF...');
        
        // Register the Chart.js datalabels plugin
        Chart.register(ChartDataLabels);
        
        // Payment Comparison Chart - Bar chart
        const ctxComparison = document.getElementById('comparison-chart');
        if (!ctxComparison) {
          console.error('Comparison chart canvas not found');
          return;
        }
        const comparisonContext = ctxComparison.getContext('2d');
        
        // Get the data from the template
        const standardPayment = {{standardPayment}};
        const newPayment = {{newPayment}};
        const standardTerm = {{standardTerm}};
        const newTerm = {{newTerm}};
        const standardInterest = {{standardInterest}};
        const newInterest = {{newInterest}};
        
        console.log('Chart data:', {
          standardPayment, newPayment, standardTerm, newTerm, standardInterest, newInterest
        });
        
        // Create the bar chart
        new Chart(ctxComparison, {
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
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  // Format based on which data point we're showing
                  if (this.chart.data.labels[this.chart.tooltip.dataPoints[0].dataIndex] === 'Monthly Payment' || 
                      this.chart.data.labels[this.chart.tooltip.dataPoints[0].dataIndex] === 'Total Interest Paid') {
                    return 'R ' + value.toLocaleString('en-ZA');
                  } else {
                    return value.toLocaleString('en-ZA');
                  }
                }
              }
            }
          },
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
                  // Format tooltip based on which data point we're showing
                  if (context.chart.data.labels[context.dataIndex] === 'Monthly Payment' || 
                      context.chart.data.labels[context.dataIndex] === 'Total Interest Paid') {
                    return context.dataset.label + ': R ' + context.raw.toLocaleString('en-ZA');
                  } else {
                    return context.dataset.label + ': ' + context.raw.toLocaleString('en-ZA') + ' months';
                  }
                }
              }
            }
          }
        }
      });
      
      // Loan Balance Comparison Chart - Line chart
      const ctxBalance = document.getElementById('balance-chart').getContext('2d');
      
      // Get the data from the template
      const years = {{balanceYears}};
      const standardBalance = {{standardBalance}};
      const additionalBalance = {{additionalBalance}};
      
      // Create the line chart
      new Chart(ctxBalance, {
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
              },
              ticks: {
                callback: function(value) {
                  return 'R ' + value.toLocaleString('en-ZA');
                }
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
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': R ' + context.raw.toLocaleString('en-ZA');
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
 * Render the template with the additional payment calculation data
 * @param template HTML template string
 * @param calculationResult Calculation result data
 * @param inputData Original input data
 * @returns Completed HTML content
 */
function renderAdditionalPaymentTemplate(
  template: string,
  calculationResult: CalculationResult,
  inputData: any
): string {
  try {
    console.log("Rendering additional payment template with calculation result:", 
      JSON.stringify(calculationResult, null, 2));
    console.log("Input data:", JSON.stringify(inputData, null, 2));
    
    let htmlContent = template;
    
    // Format current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    htmlContent = htmlContent.replace('{{generatedDate}}', formattedDate);
    
    // Get result cards
    let resultCardsHtml = '';
    for (const result of calculationResult.displayResults) {
      resultCardsHtml += `
        <div class="result-card">
          <div class="result-label">${result.label}</div>
          <div class="result-value">${result.value}</div>
        </div>`;
    }
    
    htmlContent = htmlContent.replace('{{resultCards}}', resultCardsHtml);
    
    // Get values from calculationResult if not in inputData
    const loanAmount = inputData.loanAmount || calculationResult.loanAmount || 900000;
    const interestRate = inputData.interestRate || calculationResult.interestRate || 11.25;
    const loanTerm = inputData.loanTerm || (calculationResult.loanTermYears ? calculationResult.loanTermYears.toString() : "20");
    const additionalPayment = inputData.additionalPayment || calculationResult.additionalPayment || 1000;
    
    console.log("Using values:", { loanAmount, interestRate, loanTerm, additionalPayment });
    
    // Format calculation parameters
    const numLoanAmount = typeof loanAmount === 'string' 
      ? parseFloat(loanAmount.replace(/[^0-9.]/g, '')) 
      : loanAmount;
      
    const numInterestRate = typeof interestRate === 'string'
      ? parseFloat(interestRate)
      : interestRate;
      
    const numLoanTerm = typeof loanTerm === 'string'
      ? parseInt(loanTerm)
      : loanTerm;
      
    const numAdditionalPayment = typeof additionalPayment === 'string'
      ? parseFloat(additionalPayment.replace(/[^0-9.]/g, ''))
      : additionalPayment;
    
    // Format input details
    const inputDetails = `
      <div class="input-item">
        <span class="input-label">Loan Amount:</span>
        <span class="input-value">R${numLoanAmount.toLocaleString('en-ZA')}</span>
      </div>
      <div class="input-item">
        <span class="input-label">Interest Rate:</span>
        <span class="input-value">${numInterestRate}%</span>
      </div>
      <div class="input-item">
        <span class="input-label">Loan Term:</span>
        <span class="input-value">${numLoanTerm} years</span>
      </div>
      <div class="input-item">
        <span class="input-label">Additional Payment:</span>
        <span class="input-value">R${numAdditionalPayment.toLocaleString('en-ZA')}</span>
      </div>`;
    
    htmlContent = htmlContent.replace('{{inputDetails}}', inputDetails);
    
    // Extract values from the calculation result
    const standardMonthlyPayment = calculationResult.standardMonthlyPayment || 0;
    const newMonthlyPayment = calculationResult.newMonthlyPayment || 0;
    
    // Use provided values or calculate if missing
    const standardLoanTermMonths = calculationResult.standardLoanTermMonths || numLoanTerm * 12;
    const newLoanTermMonths = calculationResult.newTermMonths || 0;
    
    // For chart data - use provided values or calculate if missing
    const totalStandardInterest = calculationResult.totalStandardInterest || 
      ((standardMonthlyPayment * standardLoanTermMonths) - numLoanAmount);
    
    const totalNewInterest = calculationResult.totalNewInterest || 
      ((newMonthlyPayment * newLoanTermMonths) - numLoanAmount);
    
    const timeSavedMonths = calculationResult.timeSavedMonths || 0;
    const interestSaved = calculationResult.interestSaved || 0;
    
    console.log("Chart data values:", {
      standardMonthlyPayment,
      newMonthlyPayment,
      standardLoanTermMonths,
      newLoanTermMonths,
      totalStandardInterest,
      totalNewInterest
    });
    
    // Format time saved for display
    let timeSavedText = '';
    if (timeSavedMonths >= 12) {
      const years = Math.floor(timeSavedMonths / 12);
      const months = timeSavedMonths % 12;
      timeSavedText = `${years} ${years === 1 ? 'year' : 'years'}`;
      if (months > 0) {
        timeSavedText += ` and ${months} ${months === 1 ? 'month' : 'months'}`;
      }
    } else {
      timeSavedText = `${timeSavedMonths} ${timeSavedMonths === 1 ? 'month' : 'months'}`;
    }
    
    // Format interest saved for display
    const interestSavedFormatted = `R${Math.round(interestSaved).toLocaleString('en-ZA')}`;
    
    // Add savings information
    htmlContent = htmlContent.replace('{{additionalPayment}}', `R${numAdditionalPayment.toLocaleString('en-ZA')}`);
    htmlContent = htmlContent.replace('{{timeSaved}}', timeSavedText);
    htmlContent = htmlContent.replace('{{interestSaved}}', interestSavedFormatted);
    
    // Generate static SVG charts
    const labels = ['Monthly Payment', 'Loan Term (Months)', 'Total Interest Paid'];
    const standardValues = [standardMonthlyPayment, standardLoanTermMonths, totalStandardInterest];
    const additionalValues = [newMonthlyPayment, newLoanTermMonths, totalNewInterest];
    
    // Generate the comparison bar chart
    const comparisonChart = generateComparisonBarChartSvg(
      labels,
      standardValues,
      additionalValues
    );
    
    // Insert the SVG chart into the template
    htmlContent = htmlContent.replace('{{comparisonChart}}', comparisonChart);
    
    // Generate balance comparison data
    const fullStandardData = generateAmortizationData(numLoanAmount, numInterestRate, numLoanTerm);
    
    // Include year 0 in the chart data
    const standardData = fullStandardData;
    
    // Calculate custom amortization for the case with additional payment
    const standardMonthlyRate = numInterestRate / 100 / 12;
    const standardMonthlyPaymentCalc = (numLoanAmount * standardMonthlyRate * Math.pow(1 + standardMonthlyRate, standardLoanTermMonths)) / 
                                      (Math.pow(1 + standardMonthlyRate, standardLoanTermMonths) - 1);
    
    // Calculate additional payment amortization
    let remainingBalance = numLoanAmount;
    const additionalPaymentData: Array<{year: number, balance: number}> = [];
    let additionalPaymentMonths = 0;
    
    while (remainingBalance > 0 && additionalPaymentMonths <= standardLoanTermMonths) {
      // For yearly data points - include year 0 for complete data
      if (additionalPaymentMonths % 12 === 0) {
        additionalPaymentData.push({
          year: additionalPaymentMonths / 12,
          balance: Math.max(0, remainingBalance)
        });
      }
      
      const monthlyInterest = remainingBalance * standardMonthlyRate;
      let principalPayment = standardMonthlyPaymentCalc - monthlyInterest + numAdditionalPayment;
      
      // Ensure we don't overpay
      if (principalPayment > remainingBalance) {
        principalPayment = remainingBalance;
      }
      
      remainingBalance -= principalPayment;
      additionalPaymentMonths++;
      
      // Add the final point
      if (remainingBalance <= 0 && additionalPaymentMonths % 12 !== 0) {
        additionalPaymentData.push({
          year: Math.ceil(additionalPaymentMonths / 12),
          balance: 0
        });
      }
    }
    
    // Format data for charts - include year 0
    const years = standardData.map(item => item.year);
    const standardBalances = standardData.map(item => item.balance);
    
    // Include all data points including year 0
    
    // Ensure we have data points for all years
    const additionalBalances = years.map(year => {
      const match = additionalPaymentData.find(item => item.year === year);
      return match ? match.balance : 0;
    });
    
    // Generate the balance comparison chart using the static SVG utility
    const balanceComparisonChart = generateBalanceComparisonSvg(
      years,
      standardBalances,
      additionalBalances
    );
    
    // Insert the SVG chart into the template
    htmlContent = htmlContent.replace('{{balanceComparisonChart}}', balanceComparisonChart);
    
    return htmlContent;
  } catch (error) {
    console.error("Error in renderAdditionalPaymentTemplate:", error);
    throw error;
  }
}

export function savePdfToTempFile(pdfBuffer: Buffer, filename = 'wisebond-report.pdf'): string {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, filename);
  
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}