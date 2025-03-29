import { CalculationResult } from "./calculators";
import { Buffer } from 'buffer';

/**
 * Generate a shareable URL containing encoded calculation data
 * @param result - The calculation result to share
 * @returns A URL that can be used to share the calculation
 */
export function generateShareableUrl(result: CalculationResult): string {
  // Create a simplified version of the result with only essential data
  const shareableData = {
    type: result.type,
    displayResults: result.displayResults,
    // Include yearlyData for amortization if available
    ...(result.type === 'amortisation' && result.yearlyData && { 
      yearlyData: result.yearlyData,
      loanAmount: result.loanAmount,
      interestRate: result.interestRate,
      loanTermYears: result.loanTermYears,
      monthlyPayment: result.monthlyPayment,
      totalPayment: result.totalPayment,
      totalInterest: result.totalInterest
    })
  };
  
  // Convert to Base64 (for URL-friendly encoding)
  const encoded = Buffer.from(JSON.stringify(shareableData)).toString('base64');
  
  // Generate URL with encoded data
  // For real production, should use a shorter path like /s/ for better sharing
  return `/shared-calculation?data=${encodeURIComponent(encoded)}`;
}

/**
 * Parse a shared calculation from an encoded URL
 * @param encodedData - The encoded calculation data from the URL
 * @returns Decoded calculation result or null if invalid
 */
export function parseSharedCalculation(encodedData: string): CalculationResult | null {
  try {
    // Decode the Base64 string
    const decoded = Buffer.from(decodeURIComponent(encodedData), 'base64').toString('utf-8');
    
    // Parse the JSON data
    const result = JSON.parse(decoded) as CalculationResult;
    
    // Validate that it has the minimum required structure
    if (!result || !result.type || !result.displayResults) {
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing shared calculation:', error);
    return null;
  }
}

/**
 * Generate a shareable message for social media or messaging apps
 * @param result - The calculation result to share
 * @returns A formatted text message for sharing
 */
export function generateShareableText(result: CalculationResult): string {
  const title = getCalculatorTitle(result.type);
  
  // Create a summary of the results
  let message = `My ${title} calculation results:\n\n`;
  
  // Add the key results
  result.displayResults.forEach(item => {
    message += `${item.label}: ${item.value}\n`;
  });
  
  // Add a call to action
  message += `\nCalculate your own at BetterBond.co.za`;
  
  return message;
}

/**
 * Get a user-friendly title for a calculator type
 * @param type - The calculator type identifier
 * @returns A formatted title
 */
function getCalculatorTitle(type: string): string {
  switch (type) {
    case 'bond':
      return 'Bond Repayment';
    case 'affordability':
      return 'Affordability';
    case 'deposit':
      return 'Deposit Savings';
    case 'additional':
      return 'Additional Payment';
    case 'transfer':
      return 'Transfer Costs';
    case 'amortisation':
      return 'Amortization';
    default:
      return 'Calculation';
  }
}