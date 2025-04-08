import { usePrimeRate } from "@/hooks/use-prime-rate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

/**
 * A component that displays the current SARB prime rate with a refresh button and tooltip
 */
export default function PrimeRateIndicator() {
  const { toast } = useToast();
  const { 
    data: primeRateData, 
    isLoading, 
    isError, 
    refetch,
    isRefetching
  } = usePrimeRate();
  
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Prime rate refreshed",
        description: "The latest prime rate has been fetched from the South African Reserve Bank",
      });
    } catch (error) {
      toast({
        title: "Failed to refresh prime rate",
        description: "Could not fetch the latest prime rate. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground flex items-center animate-pulse">
        <span>Loading prime rate...</span>
      </div>
    );
  }
  
  if (isError || !primeRateData) {
    return (
      <div className="text-sm text-destructive flex items-center gap-2">
        <span>Error loading prime rate</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
          Retry
        </Button>
      </div>
    );
  }
  
  // Format the date strings
  const formattedEffectiveDate = primeRateData.effectiveDate
    ? format(new Date(primeRateData.effectiveDate), 'dd MMM yyyy')
    : 'Unknown';
    
  const formattedLastUpdated = primeRateData.lastUpdated
    ? format(new Date(primeRateData.lastUpdated), 'dd MMM yyyy HH:mm')
    : 'Unknown';
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-sm">
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
                <p className="text-xs">Effective from: {formattedEffectiveDate}</p>
                <p className="text-xs">Last checked: {formattedLastUpdated}</p>
                <p className="text-xs mt-2">The prime rate is the benchmark interest rate at which banks lend to their most creditworthy customers.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 px-2" 
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </TooltipProvider>
  );
}