#!/usr/bin/env node

/**
 * Comprehensive Test for PDF Generation and Email with Attachments
 * 
 * This script tests:
 * 1. PDF generation for Additional Payment Calculator
 * 2. Email sending with PDF attachments
 * 3. Email sending without PDF attachments (fallback)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { generateAdditionalPaymentPdf } from './server/services/pdf/pdfGenerator.js';
import { sendEmail } from './server/email.js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testPdfGeneration() {
  console.log('🧪 Testing PDF Generation...\n');
  
  try {
    // Mock calculation result data
    const calculationResult = {
      type: 'additional',
      displayResults: [
        { label: 'Original Monthly Payment', value: 'R 8,500.00' },
        { label: 'New Monthly Payment', value: 'R 9,000.00' },
        { label: 'Additional Payment', value: 'R 500.00' },
        { label: 'Total Interest Saved', value: 'R 156,000.00' },
        { label: 'Years Saved', value: '5.2 years' }
      ],
      loanAmount: 1000000,
      interestRate: 8.5,
      loanTermYears: 20,
      additionalPayment: 500
    };

    const inputData = {
      loanAmount: 1000000,
      interestRate: 8.5,
      loanTerm: 20,
      additionalPayment: 500
    };

    console.log('📊 Generating PDF with test data...');
    console.log('Calculation Result:', JSON.stringify(calculationResult, null, 2));
    console.log('Input Data:', JSON.stringify(inputData, null, 2));
    
    // Generate PDF
    const pdfBuffer = await generateAdditionalPaymentPdf(calculationResult, inputData);
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Check if PDF has content
    if (pdfBuffer.length > 0) {
      console.log('✅ PDF has content and appears to be valid');
      return pdfBuffer;
    } else {
      console.log('❌ PDF is empty!');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

async function testEmailWithPdfAttachment(pdfBuffer) {
  console.log('\n📧 Testing Email with PDF Attachment...\n');
  
  try {
    // Set environment variables for testing
    process.env.MAILGUN_API_KEY = 'de69004e28f577df88491facfa269821-f6202374-3c3818d6';
    process.env.MAILGUN_DOMAIN = 'wisebond.co.za';
    process.env.MAILGUN_FROM_EMAIL = 'Wise Bond <noreply@wisebond.co.za>';
    
    const emailParams = {
      to: 'elandref@eapfs.co.za',
      from: 'Wise Bond <noreply@wisebond.co.za>',
      subject: 'Test Email with PDF Attachment - WiseBond',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email with PDF</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a3d6c;">Test Email with PDF Attachment</h1>
            <p>This is a test email to verify that PDF attachments are working correctly.</p>
            <p>The PDF attachment should contain the Additional Payment Calculator results.</p>
            <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; color: #2e7d32; font-weight: bold;">📎 PDF Report Attached</p>
              <p style="margin: 5px 0 0 0; color: #2e7d32; font-size: 14px;">A detailed PDF report with charts and analysis has been attached to this email.</p>
            </div>
            <p>Best regards,<br>Wise Bond Team</p>
          </div>
        </body>
        </html>
      `,
      text: `
Test Email with PDF Attachment

This is a test email to verify that PDF attachments are working correctly.

The PDF attachment should contain the Additional Payment Calculator results.

📎 PDF Report Attached
A detailed PDF report with charts and analysis has been attached to this email.

Best regards,
Wise Bond Team
      `,
      attachment: {
        filename: 'wisebond-additional-payment-report.pdf',
        data: pdfBuffer,
        contentType: 'application/pdf'
      }
    };
    
    console.log('📤 Sending email with PDF attachment...');
    const result = await sendEmail(emailParams);
    
    if (result.success) {
      console.log('✅ Email sent successfully with PDF attachment!');
      return true;
    } else {
      console.error('❌ Email failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

async function testEmailWithoutPdfAttachment() {
  console.log('\n📧 Testing Email without PDF Attachment (Fallback)...\n');
  
  try {
    const emailParams = {
      to: 'elandref@eapfs.co.za',
      from: 'Wise Bond <noreply@wisebond.co.za>',
      subject: 'Test Email without PDF Attachment - WiseBond',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email without PDF</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a3d6c;">Test Email without PDF Attachment</h1>
            <p>This is a test email to verify that emails work correctly without PDF attachments.</p>
            <p>This simulates the fallback scenario when PDF generation fails.</p>
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ No PDF Attachment</p>
              <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">PDF generation was not available for this test.</p>
            </div>
            <p>Best regards,<br>Wise Bond Team</p>
          </div>
        </body>
        </html>
      `,
      text: `
Test Email without PDF Attachment

This is a test email to verify that emails work correctly without PDF attachments.

This simulates the fallback scenario when PDF generation fails.

⚠️ No PDF Attachment
PDF generation was not available for this test.

Best regards,
Wise Bond Team
      `
    };
    
    console.log('📤 Sending email without PDF attachment...');
    const result = await sendEmail(emailParams);
    
    if (result.success) {
      console.log('✅ Email sent successfully without PDF attachment!');
      return true;
    } else {
      console.error('❌ Email failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Comprehensive PDF and Email Test\n');
  console.log('=' .repeat(60));
  
  // Test 1: PDF Generation
  const pdfBuffer = await testPdfGeneration();
  
  // Test 2: Email with PDF Attachment
  let emailWithPdfSuccess = false;
  if (pdfBuffer) {
    emailWithPdfSuccess = await testEmailWithPdfAttachment(pdfBuffer);
  } else {
    console.log('\n⏭️ Skipping email with PDF test (PDF generation failed)');
  }
  
  // Test 3: Email without PDF Attachment
  const emailWithoutPdfSuccess = await testEmailWithoutPdfAttachment();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ PDF Generation: ${pdfBuffer ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Email with PDF: ${emailWithPdfSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Email without PDF: ${emailWithoutPdfSuccess ? 'PASSED' : 'FAILED'}`);
  
  const overallSuccess = (pdfBuffer && emailWithPdfSuccess && emailWithoutPdfSuccess);
  console.log(`\n🎯 Overall Result: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('🎉 PDF generation and email functionality are working correctly!');
  } else {
    console.log('⚠️ Some issues were found. Check the logs above for details.');
  }
  
  console.log('\n🏁 Test completed');
}

// Run the complete test
runCompleteTest().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 