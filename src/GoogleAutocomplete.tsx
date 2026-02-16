import { useEffect, useState } from 'react';
import {
  GoogleService,
  type GoogleLocationResult,
} from './services/google.service';
import { useDebounce } from 'use-debounce';
import { useIsMounted } from './useIsMounted';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

interface Options {
  /**
   * Minimun length of the input before start fetching - default: 2
   */
  minLength?: number;

  /**
   * Debounce request time in ms - default: 300
   */
  debounce?: number;

  /**
   * Debounce options
   */
  debounceOptions?: {
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
    equalityFn?: (left: any, right: any) => boolean;
  };

  /**
   * Language for Google query - default: en
   */
  language?: string;

  /**
   * A grouping of places to which you would like to restrict your results
   */
  components?: string;

  /**
   * See https://developers.google.com/places/web-service/autocomplete#place_types = default: address
   */
  queryTypes?:
    | 'address'
    | 'geocode'
    | '(cities)'
    | 'establishment'
    | 'geocode|establishment';

  /**
   * The distance (in meters) within which to return place results.
   * Note that setting a radius biases results to the indicated area,
   * but may not fully restrict results to the specified area.
   */
  radius?: string;

  /**
   * The latitude to retrieve place information
   */
  lat?: number;

  /**
   * The longitude to retrieve place information
   */
  lng?: number;

  /**
   * Enable strict mode to return search result only in the area defined by radius, lat and lng
   */
  strictBounds?: boolean;

  /**
   * The origin point from which to calculate straight-line distance to the destination (returned as distance_meters).
   * If omitted, straight-line distance will not be returned.
   */
  origin?: {
    lat: number;
    lng: number;
  };

  /**
   * Proxy url if you want to use the web, this is needed cause of CORS issue
   */
  proxyUrl?: string;

  /**
   * Custom headers to pass to the Google Places API fetch requests.
   * Useful for platform-specific headers like X-Android-Package, X-Android-Cert,
   * or X-Ios-Bundle-Identifier.
   */
  headers?: Record<string, string>;
}

export const useGoogleAutocomplete = (apiKey: string, opts: Options = {}) => {
  const {
    minLength = 2,
    debounce = 300,
    debounceOptions = {},
    language = 'en',
    queryTypes = 'address',
  } = opts;
  const isMounted = useIsMounted();
  const [isSearching, setIsSearching] = useState(false);
  const [term, setTerm] = useState('');
  const [debouncedTerm] = useDebounce(term, debounce, debounceOptions);
  const [locationResults, setLocationResults] = useState<
    GoogleLocationResult[]
  >([]);
  const [searchError, setSearchError] = useState<Error | null>(null);

  const search = async (value: string) => {
    if (isWeb && !opts.proxyUrl) {
      throw new Error('A proxy url is needed for web');
    }

    setIsSearching(true);
    try {
      const results = await GoogleService.search(
        value,
        {
          key: apiKey,
          language,
          types: queryTypes,
          strictBounds: opts.strictBounds,
          lat: opts.lat,
          lng: opts.lng,
          radius: opts.radius,
          components: opts.components,
          origin: opts.origin,
        },
        opts.proxyUrl,
        opts.headers
      );

      setLocationResults(results.predictions);
    } catch (error) {
      if (error instanceof Error) {
        setSearchError(error);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const searchDetails = async (placeId: string) => {
    if (isWeb && !opts.proxyUrl) {
      throw new Error('A proxy url is needed for web');
    }

    return GoogleService.searchDetails(
      placeId,
      {
        key: apiKey,
        language,
        types: queryTypes,
        components: opts.components,
      },
      opts.proxyUrl,
      opts.headers
    );
  };

  const clearSearch = () => {
    if (isMounted()) {
      setLocationResults([]);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (debouncedTerm.length >= minLength) {
      search(debouncedTerm);
    }

    if (debouncedTerm.length < minLength) {
      setLocationResults([]);
    }
  }, [debouncedTerm]);

  return {
    locationResults,
    isSearching,
    searchError,
    clearSearch,
    setTerm,
    term,
    searchDetails,
  };
};
