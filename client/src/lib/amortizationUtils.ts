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
 * Uses month-by-month calculation for accuracy
 */
export function generateAmortizationData(
  loanAmount: number,
  interestRate: number,
  loanTerm: number
): YearlyData[] {
  const data: YearlyData[] = [];
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTerm * 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

  // Calculate month-by-month, then aggregate to yearly
  let remainingBalance = loanAmount;
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

  // Calculate each year
  for (let year = 1; year <= loanTerm; year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    
    // Calculate 12 months for this year
    for (let month = 1; month <= 12; month++) {
      const currentMonth = (year - 1) * 12 + month;
      
      // Stop if we've exceeded the loan term
      if (currentMonth > totalMonths) break;
      
      // Stop if balance is already paid off
      if (remainingBalance <= 0.01) break;
      
      // Calculate this month's interest and principal
      const monthlyInterest = remainingBalance * monthlyRate;
      let monthlyPrincipal = monthlyPayment - monthlyInterest;
      
      // Ensure we don't pay more principal than remaining balance
      if (monthlyPrincipal > remainingBalance) {
        monthlyPrincipal = remainingBalance;
      }
      
      // Update yearly totals
      yearlyInterest += monthlyInterest;
      yearlyPrincipal += monthlyPrincipal;
      
      // Update remaining balance
      remainingBalance -= monthlyPrincipal;
      
      // Prevent negative balance from floating point errors
      if (remainingBalance < 0.01) {
        remainingBalance = 0;
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
      balance: remainingBalance,
      cumulativePrincipal,
      cumulativeInterest
    });

    // Stop if loan is paid off
    if (remainingBalance <= 0.01) break;
  }

  return data;
}