import { useEffect, useRef, useState } from 'react';
import {
  GoogleService,
  type AutocompleteRequest,
  type GoogleLocationResult,
  type LocationBias,
  type LocationRestriction,
} from './services/google.service';
import { useDebounce } from 'use-debounce';
import { useIsMounted } from './useIsMounted';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Generate a RFC4122 v4 UUID. Uses crypto.randomUUID when available, otherwise
 * falls back to a Math.random based implementation so it works across all
 * React Native / Expo runtimes without extra native deps.
 */
function generateSessionToken(): string {
  const cryptoObj =
    typeof globalThis !== 'undefined'
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Parse a legacy `components` string (e.g. "country:nl|country:be") into
 * `includedRegionCodes` for Places API (New).
 */
function parseComponents(components?: string): string[] | undefined {
  if (!components) {
    return undefined;
  }

  const codes = Array.from(components.matchAll(/country:([a-zA-Z]{2,3})/g)).map(
    (m) => m[1]!.toLowerCase()
  );

  return codes.length ? codes : undefined;
}

/**
 * Map the legacy `queryTypes` value to `includedPrimaryTypes`. The legacy
 * default of `address` and the `geocode`/mixed values have no direct primary
 * type in the new API, so only `establishment` is mapped; anything else means
 * "no type filter" (return all place types).
 */
function mapQueryTypes(queryTypes?: string): string[] | undefined {
  if (!queryTypes) {
    return undefined;
  }
  if (queryTypes === 'establishment') {
    return ['establishment'];
  }
  return undefined;
}

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

  // --- Places API (New) options ----------------------------------------------

  /**
   * Language for the request, e.g. "en", "nl". Maps to `languageCode`.
   * Prefer this over the deprecated `language`.
   */
  languageCode?: string;

  /**
   * Region code (CLDR), used to format results, e.g. "nl".
   */
  regionCode?: string;

  /**
   * Restrict results to up to 15 country/region codes, e.g. ["nl", "be"].
   */
  includedRegionCodes?: string[];

  /**
   * Restrict results to the given place types, e.g. ["establishment"].
   * See https://developers.google.com/maps/documentation/places/web-service/place-types
   */
  includedPrimaryTypes?: string[];

  /**
   * Bias results toward an area (soft). Prefer this for venue search.
   */
  locationBias?: LocationBias;

  /**
   * Restrict results to an area (hard).
   */
  locationRestriction?: LocationRestriction;

  /**
   * Include query predictions in addition to place predictions.
   * Returned results carry `isQueryPrediction: true`.
   */
  includeQueryPredictions?: boolean;

  /**
   * Custom field mask for the autocomplete request.
   */
  autocompleteFieldMask?: string;

  /**
   * Custom field mask for the place details request. Required fields for your
   * use case must be included. Defaults to a broad set.
   */
  placeDetailsFieldMask?: string;

  /**
   * Provide your own session token. By default one is generated and rotated
   * after each `searchDetails` / `clearSearch` for session-based billing.
   * See https://developers.google.com/maps/documentation/places/web-service/place-session-tokens
   */
  sessionToken?: string;

  /**
   * The origin point from which to calculate straight-line distance to each
   * result (returned as `distance_meters`). If omitted, distance is not
   * returned.
   */
  origin?: {
    lat: number;
    lng: number;
  };

  // --- Legacy options (deprecated, mapped to the new API) --------------------

  /**
   * @deprecated Use `languageCode`. Language for Google query - default: en
   */
  language?: string;

  /**
   * @deprecated Use `includedRegionCodes`. A "country:xx" components string.
   */
  components?: string;

  /**
   * @deprecated Use `includedPrimaryTypes`. Only `establishment` maps cleanly;
   * other values are ignored (no type filter).
   */
  queryTypes?:
    | 'address'
    | 'geocode'
    | '(cities)'
    | 'establishment'
    | 'geocode|establishment';

  /**
   * @deprecated Use `locationBias` / `locationRestriction`. Radius in meters.
   */
  radius?: string | number;

  /**
   * @deprecated Use `locationBias` / `locationRestriction`. Latitude.
   */
  lat?: number;

  /**
   * @deprecated Use `locationBias` / `locationRestriction`. Longitude.
   */
  lng?: number;

  /**
   * @deprecated Use `locationRestriction`. When true the lat/lng/radius is
   * treated as a hard restriction instead of a bias.
   */
  strictBounds?: boolean;

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

/**
 * Build the location bias/restriction from either the new options or the legacy
 * lat/lng/radius/strictBounds options.
 */
function resolveLocation(opts: Options): {
  locationBias?: LocationBias;
  locationRestriction?: LocationRestriction;
} {
  if (opts.locationBias || opts.locationRestriction) {
    return {
      locationBias: opts.locationBias,
      locationRestriction: opts.locationRestriction,
    };
  }

  const { lat, lng, radius, strictBounds } = opts;

  if ((lat == null) !== (lng == null)) {
    throw new Error('Query: Location must have both lat & lng');
  }

  if (lat == null || lng == null) {
    return {};
  }

  const circle: LocationBias = {
    circle: {
      center: { latitude: lat, longitude: lng },
      radius: typeof radius === 'string' ? Number(radius) : radius ?? 50000,
    },
  };

  return strictBounds
    ? { locationRestriction: circle }
    : { locationBias: circle };
}

export const useGoogleAutocomplete = (apiKey: string, opts: Options = {}) => {
  const { minLength = 2, debounce = 300, debounceOptions = {} } = opts;
  const languageCode = opts.languageCode ?? opts.language;
  const includedRegionCodes =
    opts.includedRegionCodes ?? parseComponents(opts.components);
  const includedPrimaryTypes =
    opts.includedPrimaryTypes ?? mapQueryTypes(opts.queryTypes);

  const isMounted = useIsMounted();
  const [isSearching, setIsSearching] = useState(false);
  const [term, setTerm] = useState('');
  const [debouncedTerm] = useDebounce(term, debounce, debounceOptions);
  const [locationResults, setLocationResults] = useState<
    GoogleLocationResult[]
  >([]);
  const [searchError, setSearchError] = useState<Error | null>(null);

  const sessionTokenRef = useRef(opts.sessionToken ?? generateSessionToken());

  const search = async (value: string) => {
    if (isWeb && !opts.proxyUrl) {
      throw new Error('A proxy url is needed for web');
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const { locationBias, locationRestriction } = resolveLocation(opts);

      const request: AutocompleteRequest = {
        input: value,
        languageCode,
        regionCode: opts.regionCode,
        includedRegionCodes,
        includedPrimaryTypes,
        locationBias,
        locationRestriction,
        includeQueryPredictions: opts.includeQueryPredictions,
        sessionToken: sessionTokenRef.current,
        origin: opts.origin
          ? { latitude: opts.origin.lat, longitude: opts.origin.lng }
          : undefined,
      };

      const results = await GoogleService.search(request, {
        apiKey,
        fieldMask: opts.autocompleteFieldMask,
        proxyUrl: opts.proxyUrl,
        headers: opts.headers,
      });

      if (isMounted()) {
        setLocationResults(results);
      }
    } catch (error) {
      if (error instanceof Error && isMounted()) {
        setSearchError(error);
      }
    } finally {
      if (isMounted()) {
        setIsSearching(false);
      }
    }
  };

  const searchDetails = async (placeId: string) => {
    if (isWeb && !opts.proxyUrl) {
      throw new Error('A proxy url is needed for web');
    }

    const details = await GoogleService.searchDetails(placeId, {
      apiKey,
      fieldMask: opts.placeDetailsFieldMask,
      languageCode,
      regionCode: opts.regionCode,
      sessionToken: sessionTokenRef.current,
      proxyUrl: opts.proxyUrl,
      headers: opts.headers,
    });

    // Selecting a place ends the session; rotate the token for the next one.
    sessionTokenRef.current = opts.sessionToken ?? generateSessionToken();

    return details;
  };

  const clearSearch = () => {
    if (isMounted()) {
      setLocationResults([]);
      setIsSearching(false);
      sessionTokenRef.current = opts.sessionToken ?? generateSessionToken();
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
    sessionToken: sessionTokenRef.current,
  };
};
