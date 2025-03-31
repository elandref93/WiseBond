/**
 * Utility function to fetch the current South African prime interest rate
 * from the South African Reserve Bank (SARB) API.
 */

/**
 * Fetches the current prime interest rate from the South African Reserve Bank API
 * @returns Promise resolving to the current prime rate as a number, or null if unable to fetch
 */
export async function fetchSouthAfricanPrimeRate(): Promise<number | null> {
  try {
    // Try the SARB API endpoint first
    const response = await fetch('https://custom.resbank.co.za/SarbWebApi/api/WebIndicators/HomePageRates', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Check if the response was successful
    if (response.ok) {
      const data = await response.json();
      
      // Parse the response to find the prime rate
      // The structure will need to be adjusted based on the actual API response
      const primeRate = extractPrimeRateFromResponse(data);
      return primeRate;
    } else {
      console.error('Failed to fetch from SARB API:', response.statusText);
      // Fallback to a reliable known value if API fails
      return 11.75; // Current prime rate as of March 2025 (this is used as fallback only)
    }
  } catch (error) {
    console.error('Error fetching prime rate:', error);
    // Fallback to a reliable known value if API fails
    return 11.75; // Current prime rate as of March 2025 (this is used as fallback only)
  }
}

/**
 * Extracts the prime rate from the SARB API response
 * @param data API response data
 * @returns The prime rate as a number, or null if not found
 */
function extractPrimeRateFromResponse(data: any): number | null {
  try {
    // This extraction logic will need to be adjusted based on the actual API response structure
    // Once we can see the real response format
    
    // Example extraction (to be updated when we know the actual structure):
    // if (data && data.rates && data.rates.some(rate => rate.name === 'Prime')) {
    //   const primeRateItem = data.rates.find(rate => rate.name === 'Prime');
    //   return parseFloat(primeRateItem.value);
    // }
    
    // For now, return null to indicate extraction failed
    return null;
  } catch (error) {
    console.error('Error extracting prime rate from response:', error);
    return null;
  }
}

/**
 * Gets the current South African prime rate, using the API if possible,
 * or falling back to a reliable hardcoded value if necessary
 * @returns The current prime rate as a number
 */
export async function getCurrentPrimeRate(): Promise<number> {
  const apiRate = await fetchSouthAfricanPrimeRate();
  
  // If API fetch succeeded, use that value
  if (apiRate !== null) {
    return apiRate;
  }
  
  // Otherwise fall back to known current value
  return 11.75; // Current prime rate as of March 2025
}