import dotenv from 'dotenv';
import { sendCalculationEmail } from './server/email.js';

// Load environment variables
dotenv.config();

// Mock calculation data for testing
const mockCalculationData = {
  type: 'additional',
  displayResults: [
    { label: 'Standard Monthly Payment', value: 'R8,500' },
    { label: 'New Monthly Payment', value: 'R9,500' },
    { label: 'Time Saved', value: '2 years 6 months' },
    { label: 'Interest Saved', value: 'R125,000' }
  ],
  loanAmount: 900000,
  interestRate: 11.25,
  loanTermYears: 20,
  additionalPayment: 1000,
  standardMonthlyPayment: 8500,
  newMonthlyPayment: 9500,
  standardLoanTermMonths: 240,
  newTermMonths: 180,
  totalStandardInterest: 1140000,
  totalNewInterest: 810000,
  timeSavedMonths: 30,
  interestSaved: 330000,
  standardBalance: [900000, 850000, 800000, 750000, 700000, 650000, 600000, 550000, 500000, 450000, 400000, 350000, 300000, 250000, 200000, 150000, 100000, 50000, 0],
  additionalBalance: [900000, 800000, 700000, 600000, 500000, 400000, 300000, 200000, 100000, 0],
  balanceYears: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
};

const mockEmailData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com', // Replace with your email for testing
  calculationType: 'additional',
  calculationData: mockCalculationData
};

async function testEmailWithPdf() {
  console.log('🧪 Starting email with PDF test...');
  
  try {
    console.log('📧 Sending calculation email with PDF attachment...');
    console.log('📊 Calculation data:', JSON.stringify(mockCalculationData, null, 2));
    
    const result = await sendCalculationEmail(mockEmailData);
    
    if (result.success) {
      console.log('✅ Email sent successfully with PDF attachment!');
      console.log('📄 Email details:', {
        to: mockEmailData.email,
        calculationType: mockEmailData.calculationType,
        hasAttachment: true
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      if (result.isSandboxAuthError) {
        console.log('🔧 This appears to be a Mailgun sandbox authentication error');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testEmailWithPdf()
  .then(result => {
    if (result.success) {
      console.log('✅ All tests passed!');
      console.log('📧 Check your email for the PDF attachment');
      process.exit(0);
    } else {
      console.log('❌ Tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  }); 