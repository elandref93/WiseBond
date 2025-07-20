import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, FocusEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  loadGoogleMapsApi,
  isGoogleMapsLoaded,
  getGoogleMapsState,
  extractAddressComponents,
  resetGoogleMapsError
} from '@/lib/googleMaps';

interface AddressInputProps {
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

/**
 * An improved address input component with Google Places autocomplete
 * Features better error handling and fallback mode
 */
export default function ImprovedAddressInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter an address',
  className,
}: AddressInputProps) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [inputTimeout, setInputTimeout] = useState<number | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const [apiStatus, setApiStatus] = useState({
    isLoading: false,
    isLoaded: isGoogleMapsLoaded(),
    error: null as Error | null,
    loadAttempts: 0
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const dummyElementRef = useRef<HTMLDivElement | null>(null);

  // Initialize Google Maps API
  useEffect(() => {
    if (!apiStatus.isLoaded && !apiStatus.isLoading && apiStatus.loadAttempts < 3) {
      setApiStatus(prev => ({...prev, isLoading: true}));
      
      loadGoogleMapsApi()
        .then(() => {
          setApiStatus({
            isLoaded: true,
            isLoading: false,
            error: null,
            loadAttempts: apiStatus.loadAttempts + 1
          });
          initializeServices();
        })
        .catch(error => {
          console.error('Error loading Google Maps API:', error);
          
          // Provide more specific error messages based on the error
          let errorMessage = 'Address suggestions are temporarily unavailable.';
          
          if (error.message.includes('API key not found')) {
            errorMessage = 'Address search is not configured. Please contact support.';
          } else if (error.message.includes('Failed to load')) {
            errorMessage = 'Unable to load address search. Please check your internet connection.';
          }
          
          setApiStatus({
            isLoaded: false,
            isLoading: false,
            error: new Error(errorMessage),
            loadAttempts: apiStatus.loadAttempts + 1
          });
        });
    }
  }, [apiStatus.loadAttempts]);

  // Initialize autocomplete service when Google Maps is loaded
  const initializeServices = () => {
    if (isGoogleMapsLoaded()) {
      // Create a dummy element for PlacesService
      if (!dummyElementRef.current) {
        dummyElementRef.current = document.createElement('div');
      }
      
      // Create a new session token
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      
      // Initialize services
      autoCompleteServiceRef.current = new google.maps.places.AutocompleteService();
      placesServiceRef.current = new google.maps.places.PlacesService(dummyElementRef.current);
    }
  };

  // Keep local value in sync with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Update predictions when user types
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    
    // Clear existing timeout
    if (inputTimeout !== null) {
      window.clearTimeout(inputTimeout);
    }
    
    // Set a new timeout to avoid excessive API calls
    if (newValue.length >= 3 && apiStatus.isLoaded) {
      const timeout = window.setTimeout(() => {
        fetchPredictions(newValue);
      }, 300);
      setInputTimeout(timeout as unknown as number);
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  // Get predictions from Google Places Autocomplete service
  const fetchPredictions = (input: string) => {
    if (!apiStatus.isLoaded || !autoCompleteServiceRef.current || input.length < 3) {
      return;
    }
    
    const request: google.maps.places.AutocompletionRequest = {
      input,
      componentRestrictions: { country: 'za' }, // Restrict to South Africa
      sessionToken: sessionTokenRef.current ?? undefined
    };
    
    autoCompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
          setIsOpen(true);
          setActiveIndex(-1);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  };

  // Handle place selection and fetch place details
  const handlePlaceSelect = (placeId: string, description: string) => {
    if (!placesServiceRef.current) return;
    
    // Update input value immediately for better UX
    setLocalValue(description);
    onChange(description);
    setIsOpen(false);
    
    // Fetch place details with more fields
    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'name',
          'place_id',
          'types'
        ]
      },
      (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // Store raw data for reference
          console.log('Google Place details:', place);
          
          // Extract address components with original data preserved
          const components = extractAddressComponents(place.address_components);
          
          // Store the raw place data for reference
          components.rawData = place;
          
          // Create street address
          const streetAddress = components.streetNumber
            ? `${components.streetNumber} ${components.route}`
            : components.route;
          
          // Use formatted_address as fallback if street address components are missing
          const finalStreetAddress = streetAddress || place.formatted_address || description;
          
          // Call onSelect if provided
          if (onSelect) {
            onSelect({
              streetAddress: finalStreetAddress,
              city: components.city,
              province: components.province,
              postalCode: components.postalCode
            });
          }
          
          // Create a new session token for next search
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    
    // Navigate down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => 
        prev < predictions.length - 1 ? prev + 1 : prev
      );
    } 
    // Navigate up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } 
    // Select current option
    else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const prediction = predictions[activeIndex];
      handlePlaceSelect(prediction.place_id, prediction.description);
    } 
    // Close dropdown
    else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Handle focus/blur events
  const handleFocus = () => {
    setIsFocused(true);
    if (localValue.length >= 3 && predictions.length > 0) {
      setIsOpen(true);
    } else if (localValue.length >= 3 && apiStatus.isLoaded) {
      // Try to fetch predictions if input has at least 2 characters
      fetchPredictions(localValue);
    }
  };

  const handleBlur = (e: FocusEvent) => {
    // Delay closing to allow for clicking on suggestions
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, 200);
  };

  // Handle retry when API loading fails
  const handleRetry = () => {
    resetGoogleMapsError();
    setApiStatus(prev => ({...prev, loadAttempts: 0, error: null}));
  };

  return (
    <div className="relative w-full">
      {/* Show loading state */}
      {apiStatus.isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      
      {/* Input field */}
      <Input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        disabled={apiStatus.isLoading}
      />
      
      {/* Error message */}
      {apiStatus.error && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm text-amber-800">
                {apiStatus.error.message}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                You can still enter your address manually below.
              </p>
            </div>
            <button 
              onClick={handleRetry}
              className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Predictions dropdown */}
      {isOpen && predictions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {predictions.map((prediction, index) => (
            <li
              key={prediction.place_id}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                index === activeIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
            >
              {prediction.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}