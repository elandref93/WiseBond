/**
 * Report Controller
 * 
 * Handles API requests for generating PDF reports from calculator results
 */

import { Request, Response } from 'express';
import { generateBondRepaymentPdf, savePdfToTempFile } from './pdfGenerator';
import { calculateBondRepayment, CalculationResult } from '../../../client/src/lib/calculators';
import * as fs from 'fs';

/**
 * Generate a PDF report for bond repayment calculations
 * @param req Express request
 * @param res Express response
 */
export async function generateBondRepaymentReport(req: Request, res: Response) {
  try {
    const { 
      propertyValue, 
      interestRate, 
      loanTerm, 
      deposit, 
      calculationResult,
      includeDetails
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
      
      // Calculate the result
      result = calculateBondRepayment(numPropertyValue, numInterestRate, numLoanTerm, numDeposit);
    }
    
    // Original input data for the report
    const inputData = {
      propertyValue,
      interestRate,
      loanTerm,
      deposit
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