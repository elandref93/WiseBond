import { useQuery } from "@tanstack/react-query";

interface PrimeRateData {
  primeRate: number;
  effectiveDate: string;
  lastUpdated: string;
}

/**
 * Hook to fetch and access the current South African prime interest rate
 * @param enabled Whether to enable the query (defaults to true)
 * @param forceRefresh Whether to force a refresh of the prime rate from the SARB API
 * @returns Query result containing the prime rate data
 */
export function usePrimeRate(enabled = true, forceRefresh = false) {
  return useQuery<PrimeRateData>({
    queryKey: ['/api/prime-rate', forceRefresh ? Date.now() : null],
    queryFn: async ({ signal }) => {
      const url = forceRefresh 
        ? '/api/prime-rate?refresh=true'
        : '/api/prime-rate';
        
      const response = await fetch(url, { signal });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prime rate');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled,
  });
}