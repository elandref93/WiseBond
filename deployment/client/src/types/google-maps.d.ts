/**
 * Type definitions for Google Maps API
 * These declarations supplement the built-in types from @types/google.maps
 */

declare namespace google.maps {
  interface PlaceResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
    geometry?: {
      location: LatLng;
      viewport?: LatLngBounds;
    };
    place_id?: string;
    name?: string;
    types?: string[];
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface AutocompletePrediction {
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text: string;
      main_text_matched_substrings: Array<{
        offset: number;
        length: number;
      }>;
      secondary_text: string;
    };
    terms: Array<{
      offset: number;
      value: string;
    }>;
    types: string[];
    matched_substrings: Array<{
      offset: number;
      length: number;
    }>;
  }

  interface AutocompletionRequest {
    input: string;
    bounds?: LatLngBounds | LatLngBoundsLiteral;
    componentRestrictions?: {
      country: string | string[];
    };
    location?: LatLng | LatLngLiteral;
    offset?: number;
    radius?: number;
    sessionToken?: AutocompleteSessionToken;
    types?: string[];
  }

  class AutocompleteService {
    getPlacePredictions(
      request: AutocompletionRequest,
      callback: (
        predictions: AutocompletePrediction[] | null,
        status: PlacesServiceStatus
      ) => void
    ): void;
  }

  class AutocompleteSessionToken {}

  class PlacesService {
    constructor(attrContainer: HTMLDivElement | Map);
    getDetails(
      request: { placeId: string; fields?: string[] },
      callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
    ): void;
  }

  enum PlacesServiceStatus {
    OK = "OK",
    ZERO_RESULTS = "ZERO_RESULTS",
    OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
    REQUEST_DENIED = "REQUEST_DENIED",
    INVALID_REQUEST = "INVALID_REQUEST",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    NOT_FOUND = "NOT_FOUND",
  }
}