declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    contains(latLng: LatLng): boolean;
    equals(other: LatLngBounds | null): boolean;
    extend(point: LatLng): LatLngBounds;
    getCenter(): LatLng;
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
    intersects(other: LatLngBounds): boolean;
    isEmpty(): boolean;
    toJSON(): object;
    toSpan(): LatLng;
    toString(): string;
    union(other: LatLngBounds): LatLngBounds;
  }

  interface MapOptions {
    center?: LatLng | null;
    zoom?: number;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeId?: string;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    rotateControl?: boolean;
    fullscreenControl?: boolean;
    styles?: MapTypeStyle[];
    gestureHandling?: string;
  }

  interface MapTypeStyle {
    elementType?: string;
    featureType?: string;
    stylers: MapTypeStyler[];
  }

  interface MapTypeStyler {
    [key: string]: string | number | null;
  }

  namespace places {
    interface AutocompletePrediction {
      description: string;
      matched_substrings: Array<PredictionSubstring>;
      place_id: string;
      reference: string;
      structured_formatting: StructuredFormatting;
      terms: Array<PredictionTerm>;
      types: Array<string>;
    }

    interface PredictionTerm {
      offset: number;
      value: string;
    }

    interface PredictionSubstring {
      length: number;
      offset: number;
    }

    interface StructuredFormatting {
      main_text: string;
      main_text_matched_substrings: Array<PredictionSubstring>;
      secondary_text: string;
    }

    interface AutocompletionRequest {
      bounds?: LatLngBounds;
      componentRestrictions?: ComponentRestrictions;
      input: string;
      offset?: number;
      origin?: LatLng;
      sessionToken?: AutocompleteSessionToken;
      types?: Array<string>;
    }

    interface ComponentRestrictions {
      country: string | Array<string>;
    }

    class AutocompleteSessionToken {}

    class AutocompleteService {
      constructor();
      getPlacePredictions(
        request: AutocompletionRequest,
        callback: (predictions: Array<AutocompletePrediction> | null, status: PlacesServiceStatus) => void
      ): void;
    }

    interface PlaceResult {
      address_components?: GeocoderAddressComponent[];
      formatted_address?: string;
      geometry: {
        location: LatLng;
        viewport: LatLngBounds;
      };
      icon?: string;
      name?: string;
      place_id: string;
      types: string[];
      url?: string;
      utc_offset?: number;
      vicinity?: string;
    }

    interface AutocompleteOptions {
      bounds?: LatLngBounds;
      componentRestrictions?: ComponentRestrictions;
      fields?: string[];
      strictBounds?: boolean;
      types?: string[];
    }

    class Autocomplete {
      constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
      addListener(eventName: string, handler: Function): MapsEventListener;
      getBounds(): LatLngBounds;
      getPlace(): PlaceResult;
      setBounds(bounds: LatLngBounds): void;
      setComponentRestrictions(restrictions: ComponentRestrictions): void;
      setFields(fields: string[]): void;
      setOptions(options: AutocompleteOptions): void;
      setTypes(types: string[]): void;
    }

    type PlacesServiceStatus = string;
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

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};