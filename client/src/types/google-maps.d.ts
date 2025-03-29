// Type definitions for Google Maps JavaScript API v3
// These are minimal type definitions focusing on the Places API

declare global {
  interface Window {
    google?: typeof google;
  }
  
  namespace google {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number, noWrap?: boolean);
        lat(): number;
        lng(): number;
      }
      
      class LatLngBounds {
        constructor(sw?: LatLng, ne?: LatLng);
        contains(latLng: LatLng): boolean;
        extend(point: LatLng): LatLngBounds;
        getCenter(): LatLng;
        getNorthEast(): LatLng;
        getSouthWest(): LatLng;
        isEmpty(): boolean;
        toJSON(): object;
        toString(): string;
      }
      
      namespace places {
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

        interface AutocompleteOptions {
          bounds?: LatLngBounds | undefined;
          componentRestrictions?: ComponentRestrictions | undefined;
          fields?: string[] | undefined;
          placeIdOnly?: boolean | undefined;
          strictBounds?: boolean | undefined;
          types?: string[] | undefined;
        }

        interface ComponentRestrictions {
          country: string | string[];
        }

        class Autocomplete {
          constructor(
            inputField: HTMLInputElement,
            opts?: AutocompleteOptions
          );
          
          getBounds(): LatLngBounds | undefined;
          getPlace(): PlaceResult;
          setBounds(bounds: LatLngBounds | null): void;
          setComponentRestrictions(restrictions: ComponentRestrictions | null): void;
          setFields(fields: string[] | null): void;
          setOptions(options: AutocompleteOptions): void;
          setTypes(types: string[] | null): void;
          
          addListener(eventName: string, handler: Function): MapsEventListener;
        }
      }

      class MapsEventListener {
        remove(): void;
      }
    }
  }
}

// This empty export is necessary to make this file a module
export {};