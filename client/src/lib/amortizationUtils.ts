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
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1)
  );
}

/**
 * Generate yearly amortization data for charts and tables
 * Follows the same logic used in AmortizationChart component
 */
export function generateAmortizationData(
  loanAmount: number,
  interestRate: number,
  loanTerm: number
): YearlyData[] {
  const data: YearlyData[] = [];
  let remainingBalance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

  // Calculate yearly data
  // Include year 0 for charts on the website
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
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = Math.min(year * 12, loanTerm * 12);
    
    for (let monthNumber = startMonth; monthNumber <= endMonth; monthNumber++) {
      // Break if we've reached the end of the loan term
      if (remainingBalance <= 0.01) break;
      
      const monthlyInterest = remainingBalance * (interestRate / 100 / 12);
      const monthlyPrincipal = Math.min(monthlyPayment - monthlyInterest, remainingBalance);

      yearlyInterest += monthlyInterest;
      yearlyPrincipal += monthlyPrincipal;
      remainingBalance -= monthlyPrincipal;

      // Prevent negative balance from floating point errors
      if (remainingBalance < 0.01) remainingBalance = 0;
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
}