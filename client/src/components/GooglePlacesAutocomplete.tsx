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
        // Initialize autocomplete with South Africa as the only allowed country
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'za' }, // Strictly restrict to South Africa only
          fields: ['address_components', 'formatted_address', 'geometry'],
          types: ['address'],
        });
        
        // Add strict validation to ensure only South African addresses are accepted
        const southAfricaBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(-34.839828, 16.451056), // SW point of South Africa
          new window.google.maps.LatLng(-22.126612, 32.891137)  // NE point of South Africa
        );
        autocompleteRef.current.setBounds(southAfricaBounds);
        autocompleteRef.current.setOptions({ strictBounds: true });

        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place && place.address_components) {
            // First, validate that this is indeed a South African address
            const country = findAddressComponent(place.address_components, 'country');
            const isInSouthAfrica = country?.short_name === 'ZA';
            
            if (!isInSouthAfrica) {
              setError('Only South African addresses are supported. Please select an address within South Africa.');
              return;
            }
            
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
              
              // Clear any previous errors
              setError(null);
              
              onSelect({
                streetAddress,
                city,
                province,
                postalCode,
              });
            }
          } else {
            // If place doesn't have address components, show an error
            setError('Please select a valid address from the dropdown suggestions.');
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