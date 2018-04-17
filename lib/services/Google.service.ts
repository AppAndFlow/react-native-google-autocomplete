const BASE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=';

type GoogleLocationResult = {
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
};

class GoogleService {
  _baseUrl: string;

  constructor() {
    this._baseUrl = BASE_URL;
  }
}

export default new GoogleService();
