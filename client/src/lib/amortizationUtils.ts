/**
 * Shared utilities for amortization calculations.
 * Used by both the frontend and PDF generation to ensure consistency.
 */

// Types for amortization data
export interface YearlyData {
  year: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativePrincipal?: number;
  cumulativeInterest?: number;
}

/**
 * Calculate monthly payment amount
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number, 
  interestRate: number, 
  termYears: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = termYears * 12;
  const compoundFactor = Math.pow(1 + monthlyRate, totalPayments);
  return (
    (principal * monthlyRate * compoundFactor) /
    (compoundFactor - 1)
  );
}

/**
 * Generate yearly amortization data for charts and tables
 * Calculates month by month, ensuring balance only decreases
 */
export function generateAmortizationData(
  loanAmount: number,
  interestRate: number,
  loanTerm: number
): YearlyData[] {
  const data: YearlyData[] = [];
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTerm * 12;
  const compoundFactor = Math.pow(1 + monthlyRate, totalPayments);
  const monthlyPayment = (loanAmount * monthlyRate * compoundFactor) / (compoundFactor - 1);
  
  // Start with the original loan amount
  let currentBalance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  // Add year 0 starting point
  data.push({
    year: 0,
    principal: 0,
    interest: 0,
    balance: loanAmount,
    cumulativePrincipal: 0,
    cumulativeInterest: 0
  });

  // Process each year
  for (let year = 1; year <= loanTerm; year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    
    // Process 12 months for this year
    for (let month = 1; month <= 12; month++) {
      // If balance is already zero, no more payments needed
      if (currentBalance <= 0) break;
      
      // Calculate monthly interest on current balance
      const monthlyInterest = currentBalance * monthlyRate;
      
      // Calculate monthly principal payment
      let monthlyPrincipal = monthlyPayment - monthlyInterest;
      
      // If monthly principal would exceed remaining balance, adjust it
      if (monthlyPrincipal > currentBalance) {
        monthlyPrincipal = currentBalance;
      }
      
      // Add to yearly totals
      yearlyInterest += monthlyInterest;
      yearlyPrincipal += monthlyPrincipal;
      
      // Reduce the balance by the principal payment
      currentBalance -= monthlyPrincipal;
      
      // Ensure balance doesn't go negative due to floating point errors
      if (currentBalance < 0.01) {
        currentBalance = 0;
      }
    }

    // Update cumulative totals
    cumulativeInterest += yearlyInterest;
    cumulativePrincipal += yearlyPrincipal;

    // Add year data
    data.push({
      year,
      principal: yearlyPrincipal,
      interest: yearlyInterest,
      balance: currentBalance,
      cumulativePrincipal,
      cumulativeInterest
    });

    // Stop if loan is fully paid off
    if (currentBalance <= 0) break;
  }

  return data;
}
