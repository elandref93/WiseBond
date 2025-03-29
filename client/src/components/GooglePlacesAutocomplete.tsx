import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  loadGoogleMapsApi, 
  isGoogleMapsLoaded, 
  findAddressComponent, 
  getGoogleMapsLoadingState 
} from '@/lib/googleMapsApi';

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
  const [scriptLoaded, setScriptLoaded] = useState(isGoogleMapsLoaded());
  const [error, setError] = useState<string | null>(getGoogleMapsLoadingState().hasError ? getGoogleMapsLoadingState().errorMessage : null);

  // Load Google Maps API script
  useEffect(() => {
    if (!isGoogleMapsLoaded()) {
      loadGoogleMapsApi()
        .then(() => {
          setScriptLoaded(true);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
          console.error('Google Maps API loading error:', err);
        });
    }
  }, []);

  // Initialize autocomplete once script is loaded
  useEffect(() => {
    if (scriptLoaded && inputRef.current && window.google?.maps?.places) {
      try {
        // Initialize autocomplete with South Africa as the default country
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'za' },
          fields: ['address_components', 'formatted_address'],
          types: ['address'],
        });

        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place && place.address_components) {
            // Update input value with formatted address
            const formattedAddress = place.formatted_address;
            if (formattedAddress) {
              onChange(formattedAddress);
            }
            
            // Extract address components
            if (onSelect) {
              const streetNumber = findAddressComponent(place.address_components, 'street_number')?.short_name || '';
              const route = findAddressComponent(place.address_components, 'route')?.long_name || '';
              const streetAddress = streetNumber && route ? `${streetNumber} ${route}` : formattedAddress || '';
              const city = findAddressComponent(place.address_components, 'locality')?.long_name || 
                          findAddressComponent(place.address_components, 'sublocality')?.long_name || '';
              const province = findAddressComponent(place.address_components, 'administrative_area_level_1')?.long_name || '';
              const postalCode = findAddressComponent(place.address_components, 'postal_code')?.short_name || '';
              
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
        setError('Error initializing address search. Please try typing your address manually.');
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