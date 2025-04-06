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

// Format currency with thousands separator and Rand symbol
export function formatCurrency(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  
  // Parse the input value to a number
  let num: number;
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");
    num = parseFloat(cleanValue);
  } else {
    num = value;
  }
  
  // Check if the parsing resulted in a valid number
  if (isNaN(num)) return "";
  
  // For displaying: Format with thousands separator and Rand symbol
  // We'll use full numbers without decimal for Rand currency (common in SA)
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: 'decimal' as const, // Use decimal to avoid automatic currency symbol
    useGrouping: true // Ensure thousand separators are used
  };
  
  try {
    // Round to nearest integer for Rand
    const roundedNum = Math.round(num);
    // Format with thousands separator
    return `R${roundedNum.toLocaleString('en-ZA', options)}`;
  } catch (error) {
    // Fallback formatting if toLocaleString fails
    // Format manually with commas as thousands separators
    const parts = Math.round(num).toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `R${parts.join('.')}`;
  }
}

// Parse a currency string back to a number (for calculations)
export function parseCurrency(currencyStr: string | number): number {
  if (!currencyStr) return 0;
  
  // Handle both string and number inputs
  if (typeof currencyStr === 'number') return currencyStr;
  
  // Remove currency symbol, spaces, commas and any other non-numeric characters
  // except for decimal points
  const cleanedValue = currencyStr.replace(/[^0-9.]/g, "");
  
  // Handle empty string after cleaning
  if (cleanedValue === "") return 0;
  
  // Parse as float and handle NaN
  const value = parseFloat(cleanedValue);
  return isNaN(value) ? 0 : value;
}

// Handle currency input field values - keeps numeric strings without formatting
// Use when you want to preserve raw numeric input without 'R' 
export function handleCurrencyInput(value: string): string {
  if (!value) return "";
  
  // Remove any currency symbols or other non-numeric characters
  const numericValue = value.replace(/[^0-9]/g, "");
  
  // Don't format if empty
  if (!numericValue) return "";
  
  // Return just the cleaned numeric string - no formatting, no R symbol
  return numericValue;
}

// Display a numeric value with currency formatting for UI display
// But without affecting the underlying form data
export function displayCurrencyValue(value: string | number): string {
  if (!value) return "";
  
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };
  return `R${numValue.toLocaleString('en-ZA', options)}`;
}

// Calculate the monthly repayment amount for a bond
export function calculateBondRepayment(
  propertyValue: number,
  interestRate: number,
  loanTerm: number,
  deposit: number,
  includeBondFees: boolean = false
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
  
  // Bond fees calculations (if enabled)
  const initiationFee = includeBondFees ? 6037.50 + (loanAmount * 0.0023) : 0; // R6,037.50 + 0.23% of loan amount
  const monthlyAdminFee = includeBondFees ? 69 : 0; // R69 per month
  const totalAdminFees = monthlyAdminFee * numberOfPayments;
  const totalFees = initiationFee + totalAdminFees;
  
  // Calculate total repayment over the loan term
  const totalRepayment = monthlyRepayment * numberOfPayments;
  
  // Calculate total interest paid
  const totalInterest = totalRepayment - loanAmount;
  
  // The monthly payment remains unaffected by the initiation fee since it's a once-off cost
  const effectiveMonthlyPayment = monthlyRepayment;
  
  // Prepare results
  const results: CalculationResult = {
    type: 'bond',
    loanAmount,
    monthlyRepayment: effectiveMonthlyPayment,
    totalRepayment,
    totalInterest,
    displayResults: [
      {
        label: 'Monthly Repayment',
        value: formatCurrency(effectiveMonthlyPayment),
        tooltip: 'The amount you will need to pay each month for the duration of your home loan.'
      },
      {
        label: 'Total Repayment Amount',
        value: formatCurrency(totalRepayment),
        tooltip: 'The total amount you will repay over the entire term of the loan, including interest and fees if selected.'
      },
      {
        label: 'Total Interest Paid',
        value: formatCurrency(totalInterest),
        tooltip: 'The total amount of interest you will pay over the entire term of the loan.'
      }
    ]
  };
  
  // Add fee information if bond fees are included
  if (includeBondFees) {
    results.bondInitiationFee = initiationFee;
    results.monthlyAdminFee = monthlyAdminFee;
    results.totalAdminFees = totalAdminFees;
    results.totalFees = totalFees;
    
    // Add to display results
    results.displayResults.push({
      label: 'Bond Initiation Fee (once-off)',
      value: formatCurrency(initiationFee),
      tooltip: 'One-time fee charged by the bank to set up your home loan. This is paid only once at the start of the loan.'
    });
    
    results.displayResults.push({
      label: 'Monthly Admin Fee (recurring)',
      value: formatCurrency(monthlyAdminFee) + '/month',
      tooltip: 'Monthly fee charged by the bank to administer your home loan. This fee is recurring throughout the loan term.'
    });
    
    results.displayResults.push({
      label: 'Total Fees (over loan term)',
      value: formatCurrency(totalFees),
      tooltip: 'The total amount of fees you will pay over the entire term of the loan, including both the initiation fee and the monthly admin fees.'
    });
  }
  
  return results;
}

// Calculate how much a person can afford to borrow
export function calculateAffordability(
  grossIncome: number,
  monthlyExpenses: number,
  existingDebt: number,
  interestRate: number
): CalculationResult {
  // Calculate disposable income after expenses and existing debt
  const disposableIncome = grossIncome - monthlyExpenses - existingDebt;
  
  // Maximum recommended debt-to-income ratio (28% of gross income for housing)
  // This is a common financial guideline in South Africa
  const maxAllowedForHousing = grossIncome * 0.28;
  
  // Maximum total debt-to-income ratio (36% of gross income for all debt including housing)
  // Need to subtract existing debt to find how much is available for housing
  const maxTotalDebtPayment = grossIncome * 0.36;
  const availableAfterExistingDebt = maxTotalDebtPayment - existingDebt;
  
  // Use the most restrictive of the three limits:
  // 1. Disposable income (cash flow reality)
  // 2. Housing debt ratio (28% rule)
  // 3. Total debt ratio (36% rule)
  const availableForLoan = Math.min(
    disposableIncome * 0.9, // Keep 10% buffer for unexpected expenses
    maxAllowedForHousing,
    availableAfterExistingDebt
  );
  
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
    maxAllowedForHousing,
    availableAfterExistingDebt,
    availableForLoan,
    maxLoanAmount,
    recommendedPropertyPrice,
    displayResults: [
      {
        label: 'Maximum Loan Amount',
        value: formatCurrency(maxLoanAmount),
        tooltip: 'The maximum home loan amount you could potentially qualify for based on your income and expenses.'
      },
      {
        label: 'Affordable Monthly Payment',
        value: formatCurrency(availableForLoan),
        tooltip: 'The monthly repayment amount you can comfortably afford based on your financial situation.'
      },
      {
        label: 'Recommended Property Price',
        value: formatCurrency(recommendedPropertyPrice),
        tooltip: 'The suggested property price range you should consider, assuming a standard deposit amount.'
      },
      {
        label: 'Available After Expenses & Debt',
        value: formatCurrency(disposableIncome * 0.9),
        tooltip: 'Your disposable income after monthly expenses and existing debt, with a 10% buffer for unexpected costs.'
      },
      {
        label: 'Housing Payment Limit (28%)',
        value: formatCurrency(maxAllowedForHousing),
        tooltip: 'The maximum recommended amount for housing based on the 28% rule of your gross income.'
      },
      {
        label: 'Debt Ratio Impact (36%)',
        value: formatCurrency(availableAfterExistingDebt),
        tooltip: 'The amount available for housing after accounting for your existing debt, based on the 36% total debt-to-income guideline.'
      }
    ]
  };
}

// Calculate how long it will take to save for a deposit
export function calculateDepositSavings(
  propertyPrice: number,
  depositPercentage: number,
  monthlySaving: number,
  savingsInterest: number,
  initialAmount: number = 0
): CalculationResult {
  // Calculate target deposit amount
  const depositAmount = propertyPrice * (depositPercentage / 100);
  
  // Monthly interest rate
  const monthlyInterestRate = savingsInterest / 100 / 12;
  
  // Amount still needed after considering initial investment
  const amountStillNeeded = Math.max(0, depositAmount - initialAmount);
  
  // Calculate months to reach deposit (if interest rate is 0, use simple division)
  let monthsToSave: number;
  
  // If they already have enough in initial amount
  if (initialAmount >= depositAmount) {
    monthsToSave = 0;
  } else if (savingsInterest === 0 || monthlyInterestRate === 0) {
    // Simple calculation without interest
    monthsToSave = amountStillNeeded / monthlySaving;
  } else {
    // Formula for future value of monthly savings with interest:
    // FV = PMT * [(1 + r)^n - 1] / r
    // Solving for n:
    // n = log[FV * r / PMT + 1] / log(1 + r)
    
    // Check for potential division by zero or log of zero issues
    if (monthlySaving <= 0) {
      // If monthly saving is zero or negative, it's impossible to reach target
      monthsToSave = Infinity;
    } else {
      monthsToSave = Math.log(amountStillNeeded * monthlyInterestRate / monthlySaving + 1) / Math.log(1 + monthlyInterestRate);
      
      // Check for NaN or Infinity results (can happen with certain combinations of values)
      if (isNaN(monthsToSave) || !isFinite(monthsToSave)) {
        // Fallback to simple calculation
        monthsToSave = amountStillNeeded / monthlySaving;
      }
    }
  }
  
  // Set reasonable limits for UI display
  // If it would take more than 100 years, consider it practically impossible
  if (!isFinite(monthsToSave) || monthsToSave > 1200) {
    monthsToSave = Infinity;
  }
  
  // Convert to years and months for display
  let yearsToSave = 0;
  let remainingMonths = 0;
  let timeToSaveText = '';
  
  if (monthsToSave === 0) {
    timeToSaveText = "Ready to proceed!";
  } else if (isFinite(monthsToSave)) {
    yearsToSave = Math.floor(monthsToSave / 12);
    remainingMonths = Math.ceil(monthsToSave % 12);
    
    if (yearsToSave === 0) {
      timeToSaveText = `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else {
      timeToSaveText = remainingMonths > 0 
        ? `${yearsToSave} year${yearsToSave !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
        : `${yearsToSave} year${yearsToSave !== 1 ? 's' : ''}`;
    }
  } else {
    timeToSaveText = "Never (increase savings)";
  }
  
  // Calculate total contributions
  const totalMonths = isFinite(monthsToSave) ? Math.ceil(monthsToSave) : 0;
  const totalContributions = monthlySaving * totalMonths + initialAmount;
  
  // Calculate total savings with compound interest
  // FV = PMT * [(1 + r)^n - 1] / r + (initial investment * (1 + r)^n)
  let totalAccumulated: number;
  let interestEarned: number;
  
  if (isFinite(monthsToSave)) {
    if (monthsToSave === 0) {
      // If they already have enough, just use the initial amount
      totalAccumulated = initialAmount;
      interestEarned = 0;
    } else if (savingsInterest === 0 || monthlyInterestRate === 0) {
      totalAccumulated = monthlySaving * totalMonths + initialAmount;
      interestEarned = 0;
    } else {
      // Calculate future value of monthly deposits
      const monthlyContributions = monthlySaving * 
        ((Math.pow(1 + monthlyInterestRate, totalMonths) - 1) / 
        monthlyInterestRate);
        
      // Calculate future value of initial investment
      const initialWithInterest = initialAmount * Math.pow(1 + monthlyInterestRate, totalMonths);
      
      // Total is the sum of both
      totalAccumulated = monthlyContributions + initialWithInterest;
      
      // Interest earned is the difference between total accumulated and contributions
      interestEarned = totalAccumulated - totalContributions;
    }
  } else {
    // If savings will never reach the target
    totalAccumulated = initialAmount;
    interestEarned = 0;
  }
  
  return {
    type: 'deposit',
    depositAmount,
    monthsToSave,
    yearsToSave,
    remainingMonths,
    totalContributions,
    totalAccumulated,
    interestEarned,
    displayResults: [
      {
        label: 'Deposit Amount Required',
        value: formatCurrency(depositAmount),
        tooltip: 'The total deposit amount you need to save based on the property price and deposit percentage.'
      },
      {
        label: 'Time to Save Deposit',
        value: timeToSaveText,
        tooltip: 'The estimated time it will take you to save the required deposit amount with your monthly savings.'
      },
      {
        label: 'Interest Earned',
        value: formatCurrency(Math.max(0, interestEarned)),
        tooltip: 'The amount of interest you will earn on your savings during the saving period.'
      },
      {
        label: 'Total Contributions',
        value: formatCurrency(totalContributions),
        tooltip: 'The total amount you will deposit over the saving period.'
      },
      {
        label: 'Total Accumulated',
        value: formatCurrency(totalAccumulated),
        tooltip: 'The final amount in your savings account, including both your contributions and interest earned.'
      }
    ]
  };
}
