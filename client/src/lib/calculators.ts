// This file contains functions for calculating mortgage-related values

// Type for calculation results
export interface CalculationResult {
  type: 'bond' | 'affordability' | 'deposit' | 'additional' | 'transfer' | 'amortisation';
  displayResults: {
    label: string;
    value: string;
    tooltip?: string;
  }[];
  [key: string]: any;
}

// Format currency with thousands separator
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Calculate the monthly repayment amount for a bond
export function calculateBondRepayment(
  propertyValue: number,
  interestRate: number,
  loanTerm: number,
  deposit: number
): CalculationResult {
  // Calculate bond amount after deposit
  const loanAmount = propertyValue - deposit;
  
  // Monthly interest rate
  const monthlyRate = interestRate / 100 / 12;
  
  // Total number of payments
  const numberOfPayments = loanTerm * 12;
  
  // Calculate monthly repayment using formula:
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const x = Math.pow(1 + monthlyRate, numberOfPayments);
  const monthlyRepayment = (loanAmount * x * monthlyRate) / (x - 1);
  
  // Calculate total repayment over the loan term
  const totalRepayment = monthlyRepayment * numberOfPayments;
  
  // Calculate total interest paid
  const totalInterest = totalRepayment - loanAmount;
  
  return {
    type: 'bond',
    loanAmount,
    monthlyRepayment,
    totalRepayment,
    totalInterest,
    displayResults: [
      {
        label: 'Monthly Repayment',
        value: `R${formatCurrency(monthlyRepayment.toFixed(2))}`,
        tooltip: 'The amount you will need to pay each month for the duration of your home loan.'
      },
      {
        label: 'Total Repayment Amount',
        value: `R${formatCurrency(totalRepayment.toFixed(2))}`,
        tooltip: 'The total amount you will repay over the entire term of the loan, including interest.'
      },
      {
        label: 'Total Interest Paid',
        value: `R${formatCurrency(totalInterest.toFixed(2))}`,
        tooltip: 'The total amount of interest you will pay over the entire term of the loan.'
      }
    ]
  };
}

// Calculate how much a person can afford to borrow
export function calculateAffordability(
  grossIncome: number,
  monthlyExpenses: number,
  existingDebt: number,
  interestRate: number
): CalculationResult {
  // Calculate disposable income
  const disposableIncome = grossIncome - monthlyExpenses - existingDebt;
  
  // Maximum recommended debt service ratio (30% of gross income)
  const maxMonthlyPayment = grossIncome * 0.3;
  
  // Actual available amount for home loan (lower of disposable or max)
  const availableForLoan = Math.min(disposableIncome, maxMonthlyPayment);
  
  // Monthly interest rate
  const monthlyRate = interestRate / 100 / 12;
  
  // Standard loan term in months (25 years)
  const loanTermMonths = 25 * 12;
  
  // Calculate maximum affordable loan:
  // P = M * [(1+r)^n - 1] / [r(1+r)^n]
  const x = Math.pow(1 + monthlyRate, loanTermMonths);
  const maxLoanAmount = availableForLoan * (x - 1) / (monthlyRate * x);
  
  // Recommended property price (assuming 10% deposit)
  const recommendedPropertyPrice = maxLoanAmount / 0.9;
  
  return {
    type: 'affordability',
    disposableIncome,
    maxMonthlyPayment,
    availableForLoan,
    maxLoanAmount,
    recommendedPropertyPrice,
    displayResults: [
      {
        label: 'Maximum Loan Amount',
        value: `R${formatCurrency(maxLoanAmount.toFixed(2))}`,
        tooltip: 'The maximum home loan amount you could potentially qualify for based on your income and expenses.'
      },
      {
        label: 'Affordable Monthly Payment',
        value: `R${formatCurrency(availableForLoan.toFixed(2))}`,
        tooltip: 'The monthly repayment amount you can comfortably afford based on your financial situation.'
      },
      {
        label: 'Recommended Property Price',
        value: `R${formatCurrency(recommendedPropertyPrice.toFixed(2))}`,
        tooltip: 'The suggested property price range you should consider, assuming a standard deposit amount.'
      }
    ]
  };
}

// Calculate how long it will take to save for a deposit
export function calculateDepositSavings(
  propertyPrice: number,
  depositPercentage: number,
  monthlySaving: number,
  savingsInterest: number
): CalculationResult {
  // Calculate target deposit amount
  const depositAmount = propertyPrice * (depositPercentage / 100);
  
  // Monthly interest rate
  const monthlyInterestRate = savingsInterest / 100 / 12;
  
  // Calculate months to reach deposit
  // Formula for future value of monthly savings with interest:
  // FV = PMT * [(1 + r)^n - 1] / r
  // Solving for n:
  // n = log[FV * r / PMT + 1] / log(1 + r)
  const monthsToSave = Math.log(depositAmount * monthlyInterestRate / monthlySaving + 1) / Math.log(1 + monthlyInterestRate);
  
  // Convert to years and months
  const yearsToSave = Math.floor(monthsToSave / 12);
  const remainingMonths = Math.ceil(monthsToSave % 12);
  
  // Calculate total contributions
  const totalContributions = monthlySaving * Math.ceil(monthsToSave);
  
  // Calculate interest earned
  const interestEarned = depositAmount - totalContributions;
  
  const timeToSaveText = remainingMonths > 0 
    ? `${yearsToSave} years, ${remainingMonths} months`
    : `${yearsToSave} years`;
  
  return {
    type: 'deposit',
    depositAmount,
    monthsToSave,
    yearsToSave,
    remainingMonths,
    totalContributions,
    interestEarned,
    displayResults: [
      {
        label: 'Deposit Amount Required',
        value: `R${formatCurrency(depositAmount.toFixed(2))}`,
        tooltip: 'The total deposit amount you need to save based on the property price and deposit percentage.'
      },
      {
        label: 'Time to Save Deposit',
        value: timeToSaveText,
        tooltip: 'The estimated time it will take you to save the required deposit amount with your monthly savings.'
      },
      {
        label: 'Interest Earned',
        value: `R${formatCurrency(Math.max(0, interestEarned).toFixed(2))}`,
        tooltip: 'The amount of interest you will earn on your savings during the saving period.'
      }
    ]
  };
}
