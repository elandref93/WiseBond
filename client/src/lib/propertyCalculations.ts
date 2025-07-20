import { Property, LoanScenario } from "@shared/schema";

export interface AmortizationRow {
  paymentNumber: number;
  paymentDate: string;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
  extraPayment?: number;
  lumpSumPayment?: number;
}

export interface ScenarioResult {
  scenario: LoanScenario;
  amortizationSchedule: AmortizationRow[];
  totalInterestSaved: number;
  monthsSaved: number;
  originalPayoffDate: string;
  newPayoffDate: string;
  totalAmountPaid: number;
  originalTotalAmount: number;
}

export interface PropertyAnalysis {
  property: Property;
  baselineSchedule: AmortizationRow[];
  scenarioResults: ScenarioResult[];
  combinedScenarioResult?: ScenarioResult;
}

/**
 * Calculate monthly payment using the standard loan formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termInMonths: number
): number {
  if (annualInterestRate === 0) {
    return principal / termInMonths;
  }
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths);
  const denominator = Math.pow(1 + monthlyRate, termInMonths) - 1;
  
  return numerator / denominator;
}

/**
 * Generate baseline amortization schedule for a property
 */
export function generateBaselineAmortization(property: Property): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const monthlyRate = property.currentInterestRate / 100 / 12;
  let remainingBalance = property.currentLoanBalance;
  const startDate = new Date(property.loanStartDate);
  
  // Calculate how many payments have already been made
  const today = new Date();
  const monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                       (today.getMonth() - startDate.getMonth());
  
  for (let i = 1; i <= property.remainingTerm; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + monthsElapsed + i);
    
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = property.currentMonthlyPayment - interestPayment;
    
    if (remainingBalance - principalPayment <= 0) {
      // Last payment
      const finalPayment = remainingBalance + interestPayment;
      schedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toISOString().split('T')[0],
        principalPayment: remainingBalance,
        interestPayment,
        totalPayment: finalPayment,
        remainingBalance: 0
      });
      break;
    }
    
    remainingBalance -= principalPayment;
    
    schedule.push({
      paymentNumber: i,
      paymentDate: paymentDate.toISOString().split('T')[0],
      principalPayment,
      interestPayment,
      totalPayment: property.currentMonthlyPayment,
      remainingBalance
    });
  }
  
  return schedule;
}

/**
 * Apply a single scenario to the baseline schedule
 */
export function applyScenarioToSchedule(
  baselineSchedule: AmortizationRow[],
  scenario: LoanScenario,
  property: Property
): AmortizationRow[] {
  if (!scenario.isActive) {
    return baselineSchedule;
  }

  const schedule = JSON.parse(JSON.stringify(baselineSchedule)) as AmortizationRow[];
  const monthlyRate = property.currentInterestRate / 100 / 12;
  
  for (let i = 0; i < schedule.length; i++) {
    const payment = schedule[i];
    let extraPayment = 0;
    let lumpSumPayment = 0;
    
    // Apply lump sum scenario
    if (scenario.type === 'lump_sum' && scenario.lumpSumAmount) {
      const shouldApplyLumpSum = checkIfDateMatches(
        payment,
        scenario.lumpSumDate!,
        scenario.lumpSumDateType as "date" | "payment_number"
      );
      
      if (shouldApplyLumpSum) {
        lumpSumPayment = Math.min(scenario.lumpSumAmount, payment.remainingBalance);
      }
    }
    
    // Apply extra monthly payment scenario
    if (scenario.type === 'extra_monthly' && scenario.extraMonthlyAmount) {
      const shouldStartExtra = checkIfDateMatches(
        payment,
        scenario.extraMonthlyStartDate!,
        scenario.extraMonthlyStartType as "date" | "payment_number"
      );
      
      const shouldEndExtra = scenario.extraMonthlyEndDate ? 
        checkIfDateMatches(payment, scenario.extraMonthlyEndDate, scenario.extraMonthlyEndType as "date" | "payment_number") :
        false;
      
      const durationCheck = scenario.extraMonthlyDuration ? 
        payment.paymentNumber <= scenario.extraMonthlyDuration : true;
      
      if (shouldStartExtra && !shouldEndExtra && durationCheck) {
        extraPayment = Math.min(scenario.extraMonthlyAmount, payment.remainingBalance);
      }
    }
    
    // Apply monthly increase scenario
    if (scenario.type === 'monthly_increase' && scenario.monthlyIncreaseAmount) {
      const shouldApplyIncrease = checkIfDateMatches(
        payment,
        scenario.monthlyIncreaseStartDate!,
        scenario.monthlyIncreaseStartType as "date" | "payment_number"
      );
      
      if (shouldApplyIncrease) {
        extraPayment = Math.min(scenario.monthlyIncreaseAmount, payment.remainingBalance);
      }
    }
    
    // Apply the extra payments
    if (extraPayment > 0 || lumpSumPayment > 0) {
      payment.extraPayment = extraPayment;
      payment.lumpSumPayment = lumpSumPayment;
      
      const totalExtraPayment = extraPayment + lumpSumPayment;
      payment.principalPayment += totalExtraPayment;
      payment.totalPayment += totalExtraPayment;
      payment.remainingBalance -= totalExtraPayment;
      
      if (payment.remainingBalance <= 0) {
        payment.remainingBalance = 0;
        // Remove remaining payments
        schedule.splice(i + 1);
        break;
      }
      
      // Recalculate remaining payments
      recalculateRemainingPayments(schedule, i + 1, property, monthlyRate);
    }
  }
  
  return schedule;
}

/**
 * Check if a payment date matches a scenario trigger date
 */
function checkIfDateMatches(
  payment: AmortizationRow,
  triggerDate: string,
  dateType: 'date' | 'payment_number'
): boolean {
  if (dateType === 'payment_number') {
    return payment.paymentNumber >= parseInt(triggerDate);
  } else {
    return payment.paymentDate >= triggerDate;
  }
}

/**
 * Recalculate remaining payments after an extra payment
 */
function recalculateRemainingPayments(
  schedule: AmortizationRow[],
  startIndex: number,
  property: Property,
  monthlyRate: number
): void {
  for (let i = startIndex; i < schedule.length; i++) {
    const payment = schedule[i];
    const previousBalance = i > 0 ? schedule[i - 1].remainingBalance : property.currentLoanBalance;
    
    const interestPayment = previousBalance * monthlyRate;
    const principalPayment = property.currentMonthlyPayment - interestPayment;
    
    if (previousBalance - principalPayment <= 0) {
      // Last payment
      payment.principalPayment = previousBalance;
      payment.interestPayment = interestPayment;
      payment.totalPayment = previousBalance + interestPayment;
      payment.remainingBalance = 0;
      schedule.splice(i + 1);
      break;
    }
    
    payment.principalPayment = principalPayment;
    payment.interestPayment = interestPayment;
    payment.totalPayment = property.currentMonthlyPayment;
    payment.remainingBalance = previousBalance - principalPayment;
  }
}

/**
 * Calculate scenario results comparing to baseline
 */
export function calculateScenarioResult(
  baselineSchedule: AmortizationRow[],
  scenarioSchedule: AmortizationRow[],
  scenario: LoanScenario
): ScenarioResult {
  const baselineTotalInterest = baselineSchedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
  const scenarioTotalInterest = scenarioSchedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
  
  const baselineTotalAmount = baselineSchedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
  const scenarioTotalAmount = scenarioSchedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
  
  const totalInterestSaved = baselineTotalInterest - scenarioTotalInterest;
  const monthsSaved = baselineSchedule.length - scenarioSchedule.length;
  
  const originalPayoffDate = baselineSchedule[baselineSchedule.length - 1]?.paymentDate || '';
  const newPayoffDate = scenarioSchedule[scenarioSchedule.length - 1]?.paymentDate || '';
  
  return {
    scenario,
    amortizationSchedule: scenarioSchedule,
    totalInterestSaved,
    monthsSaved,
    originalPayoffDate,
    newPayoffDate,
    totalAmountPaid: scenarioTotalAmount,
    originalTotalAmount: baselineTotalAmount
  };
}

/**
 * Generate complete property analysis with all scenarios
 */
export function generatePropertyAnalysis(
  property: Property,
  scenarios: LoanScenario[]
): PropertyAnalysis {
  const baselineSchedule = generateBaselineAmortization(property);
  const activeScenarios = scenarios.filter(s => s.isActive);
  
  const scenarioResults: ScenarioResult[] = activeScenarios.map(scenario => {
    const scenarioSchedule = applyScenarioToSchedule(baselineSchedule, scenario, property);
    return calculateScenarioResult(baselineSchedule, scenarioSchedule, scenario);
  });
  
  // Calculate combined scenario effect
  let combinedScenarioResult: ScenarioResult | undefined;
  if (activeScenarios.length > 1) {
    let combinedSchedule = JSON.parse(JSON.stringify(baselineSchedule)) as AmortizationRow[];
    
    // Apply all scenarios in sequence
    for (const scenario of activeScenarios) {
      combinedSchedule = applyScenarioToSchedule(combinedSchedule, scenario, property);
    }
    
    // Create a combined scenario object for result calculation
    const combinedScenario: LoanScenario = {
      id: 0,
      propertyId: property.id,
      name: 'Combined Scenarios',
      type: 'extra_monthly',
      isActive: true,
      lumpSumAmount: null,
      lumpSumDate: null,
      lumpSumDateType: null,
      extraMonthlyAmount: null,
      extraMonthlyStartDate: null,
      extraMonthlyStartType: null,
      extraMonthlyEndDate: null,
      extraMonthlyEndType: null,
      extraMonthlyDuration: null,
      monthlyIncreaseAmount: null,
      monthlyIncreaseStartDate: null,
      monthlyIncreaseStartType: null,
      monthlyIncreaseFrequency: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    combinedScenarioResult = calculateScenarioResult(
      baselineSchedule,
      combinedSchedule,
      combinedScenario
    );
  }
  
  return {
    property,
    baselineSchedule,
    scenarioResults,
    combinedScenarioResult
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}