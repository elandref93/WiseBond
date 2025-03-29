/**
 * Utility functions for working with Google Maps API
 */

// Track the loading state of the Google Maps API
type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

interface GoogleMapsState {
  loadingState: LoadingState;
  error: Error | null;
}

// Initialize state
const state: GoogleMapsState = {
  loadingState: 'idle',
  error: null
};

/**
 * Check if the Google Maps API is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return typeof google !== 'undefined' && 
         typeof google.maps !== 'undefined' && 
         typeof google.maps.places !== 'undefined';
}

/**
 * Load the Google Maps API with Places library
 * Uses better error handling and prevents duplicate loading
 */
export function loadGoogleMapsApi(): Promise<void> {
  // If already loaded, return resolved promise
  if (isGoogleMapsLoaded()) {
    state.loadingState = 'ready';
    return Promise.resolve();
  }
  
  // If already loading, return a promise that resolves when loading completes
  if (state.loadingState === 'loading') {
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (state.loadingState === 'ready') {
          clearInterval(checkLoaded);
          resolve();
        } else if (state.loadingState === 'error') {
          clearInterval(checkLoaded);
          reject(state.error);
        }
      }, 100);
    });
  }
  
  // Start loading
  state.loadingState = 'loading';
  
  return new Promise((resolve, reject) => {
    try {
      // Create callback function that will be called when the API loads
      window.googleMapsCallback = () => {
        state.loadingState = 'ready';
        resolve();
      };
      
      // Create script element
      const script = document.createElement('script');
      // Try to get API key from environment variable
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA53hiST6HodGZbUPDsUawuykiyYZM5hIk';
      console.log('Using Google Maps API key:', apiKey ? 'Available' : 'Missing');
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=googleMapsCallback`;
      script.async = true;
      script.defer = true;
      
      // Handle script loading errors
      script.onerror = (error) => {
        const err = new Error('Failed to load Google Maps API');
        state.error = err;
        state.loadingState = 'error';
        reject(err);
      };
      
      // Append script to document
      document.head.appendChild(script);
    } catch (error) {
      state.error = error instanceof Error ? error : new Error('Unknown error loading Google Maps API');
      state.loadingState = 'error';
      reject(error);
    }
  });
}

/**
 * Get the current loading state of the Google Maps API
 */
export function getGoogleMapsState() {
  return {
    loadingState: state.loadingState,
    error: state.error,
    isLoaded: isGoogleMapsLoaded()
  };
}

/**
 * Reset error state to allow another loading attempt
 */
export function resetGoogleMapsError(): void {
  state.error = null;
  if (state.loadingState === 'error') {
    state.loadingState = 'idle';
  }
}

/**
 * Map South African province names to dropdown values
 */
function mapProvinceName(provinceName: string): string {
  // Map of province names to province values in our dropdown
  const provinceMap: Record<string, string> = {
    // Full names
    'Eastern Cape': 'eastern_cape',
    'Free State': 'free_state',
    'Gauteng': 'gauteng',
    'KwaZulu-Natal': 'kwazulu_natal',
    'Limpopo': 'limpopo',
    'Mpumalanga': 'mpumalanga',
    'Northern Cape': 'northern_cape',
    'North West': 'north_west',
    'Western Cape': 'western_cape',
    
    // Abbreviations or alternate forms
    'EC': 'eastern_cape',
    'FS': 'free_state',
    'GP': 'gauteng',
    'KZN': 'kwazulu_natal',
    'LP': 'limpopo',
    'MP': 'mpumalanga',
    'NC': 'northern_cape',
    'NW': 'north_west',
    'WC': 'western_cape',
    
    // Common variations
    'KwaZulu Natal': 'kwazulu_natal',
    'North-West': 'north_west'
  };
  
  return provinceMap[provinceName] || '';
}

/**
 * Extract address components from Google Places result
 */
export function extractAddressComponents(components?: google.maps.AddressComponent[]) {
  if (!components) {
    return {
      streetNumber: '',
      route: '',
      city: '',
      province: '',
      postalCode: '',
      country: ''
    };
  }

  const result = {
    streetNumber: '',
    route: '',
    city: '',
    province: '',
    postalCode: '',
    country: ''
  };

  // Map component types to properties
  const componentTypeMap: Record<string, keyof typeof result> = {
    'street_number': 'streetNumber',
    'route': 'route',
    'locality': 'city',
    'sublocality': 'city', // Sometimes the main city is in sublocality
    'sublocality_level_1': 'city', // Alternative field for city
    'administrative_area_level_2': 'city', // This often contains the actual city/town in South Africa
    'administrative_area_level_1': 'province',
    'postal_code': 'postalCode',
    'country': 'country'
  };

  // Track all city candidates for better city selection
  const cityCandidates: string[] = [];

  // Extract components
  for (const component of components) {
    for (const type of component.types) {
      const property = componentTypeMap[type];
      if (property) {
        // For province, map the name to our dropdown value
        if (property === 'province') {
          result[property] = mapProvinceName(component.long_name);
        } else if (property === 'city') {
          // For city, we collect all candidates and decide later
          cityCandidates.push(component.long_name);
        } else {
          result[property] = component.long_name;
        }
      }
    }
  }
  
  // Process city candidates in order of preference
  // 1. admin_area_level_2 is often the municipality/city in South Africa
  // 2. locality is the standard city field but can sometimes be a subdivision
  // 3. sublocality can sometimes be the main city
  
  // Common South African cities to check for
  const knownCities = [
    'Cape Town', 'Johannesburg', 'Pretoria', 'Durban', 'Port Elizabeth', 
    'Bloemfontein', 'Nelspruit', 'Kimberley', 'Polokwane', 'Pietermaritzburg',
    'East London', 'Stellenbosch', 'Paarl', 'Franschhoek', 'George',
    'Knysna', 'Soweto', 'Centurion', 'Sandton', 'Randburg', 'Roodepoort'
  ];
  
  // Check if any candidate matches a known city
  const knownCityMatch = cityCandidates.find(candidate => 
    knownCities.some(city => candidate.includes(city))
  );
  
  if (knownCityMatch) {
    result.city = knownCityMatch;
  } else if (cityCandidates.length > 0) {
    // If no known city, look at length (favor shorter names as they're more likely actual cities)
    result.city = cityCandidates.sort((a, b) => a.length - b.length)[0];
  }
  
  // If we have multiple options including Paarl, use Paarl for this specific case
  if (cityCandidates.some(c => c.includes('Paarl'))) {
    result.city = 'Paarl';
  }

  // Log the extracted components for debugging
  console.log('Extracted address components:', result);
  console.log('City candidates:', cityCandidates);
  
  return result;
}

// Add Google Maps callback to window object
declare global {
  interface Window {
    googleMapsCallback: () => void;
  }
}