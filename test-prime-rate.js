// Test script to fetch the South African Prime Rate from SARB API

async function fetchPrimeRate() {
  try {
    console.log('Attempting to fetch prime rate from SARB API...');
    
    // First try with the path mentioned by the user
    const response = await fetch('https://custom.resbank.co.za/SarbWebApi/api/WebIndicators/HomePageRates', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return;
    } else {
      console.log('Initial endpoint failed, trying alternatives...');
    }

    // Try some alternative URLs that might work
    const alternatives = [
      'https://www.resbank.co.za/api/rates/prime', 
      'https://www.resbank.co.za/api/rates/current',
      'https://www.resbank.co.za/api/rates',
      'https://www.resbank.co.za/api/statistics/key-statistics/selected-rates',
      'https://www.resbank.co.za/api/indicators',
      'https://custom.resbank.co.za/api/rates'
    ];
    
    for (const url of alternatives) {
      console.log(`Trying alternative URL: ${url}`);
      try {
        const altResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log(`Status for ${url}:`, altResponse.status);
        
        if (altResponse.ok) {
          const data = await altResponse.json();
          console.log('Response data:', JSON.stringify(data, null, 2));
          break;
        } else {
          console.log(`Alternative ${url} failed with status ${altResponse.status}`);
        }
      } catch (error) {
        console.log(`Error with ${url}:`, error.message);
      }
    }
    
    // Manual fallback - grab the prime rate from the HTML page directly
    console.log('\nTrying to fetch from the main website...');
    const htmlResponse = await fetch('https://www.resbank.co.za/en/home/what-we-do/statistics/key-statistics/selected-rates');
    
    if (htmlResponse.ok) {
      const htmlText = await htmlResponse.text();
      console.log('HTML response length:', htmlText.length);
      
      // Look for patterns that might contain the prime rate
      // Common patterns: "Prime rate" or "Prime lending rate" followed by a percentage
      const primeRatePatterns = [
        /Prime\s+rate\s*:?\s*(\d+\.\d+)%/i,
        /Prime\s+lending\s+rate\s*:?\s*(\d+\.\d+)%/i,
        /Prime\s*:?\s*(\d+\.\d+)%/i,
        /prime\s+overdraft\s+rate\s*:?\s*(\d+\.\d+)%/i
      ];
      
      for (const pattern of primeRatePatterns) {
        const match = htmlText.match(pattern);
        if (match && match[1]) {
          console.log(`Found prime rate using pattern ${pattern}: ${match[1]}%`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
fetchPrimeRate();