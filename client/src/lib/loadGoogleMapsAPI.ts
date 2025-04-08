/**
 * Helper function to load the Google Maps API dynamically
 */
let isLoading = false;
let isLoaded = false;
let loadError: Error | null = null;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsAPI(): Promise<void> {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }
  
  // Return immediately if already loaded
  if (isLoaded) {
    return Promise.resolve();
  }
  
  // Check if script is already in document (might have been added manually)
  if (window.google?.maps?.places) {
    isLoaded = true;
    return Promise.resolve();
  }
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key not found. Please check environment configuration.');
    return Promise.reject(new Error('Google Maps API key not found'));
  }
  
  console.log('Loading Google Maps API...');
  isLoading = true;
  
  loadPromise = new Promise<void>((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    // Use API key from environment without logging it
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // Success handler
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      isLoaded = true;
      isLoading = false;
      loadError = null;
      resolve();
    };
    
    // Error handler
    script.onerror = (e) => {
      console.error('Failed to load Google Maps API', e);
      isLoading = false;
      loadError = new Error('Failed to load Google Maps API');
      reject(loadError);
      
      // Clean up failed script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // Reset promise so we can try again
      loadPromise = null;
    };
    
    // Add to document
    document.head.appendChild(script);
  });
  
  return loadPromise;
}

export function getGoogleMapsLoadingState() {
  return {
    isLoading,
    isLoaded,
    error: loadError,
  };
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded || !!window.google?.maps?.places;
}

export function resetGoogleMapsError(): void {
  loadError = null;
  loadPromise = null;
}