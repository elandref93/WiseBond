/**
 * Report Controller
 * 
 * Handles API requests for generating PDF reports from calculator results
 */

import { Request, Response } from 'express';
import { generateBondRepaymentPdf, generateAdditionalPaymentPdf, savePdfToTempFile } from './pdfGenerator';
import { calculateBondRepayment, CalculationResult } from '../../../client/src/lib/calculators';
import * as fs from 'fs';

/**
 * Generate a PDF report for bond repayment calculations
 * @param req Express request
 * @param res Express response
 */
export async function generateBondRepaymentReport(req: Request, res: Response) {
  try {
    // Check if user is authenticated (should be enforced by middleware, but double-check)
    if (!req.session.userId) {
      return res.status(401).json({ 
        message: 'You must be logged in to generate a PDF report.' 
      });
    }
    
    const { 
      propertyValue, 
      interestRate, 
      loanTerm, 
      deposit, 
      calculationResult,
      includeDetails,
      includeBondFees
    } = req.body;
    
    if (!propertyValue || !interestRate || !loanTerm) {
      return res.status(400).json({ 
        message: 'Missing required parameters. Please provide propertyValue, interestRate, and loanTerm.' 
      });
    }

    // Use provided calculation result or calculate a new one
    let result: CalculationResult;
    if (calculationResult) {
      result = calculationResult;
    } else {
      // Convert input to proper numeric values
      const numPropertyValue = typeof propertyValue === 'string' 
        ? parseFloat(propertyValue.replace(/[^0-9.]/g, '')) 
        : propertyValue;
      
      const numInterestRate = typeof interestRate === 'string'
        ? parseFloat(interestRate)
        : interestRate;
      
      const numLoanTerm = typeof loanTerm === 'string'
        ? parseInt(loanTerm)
        : loanTerm;
      
      const numDeposit = deposit && typeof deposit === 'string'
        ? parseFloat(deposit.replace(/[^0-9.]/g, ''))
        : (deposit || 0);
      
      // Convert includeBondFees to boolean
      const shouldIncludeBondFees = includeBondFees === true || includeBondFees === 'true';
      
      // Calculate the result
      result = calculateBondRepayment(numPropertyValue, numInterestRate, numLoanTerm, numDeposit, shouldIncludeBondFees);
    }
    
    // Original input data for the report
    const inputData = {
      propertyValue,
      interestRate,
      loanTerm,
      deposit,
      includeBondFees
    };
    
    // Generate PDF
    const pdfBuffer = await generateBondRepaymentPdf(result, inputData);
    
    // Option 1: Send PDF directly in response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=wisebond-bond-repayment-report.pdf');
    res.send(pdfBuffer);
    
    // Option 2 (alternative): Save to temporary file and serve that file
    // const tempFilePath = savePdfToTempFile(pdfBuffer);
    // res.download(tempFilePath, 'wisebond-bond-repayment-report.pdf', (err) => {
    //   if (err) {
    //     console.error('Error sending file:', err);
    //   }
    //   
    //   // Clean up temp file after download
    //   fs.unlink(tempFilePath, (unlinkErr) => {
    //     if (unlinkErr) {
    //       console.error('Error deleting temp file:', unlinkErr);
    //     }
    //   });
    // });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF report',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Generate a PDF report for additional payment calculations
 * @param req Express request
 * @param res Express response
 */
export async function generateAdditionalPaymentReport(req: Request, res: Response) {
  try {
    // Check if user is authenticated (should be enforced by middleware, but double-check)
    if (!req.session.userId) {
      return res.status(401).json({ 
        message: 'You must be logged in to generate a PDF report.' 
      });
    }
    
    console.log("Received additional payment report request:", req.body);
    
    const { 
      loanAmount: requestLoanAmount, 
      interestRate, 
      loanTerm, 
      additionalPayment: requestAdditionalPayment,
      calculationResult
    } = req.body;
    
    // Use provided calculation result as we don't have a direct calculation function for this in the controller
    if (!calculationResult) {
      console.error("Missing calculation result in request");
      return res.status(400).json({ 
        message: 'Missing calculation result. Please provide the calculation result object.' 
      });
    }
    
    // Extract values from calculation result if not provided directly
    const loanAmount = requestLoanAmount || calculationResult.loanAmount;
    const additionalPayment = requestAdditionalPayment || calculationResult.additionalPayment;
    
    // Verify we have all required parameters
    if (!loanAmount || !interestRate || !loanTerm || !additionalPayment) {
      console.error("Missing required parameters:", { 
        hasLoanAmount: !!loanAmount, 
        hasInterestRate: !!interestRate, 
        hasLoanTerm: !!loanTerm, 
        hasAdditionalPayment: !!additionalPayment
      });
      return res.status(400).json({ 
        message: 'Missing required parameters. Please provide loanAmount, interestRate, loanTerm, and additionalPayment either directly or via calculationResult.' 
      });
    }
    
    // Original input data for the report
    const inputData = {
      loanAmount,
      interestRate,
      loanTerm,
      additionalPayment
    };
    
    console.log("Using input data for PDF generation:", inputData);
    
    // Generate PDF
    const pdfBuffer = await generateAdditionalPaymentPdf(calculationResult, inputData);
    
    // Send PDF directly in response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=wisebond-additional-payment-report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating additional payment PDF report:', error);
    res.status(500).json({ 
      message: 'Failed to generate additional payment PDF report',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}