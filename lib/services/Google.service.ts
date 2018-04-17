/// reference

import * as queryString from 'query-string';

const BASE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input';

export interface Query {
  language: string;
  key: string;
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
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
  types: string[];
  formatted_address: string;
}

export class GoogleService {
  public static async _search(
    term: string,
    query: Query,
  ): Promise<GoogleLocationResult[]> {
    const url = `${BASE_URL}=${encodeURIComponent(
      term,
    )}&${queryString.stringify(query)}`;

    const res = await fetch(url);
    const resjson = await res.json();

    return resjson;
  }
}
