/**
 * Prime Rate Service
 * 
 * This service fetches the prime lending rate from the South African Reserve Bank API
 * and provides it to the application. It caches the result to minimize API calls.
 */

import axios from 'axios';
import https from 'https';

interface SARBRateEntry {
  Name: string;
  SectionId: string;
  SectionName: string;
  TimeseriesCode: string;
  Date: string;
  Value: number;
  UpDown: number;
  FormatNumber: string;
  FormatDate: string;
}

interface PrimeRateResult {
  primeRate: number;
  effectiveDate: string;
  lastUpdated: Date;
  source: string;
}

// Cache mechanism
let cachedPrimeRate: PrimeRateResult | null = null;
let lastFetchTimestamp: number = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// SARB API endpoints
const PRIMARY_API_URL = 'https://custom.resbank.co.za/SarbWebApi/WebIndicators/HomePageRates';
const BACKUP_API_URL = 'https://custom.resbank.co.za/SarbWebApi/WebIndicators/CurrentMarketRates/';

/**
 * Fetch the prime rate from the SARB API
 * @param useBackupAPI Whether to use the backup API endpoint
 * @returns The prime rate result or null if both APIs fail
 */
async function fetchPrimeRateFromAPI(useBackupAPI: boolean = false): Promise<PrimeRateResult | null> {
  const apiUrl = useBackupAPI ? BACKUP_API_URL : PRIMARY_API_URL;
  
  try {
    console.log(`Fetching prime rate from ${useBackupAPI ? 'backup' : 'primary'} SARB API...`);
    
    // Configure axios to handle certificate issues with SARB's SSL certificate
    const axiosConfig = {
      timeout: 10000, // 10 second timeout
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Allow self-signed certificates for SARB API
        keepAlive: true,
        timeout: 10000
      }),
      headers: {
        'User-Agent': 'WiseBond/1.0',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    };
    
    const response = await axios.get<SARBRateEntry[]>(apiUrl, axiosConfig);
    
    const primeRateEntry = response.data.find(entry => entry.Name === 'Prime lending rate');
    
    if (!primeRateEntry) {
      console.error('Prime lending rate not found in SARB API response');
      return null;
    }
    
    return {
      primeRate: primeRateEntry.Value,
      effectiveDate: primeRateEntry.Date,
      lastUpdated: new Date(),
      source: useBackupAPI ? 'backup' : 'primary'
    };
  } catch (error) {
    console.error(`Error fetching prime rate from ${useBackupAPI ? 'backup' : 'primary'} SARB API:`, error);
    return null;
  }
}

/**
 * Get the current prime rate, optionally forcing a refresh
 * @param forceRefresh Whether to force a refresh of the prime rate
 * @returns The current prime rate result
 */
export async function getPrimeRate(forceRefresh: boolean = false): Promise<PrimeRateResult> {
  const currentTime = Date.now();
  const cacheExpired = (currentTime - lastFetchTimestamp) > CACHE_DURATION_MS;
  
  // Use cache if available and not expired, unless force refresh is requested
  if (cachedPrimeRate && !cacheExpired && !forceRefresh) {
    return cachedPrimeRate;
  }
  
  // Try primary API first
  let result = await fetchPrimeRateFromAPI(false);
  
  // If primary API fails, try backup API
  if (!result) {
    result = await fetchPrimeRateFromAPI(true);
  }
  
  // If both APIs fail, use cached value if available
  if (!result && cachedPrimeRate) {
    console.warn('Both SARB APIs failed, using cached prime rate');
    return {
      ...cachedPrimeRate,
      lastUpdated: new Date(), // Update the timestamp to avoid immediate retry
    };
  }
  
  // If no result and no cache, use fallback value
  if (!result) {
    console.error('Failed to fetch prime rate from all sources, using fallback value');
    result = {
      primeRate: 11.0, // Current prime rate as of April 2025
      effectiveDate: new Date().toISOString().split('T')[0], // Today's date
      lastUpdated: new Date(),
      source: 'fallback'
    };
  }
  
  // Update cache and timestamp
  cachedPrimeRate = result;
  lastFetchTimestamp = currentTime;
  
  return result;
}

/**
 * Initialize the prime rate service, performing an initial fetch
 */
export async function initPrimeRateService(): Promise<void> {
  console.log('Initializing Prime Rate Service');
  await getPrimeRate(true);
  
  // Schedule daily updates at 00:05 AM
  scheduleNextUpdate();
}

/**
 * Schedule the next prime rate update
 */
function scheduleNextUpdate(): void {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 5, 0, 0); // 00:05 AM tomorrow
  
  const timeUntilNextUpdate = tomorrow.getTime() - now.getTime();
  
  console.log(`Scheduling next prime rate update in ${Math.round(timeUntilNextUpdate / (1000 * 60 * 60))} hours`);
  
  setTimeout(async () => {
    await getPrimeRate(true);
    scheduleNextUpdate();
  }, timeUntilNextUpdate);
}