/**
 * Type definitions for Google Maps Places API
 */

declare namespace google.maps {
  namespace places {
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
      bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
      componentRestrictions?: {
        country: string | string[];
      };
      location?: google.maps.LatLng | google.maps.LatLngLiteral;
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
      constructor(attrContainer: HTMLDivElement | google.maps.Map);
      getDetails(
        request: { placeId: string; fields?: string[] },
        callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
      ): void;
    }

    interface PlaceResult {
      address_components?: google.maps.AddressComponent[];
      formatted_address?: string;
      geometry?: {
        location: google.maps.LatLng;
        viewport?: google.maps.LatLngBounds;
      };
      place_id?: string;
      name?: string;
      types?: string[];
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
}