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
  const initialized = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // We're directly initializing since the Google Maps script is loaded in index.html
  useEffect(() => {
    // Function to initialize autocomplete
    const initializeAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current || initialized.current) {
        return false;
      }

      try {
        
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
        
        initialized.current = true;
        return true;
      } catch (err) {
        setError('Error initializing address search');
        return false;
      }
    };

    // Try to initialize immediately
    if (!initializeAutocomplete()) {
      // If it fails, retry after a delay (in case the script is still loading)
      const timeoutId = setTimeout(() => {
        if (!initializeAutocomplete()) {
          // Still failed after retry - show error
          setError('Address auto-completion is unavailable. Please type your address manually.');
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [onChange, onSelect]);

  return (
    <div className="w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
