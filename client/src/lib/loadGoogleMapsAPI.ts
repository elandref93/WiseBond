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
  
  // Check for API key - more helpful error handling
  if (!apiKey) {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.error(`
Google Maps API key not found. Please check:
1. .env file has VITE_GOOGLE_MAPS_API_KEY set
2. Server has copied GOOGLE_MAPS_API_KEY to VITE_GOOGLE_MAPS_API_KEY
3. Vite has restarted after environment changes`);
    } else {
      console.error('Maps functionality unavailable. Please contact support if this issue persists.');
    }
    
    return Promise.reject(new Error('Google Maps API key not found'));
  }
  
  // Validate API key format
  if (!apiKey.startsWith('AIza')) {
    console.warn('The Google Maps API key may be invalid. Google Maps API keys typically start with "AIza"');
  }
  
  console.log('Loading Google Maps API...');
  isLoading = true;
  
  loadPromise = new Promise<void>((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    
    // Enhance security: Only use API key on production domains or localhost
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isProductionDomain = hostname.endsWith('wisebond.co.za') || 
                              hostname.endsWith('replit.app') ||
                              hostname.endsWith('azurewebsites.net');
                              
    // Use API key from environment without logging it, and only on allowed domains
    if (isProductionDomain || isLocalhost) {
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    } else {
      console.warn('Using Google Maps API without key on non-production domain');
      script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places';
    }
    
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
      // Enhanced error reporting without exposing full API key
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isProductionDomain = hostname.endsWith('wisebond.co.za') || 
                              hostname.endsWith('replit.app') ||
                              hostname.endsWith('azurewebsites.net');
      
      // Only report detailed errors in development environments
      if (isLocalhost) {
        console.error('Failed to load Google Maps API', e);
        
        // Check if API key exists but is malformed (wrong format)
        if (apiKey && !apiKey.startsWith('AIza')) {
          console.error('API key appears to be malformed. Google Maps API keys start with "AIza"');
        }
      } else {
        console.error('Failed to load Google Maps API. Please contact support if this issue persists.');
      }
      
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