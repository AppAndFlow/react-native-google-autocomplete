import { GoogleService } from '../services/google.service';

const mockFetch = (body: unknown, ok = true, status = 200) =>
  jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  });

describe('GoogleService.search (Places API New autocomplete)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts to the new autocomplete endpoint with api key and field mask', async () => {
    const fetchMock = mockFetch({ suggestions: [] });
    global.fetch = fetchMock as unknown as typeof fetch;

    await GoogleService.search(
      { input: 'arena', languageCode: 'nl' },
      { apiKey: 'KEY' }
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Goog-Api-Key']).toBe('KEY');
    expect(init.headers['X-Goog-FieldMask']).toContain(
      'suggestions.placePrediction'
    );
    expect(JSON.parse(init.body)).toMatchObject({
      input: 'arena',
      languageCode: 'nl',
    });
  });

  it('normalizes place predictions into the legacy result shape', async () => {
    global.fetch = mockFetch({
      suggestions: [
        {
          placePrediction: {
            placeId: 'abc123',
            text: { text: 'Johan Cruijff ArenA, Amsterdam' },
            structuredFormat: {
              mainText: {
                text: 'Johan Cruijff ArenA',
                matches: [{ endOffset: 5 }],
              },
              secondaryText: { text: 'Amsterdam, Netherlands' },
            },
            types: ['stadium', 'establishment'],
            distanceMeters: 1234,
          },
        },
      ],
    }) as unknown as typeof fetch;

    const results = await GoogleService.search(
      { input: 'johan' },
      { apiKey: 'KEY' }
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      place_id: 'abc123',
      description: 'Johan Cruijff ArenA, Amsterdam',
      structured_formatting: {
        main_text: 'Johan Cruijff ArenA',
        secondary_text: 'Amsterdam, Netherlands',
        main_text_matched_substrings: [{ offset: 0, length: 5 }],
      },
      types: ['stadium', 'establishment'],
      distance_meters: 1234,
      isQueryPrediction: false,
    });
  });

  it('flags query predictions', async () => {
    global.fetch = mockFetch({
      suggestions: [
        {
          queryPrediction: {
            text: { text: 'pizza near me' },
            structuredFormat: { mainText: { text: 'pizza near me' } },
          },
        },
      ],
    }) as unknown as typeof fetch;

    const results = await GoogleService.search(
      { input: 'pizza' },
      { apiKey: 'KEY' }
    );

    expect(results[0]!.isQueryPrediction).toBe(true);
    expect(results[0]!.place_id).toBe('');
  });

  it('throws the API error message on non-ok responses', async () => {
    global.fetch = mockFetch(
      { error: { message: 'API key not valid' } },
      false,
      403
    ) as unknown as typeof fetch;

    await expect(
      GoogleService.search({ input: 'x' }, { apiKey: 'BAD' })
    ).rejects.toThrow('API key not valid');
  });
});

describe('GoogleService.searchDetails (Places API New details)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GETs the place by id with a field mask and normalizes the result', async () => {
    const fetchMock = mockFetch({
      id: 'abc123',
      displayName: { text: 'Ziggo Dome' },
      formattedAddress: 'De Passage 100, Amsterdam',
      location: { latitude: 52.3138, longitude: 4.9377 },
      types: ['stadium'],
      primaryType: 'stadium',
      googleMapsUri: 'https://maps.google.com/?cid=1',
      websiteUri: 'https://www.ziggodome.nl/',
      addressComponents: [
        { longText: 'Amsterdam', shortText: 'AMS', types: ['locality'] },
      ],
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const details = await GoogleService.searchDetails('abc123', {
      apiKey: 'KEY',
      sessionToken: 'tok',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('https://places.googleapis.com/v1/places/abc123');
    expect(url).toContain('sessionToken=tok');
    expect(init.method).toBe('GET');
    expect(init.headers['X-Goog-FieldMask']).toBeDefined();

    expect(details).toMatchObject({
      place_id: 'abc123',
      name: 'Ziggo Dome',
      formatted_address: 'De Passage 100, Amsterdam',
      website: 'https://www.ziggodome.nl/',
      url: 'https://maps.google.com/?cid=1',
      geometry: { location: { lat: 52.3138, lng: 4.9377 } },
      address_components: [
        { long_name: 'Amsterdam', short_name: 'AMS', types: ['locality'] },
      ],
    });
  });
});
