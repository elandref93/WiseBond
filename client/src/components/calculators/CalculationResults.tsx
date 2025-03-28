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

interface CalculationResultsProps {
  results: CalculationResult;
}

export default function CalculationResults({ results }: CalculationResultsProps) {
  if (!results || !results.displayResults || results.displayResults.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 px-4">
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Calculation Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.displayResults.map((result, index) => (
            <Card key={index} className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">{result.label}</div>
                  {result.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{result.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="text-2xl font-bold text-secondary-500">
                  {result.value}
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
