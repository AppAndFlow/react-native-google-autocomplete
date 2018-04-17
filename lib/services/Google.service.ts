const BASE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=';

class GoogleService {
  _baseUrl: string;

  constructor() {
    this._baseUrl = BASE_URL;
  }
}

export default new GoogleService();
