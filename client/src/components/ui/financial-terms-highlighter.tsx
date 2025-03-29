import React from "react";
import { financialTerms } from "@/lib/financialTerms";
import { FinancialTermTooltip } from "./financial-term-tooltip";

interface FinancialTermsHighlighterProps {
  text: string;
  className?: string;
}

/**
 * Component that automatically highlights financial terms in text and adds tooltips
 * 
 * This component scans the provided text for financial terms defined in our dictionary
 * and wraps them with tooltips that provide definitions.
 */
export function FinancialTermsHighlighter({ 
  text,
  className
}: FinancialTermsHighlighterProps) {
  // Only process if we have text
  if (!text) return null;

  // Get all the terms we want to highlight
  const terms = Object.keys(financialTerms);
  
  // Sort terms by length (longest first) to avoid partial term matches
  // e.g., "interest rate" should be matched before "interest"
  const sortedTerms = terms.sort((a, b) => b.length - a.length);
  
  // Start with the text in an array with a single element
  let parts: (string | JSX.Element)[] = [text];
  
  // For each financial term, split the text and add tooltips where the term is found
  sortedTerms.forEach(term => {
    // For case-insensitive matching
    const lowerTerm = term.toLowerCase();
    
    // Process each part
    parts = parts.flatMap(part => {
      // Skip JSX elements that are already processed
      if (typeof part !== 'string') return part;
      
      const lowerPart = part.toLowerCase();
      if (!lowerPart.includes(lowerTerm)) return part;
      
      // Split the text by the term
      const splitParts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      let index;
      
      // Find all instances of the term in the text
      while ((index = lowerPart.indexOf(lowerTerm, lastIndex)) !== -1) {
        // Add text before the term
        if (index > lastIndex) {
          splitParts.push(part.substring(lastIndex, index));
        }
        
        // Add the term with a tooltip
        const actualTerm = part.substring(index, index + term.length);
        splitParts.push(
          <FinancialTermTooltip 
            key={`${term}-${index}`} 
            term={term} 
            definition={financialTerms[term]}
            showIcon={false}
          >
            <span className="border-b border-dotted border-blue-500 cursor-help">
              {actualTerm}
            </span>
          </FinancialTermTooltip>
        );
        
        // Move past this term
        lastIndex = index + term.length;
      }
      
      // Add any remaining text
      if (lastIndex < part.length) {
        splitParts.push(part.substring(lastIndex));
      }
      
      return splitParts;
    });
  });
  
  return (
    <span className={className}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>{part}</React.Fragment>
      ))}
    </span>
  );
}