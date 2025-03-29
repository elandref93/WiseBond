/**
 * Type definitions for Google Maps JavaScript API
 * These definitions supplement the built-in types
 */

declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      toString(): string;
      toUrlValue(precision?: number): string;
      toJSON(): { lat: number, lng: number };
      equals(other: LatLng): boolean;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      contains(latLng: LatLng): boolean;
      equals(other: LatLngBounds): boolean;
      extend(point: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      intersects(other: LatLngBounds): boolean;
      isEmpty(): boolean;
      toJSON(): { north: number, east: number, south: number, west: number };
      toSpan(): LatLng;
      toString(): string;
      toUrlValue(precision?: number): string;
      union(other: LatLngBounds): LatLngBounds;
    }

    namespace places {
      interface AutocompletionRequest {
        bounds?: LatLngBounds;
        componentRestrictions?: ComponentRestrictions;
        fields?: string[];
        location?: LatLng;
        offset?: number;
        radius?: number;
        strictBounds?: boolean;
        types?: string[];
      }

      interface ComponentRestrictions {
        country: string | string[];
      }

      interface AutocompletePrediction {
        description: string;
        matched_substrings: Array<{ length: number, offset: number }>;
        place_id: string;
        structured_formatting: {
          main_text: string;
          main_text_matched_substrings: Array<{ length: number, offset: number }>;
          secondary_text: string;
        };
        terms: Array<{ offset: number, value: string }>;
        types: string[];
      }

      interface PlaceResult {
        address_components?: GeocoderAddressComponent[];
        adr_address?: string;
        formatted_address?: string;
        geometry?: {
          location: LatLng;
          viewport: LatLngBounds;
        };
        html_attributions?: string[];
        icon?: string;
        name?: string;
        photos?: PlacePhoto[];
        place_id?: string;
        plus_code?: {
          compound_code: string;
          global_code: string;
        };
        price_level?: number;
        rating?: number;
        reviews?: PlaceReview[];
        types?: string[];
        url?: string;
        utc_offset?: number;
        vicinity?: string;
        website?: string;
      }

      interface PlacePhoto {
        height: number;
        html_attributions: string[];
        width: number;
        getUrl(opts: { maxHeight?: number; maxWidth?: number }): string;
      }

      interface PlaceReview {
        author_name: string;
        author_url: string;
        language: string;
        profile_photo_url: string;
        rating: number;
        relative_time_description: string;
        text: string;
        time: number;
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompletionRequest);
        getBounds(): LatLngBounds;
        getPlace(): PlaceResult;
        setBounds(bounds: LatLngBounds): void;
        setComponentRestrictions(restrictions: ComponentRestrictions): void;
        setOptions(options: AutocompletionRequest): void;
        setTypes(types: string[]): void;
        addListener(eventName: string, handler: Function): MapsEventListener;
      }

      class AutocompleteService {
        constructor();
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: AutocompletePrediction[], status: PlacesServiceStatus) => void
        ): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement | Map);
        findPlaceFromQuery(
          request: FindPlaceFromQueryRequest,
          callback: (results: PlaceResult[], status: PlacesServiceStatus) => void
        ): void;
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult, status: PlacesServiceStatus) => void
        ): void;
      }

      interface FindPlaceFromQueryRequest {
        fields: string[];
        query: string;
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }

      type PlacesServiceStatus =
        | 'OK'
        | 'ZERO_RESULTS'
        | 'OVER_QUERY_LIMIT'
        | 'REQUEST_DENIED'
        | 'INVALID_REQUEST'
        | 'UNKNOWN_ERROR'
        | 'NOT_FOUND';
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface MapsEventListener {
      remove(): void;
    }
  }
}