import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: {
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter an address',
  className,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API script
  useEffect(() => {
    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key is missing');
        setError('Google Maps API key is missing');
        return;
      }
      
      console.log('Loading Google Maps API...');
      
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      // Set up callback
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setError('Failed to load Google Maps API');
      };
      
      // Add to document
      document.head.appendChild(script);
      
      return () => {
        // Clean up on unmount
        document.head.removeChild(script);
      };
    } else {
      console.log('Google Maps API already loaded');
      setScriptLoaded(true);
    }
  }, []);

  // Initialize autocomplete once script is loaded
  useEffect(() => {
    if (scriptLoaded && inputRef.current) {
      try {
        console.log('Initializing Google Places Autocomplete');
        
        // Initialize autocomplete with South Africa as the default country
        const options = {
          componentRestrictions: { country: 'za' },
          fields: ['address_components', 'formatted_address'],
          types: ['address'],
        };
        
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          options
        );
        
        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place && place.address_components) {
            // Update input value with formatted address
            if (place.formatted_address) {
              onChange(place.formatted_address);
            }
            
            // Extract address components for callback
            if (onSelect) {
              // Helper function to find address component
              const findComponent = (type: string) => {
                const component = place.address_components.find(
                  (comp: any) => comp.types.includes(type)
                );
                return component ? component.long_name : '';
              };
              
              // Get the short name for postal code and street number
              const findShortComponent = (type: string) => {
                const component = place.address_components.find(
                  (comp: any) => comp.types.includes(type)
                );
                return component ? component.short_name : '';
              };

              // Extract components
              const streetNumber = findShortComponent('street_number');
              const route = findComponent('route');
              const streetAddress = streetNumber && route 
                ? `${streetNumber} ${route}` 
                : place.formatted_address || '';
                
              const city = findComponent('locality') || findComponent('sublocality');
              const province = findComponent('administrative_area_level_1');
              const postalCode = findShortComponent('postal_code');
              
              // Call the callback with extracted data
              onSelect({
                streetAddress,
                city,
                province,
                postalCode,
              });
            }
          }
        });
      } catch (err) {
        console.error('Error initializing Google Places Autocomplete:', err);
        setError('Error initializing address search');
      }
    }
  }, [scriptLoaded, onSelect, onChange]);

  return (
    <div className="w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={!scriptLoaded}
      />
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}