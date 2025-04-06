import { CalculationResult } from "@/lib/calculators";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AmortizationResults from "./AmortizationResults";
import ShareCalculation from "./ShareCalculation";
import EmailCalculationButton from "./EmailCalculationButton";
import DownloadPdfButton from "./DownloadPdfButton";

// Type predicate to check if the calculation type is supported for PDF download
function isPdfSupported(result: CalculationResult): boolean {
  return result.type === 'bond' || result.type === 'amortisation' || result.type === 'additional';
}

interface CalculationResultsProps {
  results: CalculationResult;
  formValues?: any;
}

export default function CalculationResults({ results, formValues }: CalculationResultsProps) {
  if (!results || !results.displayResults || results.displayResults.length === 0) {
    return null;
  }

  // Special rendering for amortization results
  if (results.type === 'amortisation' && results.yearlyData) {
    return (
      <div className="mt-8 px-4">
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Amortization Results
            </h3>
            <div className="flex gap-2">
              <EmailCalculationButton result={results} size="sm" variant="outline" />
              <ShareCalculation result={results} size="sm" />
              {isPdfSupported(results) && (
                <DownloadPdfButton result={results} formValues={formValues} size="sm" variant="outline" />
              )}
            </div>
          </div>
          <AmortizationResults results={results as any} />
        </div>
      </div>
    );
  }

  // Default rendering for other calculator types
  return (
    <div className="w-full">
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Calculation Results
          </h3>
          <div className="flex gap-2">
            <EmailCalculationButton result={results} size="sm" variant="outline" />
            <ShareCalculation result={results} size="sm" />
            {isPdfSupported(results) && (
              <DownloadPdfButton result={results} formValues={formValues} size="sm" variant="outline" />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.displayResults.map((result, index) => (
            <Card key={index} className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{result.label}</div>
                    <div className="text-2xl font-bold text-secondary-500">
                      {result.value}
                    </div>
                  </div>
                  {result.tooltip ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-5 w-5 text-gray-400 mt-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{result.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="w-5 h-5" /> {/* Empty space to maintain layout */}
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Alert>
            <AlertDescription className="text-sm text-gray-500">
              This is an estimate based on the information provided. Actual
              amounts may vary.{" "}
              <a href="/calculators" className="text-primary hover:text-primary-600">
                Learn more about how these calculations work
              </a>
              .
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
