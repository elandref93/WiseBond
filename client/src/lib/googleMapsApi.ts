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
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
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