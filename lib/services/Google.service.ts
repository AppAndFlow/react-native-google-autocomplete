import * as queryString from 'query-string';

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface Query {
  language: string;
  key: string;
  types: 'address' | 'geocode' | 'cities' | 'establishment' | 'geocode|establishment';
  components?: string;
  radius?: string;
  lat?: number;
  lng?: number;
}

export interface GoogleLocationDetailResult {
  adr_address: string;
  formatted_address: string;
  icon: string;
  id: string;
  name: string;
  place_id: string;
  scope: string;
  reference: string;
  url: string;
  utc_offset: number;
  vicinity: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
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
}

export interface GoogleLocationResult {
  description: string;
  id: string;
  matched_substrings: Array<{
    length: number;
    offset: number;
  }>;
  place_id: string;
  reference: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: Array<{
      length: number;
    }>;
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
  types: string[];
}

interface NormalizeQuery {
  language: string;
  key: string;
  types: 'address' | 'geocode' | 'cities' | 'establishment' | 'geocode|establishment';
  components?: string;
  radius?: string;
  location?: string;
}

const normalizeQuery = (query: Query): NormalizeQuery => {
  const { lat, lng, ...rest } = query;

  // The latitude/longitude around which to retrieve place information. This must be specified as latitude,longitude.
  let location;

  // If one of the value is provide lat/lng both must be there
  if ((lat && !lng) || (lng && !lat)) {
    throw new Error('Query: Location must have both lat & lng');
  }

  if (lat && lng) {
    location = `${lat},${lng}`;
  }

  return {
    ...rest,
    location,
  };
};

export class GoogleService {
  public static async _search(
    term: string,
    query: Query,
  ): Promise<{
    predictions: GoogleLocationResult[];
    status: string;
  }> {
    const url = `${BASE_URL}/autocomplete/json?&input=${encodeURIComponent(
      term,
    )}&${queryString.stringify(normalizeQuery(query))}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  }

  public static async _searchDetails(
    placeid: string,
    query: Query,
  ): Promise<GoogleLocationDetailResult> {
    const url = `${BASE_URL}/details/json?${queryString.stringify({
      ...normalizeQuery(query),
      placeid,
    })}`;

    const res = await fetch(url);

    const resJson: {
      status: string;
      result: GoogleLocationDetailResult;
    } = await res.json();

    if (!resJson.status) {
      throw new Error(res.statusText);
    }

    return Promise.resolve(resJson.result);
  }
}
