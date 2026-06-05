const BASE_URL = 'https://places.googleapis.com/v1';

/**
 * A circular geographic area used for locationBias / locationRestriction.
 * See https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 */
export interface Circle {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

export interface LocationBias {
  circle?: Circle;
  rectangle?: {
    low: { latitude: number; longitude: number };
    high: { latitude: number; longitude: number };
  };
}

export type LocationRestriction = LocationBias;

/**
 * Request body for the Places API (New) Autocomplete endpoint.
 * https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 */
export interface AutocompleteRequest {
  input: string;
  languageCode?: string;
  regionCode?: string;
  includedRegionCodes?: string[];
  includedPrimaryTypes?: string[];
  locationBias?: LocationBias;
  locationRestriction?: LocationRestriction;
  origin?: {
    latitude: number;
    longitude: number;
  };
  includeQueryPredictions?: boolean;
  sessionToken?: string;
  inputOffset?: number;
}

/**
 * Default field mask for the autocomplete request. Field masks are optional for
 * Autocomplete (New) but limit the response to the fields we normalize below.
 */
export const DEFAULT_AUTOCOMPLETE_FIELD_MASK = [
  'suggestions.placePrediction.placeId',
  'suggestions.placePrediction.text',
  'suggestions.placePrediction.structuredFormat',
  'suggestions.placePrediction.types',
  'suggestions.placePrediction.distanceMeters',
  'suggestions.queryPrediction.text',
  'suggestions.queryPrediction.structuredFormat',
].join(',');

/**
 * Default field mask for the place details request. Field masks are REQUIRED for
 * Place Details (New); omitting them returns an error.
 */
export const DEFAULT_PLACE_DETAILS_FIELD_MASK = [
  'id',
  'name',
  'displayName',
  'formattedAddress',
  'adrFormatAddress',
  'shortFormattedAddress',
  'location',
  'viewport',
  'types',
  'primaryType',
  'googleMapsUri',
  'websiteUri',
  'addressComponents',
  'utcOffsetMinutes',
].join(',');

// --- Raw shapes returned by Places API (New) ----------------------------------

interface RawText {
  text: string;
  matches?: Array<{ startOffset?: number; endOffset: number }>;
}

interface RawStructuredFormat {
  mainText?: RawText;
  secondaryText?: RawText;
}

interface RawPlacePrediction {
  placeId: string;
  text?: RawText;
  structuredFormat?: RawStructuredFormat;
  types?: string[];
  distanceMeters?: number;
}

interface RawQueryPrediction {
  text?: RawText;
  structuredFormat?: RawStructuredFormat;
}

interface RawSuggestion {
  placePrediction?: RawPlacePrediction;
  queryPrediction?: RawQueryPrediction;
}

interface RawAutocompleteResponse {
  suggestions?: RawSuggestion[];
}

interface RawPlaceDetails {
  id: string;
  name?: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  adrFormatAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  viewport?: {
    low: { latitude: number; longitude: number };
    high: { latitude: number; longitude: number };
  };
  types?: string[];
  primaryType?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  utcOffsetMinutes?: number;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

// --- Normalized shapes (kept backward compatible) -----------------------------

/**
 * Normalized autocomplete prediction. Field names mirror the legacy library so
 * existing consumers keep working, with the raw new-API prediction attached on
 * `_raw` for access to anything not normalized.
 */
export interface GoogleLocationResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: Array<{
      length: number;
      offset?: number;
    }>;
  };
  types: string[];
  distance_meters?: number;
  /** True when this is a query prediction rather than a place prediction. */
  isQueryPrediction?: boolean;
  _raw: RawPlacePrediction | RawQueryPrediction;
}

/**
 * Normalized place details. Field names mirror the legacy library, with the raw
 * new-API place attached on `_raw`.
 */
export interface GoogleLocationDetailResult {
  id: string;
  name: string;
  place_id: string;
  formatted_address: string;
  adr_address: string;
  vicinity: string;
  url: string;
  website: string;
  utc_offset: number;
  types: string[];
  primary_type?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      [type: string]: {
        lat: number;
        lng: number;
      };
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  _raw: RawPlaceDetails;
}

function normalizeMatches(
  text?: RawText
): Array<{ length: number; offset?: number }> {
  if (!text?.matches) {
    return [];
  }

  return text.matches.map((m) => ({
    offset: m.startOffset ?? 0,
    length: m.endOffset - (m.startOffset ?? 0),
  }));
}

function normalizePrediction(
  prediction: RawPlacePrediction | RawQueryPrediction,
  isQueryPrediction: boolean
): GoogleLocationResult {
  const placeId = (prediction as RawPlacePrediction).placeId ?? '';
  const structured = prediction.structuredFormat;

  return {
    place_id: placeId,
    description: prediction.text?.text ?? '',
    structured_formatting: {
      main_text: structured?.mainText?.text ?? prediction.text?.text ?? '',
      secondary_text: structured?.secondaryText?.text ?? '',
      main_text_matched_substrings: normalizeMatches(structured?.mainText),
    },
    types: (prediction as RawPlacePrediction).types ?? [],
    distance_meters: (prediction as RawPlacePrediction).distanceMeters,
    isQueryPrediction,
    _raw: prediction,
  };
}

function normalizeDetails(place: RawPlaceDetails): GoogleLocationDetailResult {
  return {
    id: place.id,
    place_id: place.id,
    name: place.displayName?.text ?? place.name ?? '',
    formatted_address: place.formattedAddress ?? '',
    adr_address: place.adrFormatAddress ?? '',
    vicinity: place.shortFormattedAddress ?? '',
    url: place.googleMapsUri ?? '',
    website: place.websiteUri ?? '',
    utc_offset: place.utcOffsetMinutes ?? 0,
    types: place.types ?? [],
    primary_type: place.primaryType,
    geometry: {
      location: {
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
      },
      viewport: place.viewport
        ? {
            northeast: {
              lat: place.viewport.high.latitude,
              lng: place.viewport.high.longitude,
            },
            southwest: {
              lat: place.viewport.low.latitude,
              lng: place.viewport.low.longitude,
            },
          }
        : undefined,
    },
    address_components: (place.addressComponents ?? []).map((c) => ({
      long_name: c.longText,
      short_name: c.shortText,
      types: c.types,
    })),
    _raw: place,
  };
}

async function parseError(res: Response): Promise<Error> {
  let message = res.statusText;
  try {
    const body = await res.json();
    message = body?.error?.message ?? JSON.stringify(body) ?? message;
  } catch {
    // ignore body parse failure, fall back to statusText
  }
  return new Error(message || `Request failed with status ${res.status}`);
}

export class GoogleService {
  /**
   * Autocomplete using Places API (New) - POST /v1/places:autocomplete.
   */
  public static async search(
    request: AutocompleteRequest,
    options: {
      apiKey: string;
      fieldMask?: string;
      proxyUrl?: string;
      headers?: Record<string, string>;
    }
  ): Promise<GoogleLocationResult[]> {
    const url = `${options.proxyUrl ?? ''}${BASE_URL}/places:autocomplete`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': options.apiKey,
        'X-Goog-FieldMask':
          options.fieldMask ?? DEFAULT_AUTOCOMPLETE_FIELD_MASK,
        ...options.headers,
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw await parseError(res);
    }

    const json: RawAutocompleteResponse = await res.json();
    const suggestions = json.suggestions ?? [];

    return suggestions
      .map((s) => {
        if (s.placePrediction) {
          return normalizePrediction(s.placePrediction, false);
        }
        if (s.queryPrediction) {
          return normalizePrediction(s.queryPrediction, true);
        }
        return null;
      })
      .filter((r): r is GoogleLocationResult => r !== null);
  }

  /**
   * Place details using Places API (New) - GET /v1/places/{placeId}.
   */
  public static async searchDetails(
    placeId: string,
    options: {
      apiKey: string;
      fieldMask?: string;
      languageCode?: string;
      regionCode?: string;
      sessionToken?: string;
      proxyUrl?: string;
      headers?: Record<string, string>;
    }
  ): Promise<GoogleLocationDetailResult> {
    const params = new URLSearchParams();
    if (options.languageCode) {
      params.set('languageCode', options.languageCode);
    }
    if (options.regionCode) {
      params.set('regionCode', options.regionCode);
    }
    if (options.sessionToken) {
      params.set('sessionToken', options.sessionToken);
    }

    const query = params.toString();
    const url = `${options.proxyUrl ?? ''}${BASE_URL}/places/${encodeURIComponent(
      placeId
    )}${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': options.apiKey,
        'X-Goog-FieldMask':
          options.fieldMask ?? DEFAULT_PLACE_DETAILS_FIELD_MASK,
        ...options.headers,
      },
    });

    if (!res.ok) {
      throw await parseError(res);
    }

    const place: RawPlaceDetails = await res.json();

    return normalizeDetails(place);
  }
}
