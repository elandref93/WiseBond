import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function mergeSideBySide() {
  try {
    // Read the PDF files
    const bondReportBytes = fs.readFileSync('bond-report-side-by-side.pdf');
    const additionalPaymentReportBytes = fs.readFileSync('additional-payment-report-updated.pdf');
    
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();
    
    // Load the source PDFs
    const bondReportPdf = await PDFDocument.load(bondReportBytes);
    const additionalPaymentReportPdf = await PDFDocument.load(additionalPaymentReportBytes);
    
    // Copy pages from source PDFs to the merged PDF
    const bondReportPages = await mergedPdf.copyPages(bondReportPdf, [0]);
    const additionalPaymentReportPages = await mergedPdf.copyPages(additionalPaymentReportPdf, [0]);
    
    // Add the pages to the merged PDF
    mergedPdf.addPage(bondReportPages[0]);
    mergedPdf.addPage(additionalPaymentReportPages[0]);
    
    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync('bond-report-side-by-side-comparison.pdf', mergedPdfBytes);
    
    console.log('Side-by-side PDF created successfully!');
  } catch (error) {
    console.error('Error creating side-by-side PDF:', error);
  }
}

mergeSideBySide();
