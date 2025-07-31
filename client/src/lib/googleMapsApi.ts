/**
 * Google Maps API Configuration
 * Handles API key retrieval with fallback strategies for different environments
 */

// Try multiple sources for the API key
const getApiKey = (): string | undefined => {
  // 1. Try Vite environment variable (build-time)
  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
  
  // 2. Try direct environment variable (runtime)
  if (import.meta.env.GOOGLE_MAPS_API_KEY) {
    return import.meta.env.GOOGLE_MAPS_API_KEY;
  }
  
  // 3. Try to get from window object (if set by server)
  if (typeof window !== 'undefined' && (window as any).GOOGLE_MAPS_API_KEY) {
    return (window as any).GOOGLE_MAPS_API_KEY;
  }
  
  // 4. Try to fetch from server endpoint (fallback)
  return undefined;
};

export const googleMapsConfig = {
  apiKey: getApiKey(),
  libraries: ['places'] as const,
  version: 'weekly' as const,
};

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('Google Maps API Configuration:', {
    hasApiKey: !!googleMapsConfig.apiKey,
    apiKeyPrefix: googleMapsConfig.apiKey ? googleMapsConfig.apiKey.substring(0, 10) + '...' : 'none',
    environment: import.meta.env.MODE,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
}

// Export for use in components
export const getGoogleMapsApiKey = (): string | undefined => {
  return googleMapsConfig.apiKey;
};

// Check if API is properly configured
export const isGoogleMapsConfigured = (): boolean => {
  return !!googleMapsConfig.apiKey && googleMapsConfig.apiKey.startsWith('AIza');
};

/**
 * Google Maps API script loader and type declarations
 * This provides a more reliable way to load the Google Maps API and work with TypeScript
 */

// Flag to track if script has been loaded
let isLoaded = false;
let isLoading = false;
let hasError = false;
let errorMessage = '';
let callbackQueue: (() => void)[] = [];

/**
 * Load the Google Maps API with Places library
 * @returns Promise that resolves when API is loaded
 */
export function loadGoogleMapsApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    // If currently loading, add to callback queue
    if (isLoading) {
      callbackQueue.push(() => resolve());
      return;
    }

    // If previous load attempt failed
    if (hasError) {
      reject(new Error(errorMessage));
      return;
    }

    // Start loading
    isLoading = true;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = 'Google Maps API key is missing. Please check your environment variables.';
      errorMessage = error;
      hasError = true;
      isLoading = false;
      reject(new Error(error));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    // Securely use API key without logging it
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // Handle script load success
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
      
      // Process any queued callbacks
      callbackQueue.forEach(callback => callback());
      callbackQueue = [];
    };
    
    // Handle script load error
    script.onerror = () => {
      const error = 'Failed to load Google Maps API. Please try again later.';
      errorMessage = error;
      hasError = true;
      isLoading = false;
      
      reject(new Error(error));
      
      // Notify queued callbacks about error
      callbackQueue.forEach(() => reject(new Error(error)));
      callbackQueue = [];
      
      // Clean up failed script tag
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
    
    // Add script to document
    document.head.appendChild(script);
  });
}

/**
 * Check if Google Maps API is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded && !!window.google && !!window.google.maps;
}

/**
 * Get the current loading/error state of the API
 */
export function getGoogleMapsLoadingState() {
  return {
    isLoaded,
    isLoading,
    hasError,
    errorMessage
  };
}

/**
 * Reset error state to allow another attempt
 */
export function resetGoogleMapsError(): void {
  hasError = false;
  errorMessage = '';
}

/**
 * Helper to find a specific address component by type
 */
export function findAddressComponent(
  components: google.maps.AddressComponent[],
  type: string
): google.maps.AddressComponent | undefined {
  return components.find(component => component.types.includes(type));
}

// Types are defined in ../types/google-maps.d.ts