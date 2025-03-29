import { CalculationResult } from './calculators';

/**
 * Generate a shareable URL containing encoded calculation data
 * @param result - The calculation result to share
 * @returns A URL that can be used to share the calculation
 */
export function generateShareableUrl(result: CalculationResult): string {
  try {
    // Create a copy of the result to avoid potential circular reference issues
    const sharableData = JSON.parse(JSON.stringify(result));
    
    // Encode the data as a base64 string to include in the URL
    const encodedData = btoa(JSON.stringify(sharableData));
    
    // Generate the full URL with the encoded data as a query parameter
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-calculation?data=${encodedData}`;
  } catch (error) {
    console.error('Error generating shareable URL:', error);
    return window.location.origin;
  }
}

/**
 * Parse a shared calculation from an encoded URL
 * @param encodedData - The encoded calculation data from the URL
 * @returns Decoded calculation result or null if invalid
 */
export function parseSharedCalculation(encodedData: string): CalculationResult | null {
  try {
    // Decode the base64 string to get the JSON data
    const jsonString = atob(encodedData);
    
    // Parse the JSON string back into an object
    const calculationData = JSON.parse(jsonString) as CalculationResult;
    
    // Validate that it's a proper calculation result
    if (!calculationData || !calculationData.type || !calculationData.displayResults) {
      return null;
    }
    
    return calculationData;
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
  try {
    const calculatorTitle = getCalculatorTitle(result.type);
    let message = `Check out my ${calculatorTitle} results: `;
    
    // Add key results (limit to first 3 for readability)
    const keyResults = result.displayResults.slice(0, 3);
    
    keyResults.forEach((item, index) => {
      if (index > 0) message += ', ';
      message += `${item.label}: ${item.value}`;
    });
    
    // Add call to action
    message += '. Created with HomeLoanHelper.';
    
    return message;
  } catch (error) {
    console.error('Error generating shareable text:', error);
    return 'Check out my home loan calculation results!';
  }
}

/**
 * Get a user-friendly title for a calculator type
 * @param type - The calculator type identifier
 * @returns A formatted title
 */
function getCalculatorTitle(type: string): string {
  const titles: Record<string, string> = {
    'bond': 'Bond Repayment',
    'affordability': 'Affordability',
    'deposit': 'Deposit Savings',
    'additional': 'Additional Payment',
    'transfer': 'Transfer Costs',
    'amortisation': 'Amortization Schedule'
  };
  
  return titles[type] || 'Calculation';
}