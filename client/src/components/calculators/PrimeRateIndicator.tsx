import { usePrimeRate } from "@/hooks/use-prime-rate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

/**
 * A component that displays the current SARB prime rate with a tooltip
 */
export default function PrimeRateIndicator() {
  const { 
    data: primeRateData, 
    isLoading, 
    isError
  } = usePrimeRate();
  
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground flex items-center animate-pulse">
        <span>Loading prime rate...</span>
      </div>
    );
  }
  
  if (isError || !primeRateData) {
    return (
      <div className="text-sm text-destructive flex items-center">
        <span>Error loading prime rate</span>
      </div>
    );
  }
  
  // Format the last updated date
  const formattedLastUpdated = primeRateData.lastUpdated
    ? format(new Date(primeRateData.lastUpdated), 'dd MMM yyyy HH:mm')
    : 'Unknown';
  
  return (
    <TooltipProvider>
      <div className="flex items-center text-sm">
        <div className="flex items-center">
          <span className="font-medium">Current Prime Rate:</span>
          <span className="font-bold text-primary ml-1">{primeRateData.primeRate}%</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto ml-1">
                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-80">
              <div className="space-y-1">
                <p className="font-medium">South African Reserve Bank Prime Lending Rate</p>
                <p className="text-xs">Last checked: {formattedLastUpdated}</p>
                <p className="text-xs mt-2">The prime rate is the benchmark interest rate at which banks lend to their most creditworthy customers.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}