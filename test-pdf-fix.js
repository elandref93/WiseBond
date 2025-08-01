import dotenv from 'dotenv';
import { generateAdditionalPaymentPdf } from './server/services/pdf/pdfGenerator.js';

// Load environment variables
dotenv.config();

// Mock calculation data for testing
const mockCalculationResult = {
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

const mockInputData = {
  loanAmount: 900000,
  interestRate: 11.25,
  loanTerm: 20,
  additionalPayment: 1000
};

async function testPdfGeneration() {
  console.log('🧪 Starting PDF generation test...');
  
  try {
    console.log('📊 Mock calculation data:', JSON.stringify(mockCalculationResult, null, 2));
    console.log('📝 Mock input data:', JSON.stringify(mockInputData, null, 2));
    
    console.log('🔄 Generating PDF...');
    const pdfBuffer = await generateAdditionalPaymentPdf(mockCalculationResult, mockInputData);
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    
    // Save the PDF for inspection
    const fs = await import('fs');
    const path = await import('path');
    
    const testDir = path.join(process.cwd(), 'test-outputs');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const pdfPath = path.join(testDir, 'test-additional-payment.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log(`💾 PDF saved to: ${pdfPath}`);
    console.log('🎉 PDF generation test completed successfully!');
    
    return { success: true, pdfPath };
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return { success: false, error: error.message };
  }
}

// Run the test
testPdfGeneration()
  .then(result => {
    if (result.success) {
      console.log('✅ All tests passed!');
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