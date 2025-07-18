import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadGoogleMapsAPI, getGoogleMapsLoadingState } from '@/lib/loadGoogleMapsAPI';
import BasicAddressInput from './BasicAddressInput';

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
  // State
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const hasBeenInitialized = useRef<boolean>(false);

  // Try to load the Google Maps API
  useEffect(() => {
    // Only attempt to load if not already loaded or initializing
    if (!hasBeenInitialized.current) {
      setStatus('loading');
      
      loadGoogleMapsAPI()
        .then(() => {
          setStatus('ready');
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to load Google Maps API:', err);
          setStatus('error');
          setError('Address search is temporarily unavailable. You can still enter your address manually below.');
        });
    }
    
    // Clean up on unmount
    return () => {
      if (autocompleteRef.current) {
        // No explicit cleanup needed for Google Places Autocomplete
        autocompleteRef.current = null;
      }
    };
  }, []);

  // Initialize Autocomplete when API is ready and input is available
  useEffect(() => {
    // Only initialize if we're ready and have an input element
    if (status === 'ready' && inputRef.current && !hasBeenInitialized.current) {
      try {
        // Create the autocomplete instance
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'za' },
          fields: ['address_components', 'formatted_address'],
          types: ['address']
        });

        // Add a listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          if (!autocompleteRef.current) return;
          
          const place = autocompleteRef.current.getPlace();
          
          // Handle the selected place
          if (place && place.address_components) {
            // Update the input value
            if (place.formatted_address) {
              onChange(place.formatted_address);
            }
            
            // Extract address components if callback provided
            if (onSelect) {
              // Helper functions to extract components
              const findComponent = (type: string): string => {
                const component = place.address_components?.find(
                  (comp: any) => comp.types.includes(type)
                );
                return component ? component.long_name : '';
              };
              
              const findShortComponent = (type: string): string => {
                const component = place.address_components?.find(
                  (comp: any) => comp.types.includes(type)
                );
                return component ? component.short_name : '';
              };
              
              // Extract the components
              const streetNumber = findShortComponent('street_number');
              const route = findComponent('route');
              const streetAddress = streetNumber && route 
                ? `${streetNumber} ${route}`
                : place.formatted_address || '';
              
              const city = findComponent('locality') || findComponent('sublocality');
              const province = findComponent('administrative_area_level_1');
              const postalCode = findShortComponent('postal_code');
              
              // Call the callback
              onSelect({
                streetAddress,
                city,
                province,
                postalCode
              });
            }
          }
        });
        
        hasBeenInitialized.current = true;
      } catch (err) {
        console.error('Error initializing Google Places Autocomplete:', err);
        setStatus('error');
        setError('Error initializing address search. Please enter your address manually.');
      }
    }
  }, [status, onChange, onSelect]);

  // If there's an error, fall back to the basic input
  if (status === 'error') {
    return (
      <div className="w-full">
        <BasicAddressInput
          value={value}
          onChange={onChange}
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

  // Otherwise render the input that will be enhanced with autocomplete
  return (
    <div className="w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={status === 'loading' ? 'Loading address search...' : placeholder}
        className={className}
      />
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {status === 'loading' && (
        <p className="text-xs text-muted-foreground mt-1">
          Loading address search functionality...
        </p>
      )}
    </div>
  );
}