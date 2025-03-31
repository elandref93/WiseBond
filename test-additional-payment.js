// Test script for additional payment calculation
const loanAmount = 900000;
const interestRate = 11.25;
const loanTerm = 20;
const additionalPayment = 1000;

// Calculate the monthly payment
const calculateMonthlyPayment = (principal, rate, term) => {
  const monthlyRate = rate / 100 / 12;
  const payments = term * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
         (Math.pow(1 + monthlyRate, payments) - 1);
};

// Standard payment without additional amount
const standardMonthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
const standardTotalPayment = standardMonthlyPayment * loanTerm * 12;
const standardTotalInterest = standardTotalPayment - loanAmount;

// Calculate new term with additional payment
const newMonthlyPayment = standardMonthlyPayment + additionalPayment;
let remainingPrincipal = loanAmount;
let newTermMonths = 0;
let totalNewInterestPaid = 0;

while (remainingPrincipal > 0) {
  const monthlyInterest = remainingPrincipal * (interestRate / 100 / 12);
  totalNewInterestPaid += monthlyInterest;
  
  const principalThisMonth = newMonthlyPayment - monthlyInterest;
  
  if (principalThisMonth >= remainingPrincipal) {
    newTermMonths++;
    break;
  }
  
  remainingPrincipal -= principalThisMonth;
  newTermMonths++;
  
  if (newTermMonths > 1000) break; // Safety check
}

const timeSavedMonths = loanTerm * 12 - newTermMonths;
const timeSavedYears = Math.floor(timeSavedMonths / 12);
const timeSavedMonthsRemainder = timeSavedMonths % 12;
const interestSaved = standardTotalInterest - totalNewInterestPaid;

// Format numbers for display
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace(/ZAR\s?/, 'R');
};

// Create the calculation result
const calculationResult = {
  type: 'additional',
  displayResults: [
    {
      label: "Standard Monthly Payment",
      value: formatCurrency(standardMonthlyPayment),
      tooltip: "Your regular monthly payment without additional contributions"
    },
    {
      label: "New Monthly Payment",
      value: formatCurrency(newMonthlyPayment),
      tooltip: "Your regular payment plus the additional amount"
    },
    {
      label: "Time Saved",
      value: `${timeSavedYears} years, ${timeSavedMonthsRemainder} months`,
      tooltip: "How much earlier you'll pay off your bond"
    },
    {
      label: "Interest Saved",
      value: formatCurrency(interestSaved),
      tooltip: "Total interest you'll save with additional payments"
    },
    {
      label: "Total Cost Reduction",
      value: formatCurrency(interestSaved),
      tooltip: "The total reduction in your bond cost"
    }
  ],
  loanAmount,
  interestRate,
  loanTerm,
  additionalPayment,
  timeSaved: `${timeSavedYears} years, ${timeSavedMonthsRemainder} months`,
  interestSaved: formatCurrency(interestSaved),
  standardMonthlyPayment,
  newMonthlyPayment,
  standardTerm: loanTerm,
  newTerm: newTermMonths / 12,
  standardInterest: standardTotalInterest,
  newInterest: totalNewInterestPaid
};

// Create the request data including the calculation result
const requestData = {
  loanAmount,
  interestRate,
  loanTerm,
  additionalPayment,
  calculationResult
};

console.log(JSON.stringify(requestData, null, 2));
