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
  // Start from year 1 (no year 0)
  for (let year = 1; year <= loanTerm; year++) {

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
}