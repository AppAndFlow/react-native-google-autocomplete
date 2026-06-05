![google_autocomplete](https://github.com/user-attachments/assets/b9d85da5-b833-4e40-a6d7-36380e049ba0)

### About
App & Flow is a Montreal-based React Native engineering and consulting studio. We partner with the world’s top companies and are recommended by [Expo](https://expo.dev/consultants). Need a hand? Let’s build together. team@appandflow.com

## Installation

```sh
yarn add @appandflow/react-native-google-autocomplete
```

```sh
npm i @appandflow/react-native-google-autocomplete
```

> **Uses Places API (New).** This library calls the new
> [`places.googleapis.com/v1`](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
> Autocomplete and Place Details endpoints. You must enable **Places API (New)**
> in your Google Cloud project — the legacy "Places API" is not enough.

## Usage

The `useGoogleAutocomplete` hook takes 2 arguments

| Arg    | Description                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| apiKey | [Your google places api key](https://developers.google.com/maps/documentation/places/web-service/overview) |
| config | optional config object                                                                                     |

# Config object

| Property              | Description                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| debounce              | optional - default 300                                                                                       |
| debounceOptions       | optional - Configuration options for debounce behavior.                                                      |
| minLength             | optional - default 2 - min length of the term before search starts                                          |
| languageCode          | optional - default 'en' - request language, e.g. `'nl'`                                                      |
| regionCode            | optional - CLDR region code used to format results, e.g. `'nl'`                                              |
| includedRegionCodes   | optional - restrict results to up to 15 country codes, e.g. `['nl', 'be']`                                   |
| includedPrimaryTypes  | optional - restrict to [place types](https://developers.google.com/maps/documentation/places/web-service/place-types), e.g. `['establishment']` for venues/POIs |
| locationBias          | optional - bias results toward an area (soft). `{ circle: { center: { latitude, longitude }, radius } }`     |
| locationRestriction   | optional - restrict results to an area (hard). Same shape as `locationBias`                                  |
| includeQueryPredictions | optional - also return query predictions (carry `isQueryPrediction: true`)                                |
| origin                | optional - `{ lat, lng }` from which to calculate straight-line distance (returned as `distance_meters`)     |
| sessionToken          | optional - provide your own [session token](https://developers.google.com/maps/documentation/places/web-service/place-session-tokens). By default one is generated and rotated after each `searchDetails`/`clearSearch` |
| autocompleteFieldMask | optional - override the `X-Goog-FieldMask` for autocomplete requests                                         |
| placeDetailsFieldMask | optional - override the `X-Goog-FieldMask` for place details requests                                        |
| proxyUrl              | optional - required for Web platforms to avoid CORS issues                                                   |
| headers               | optional - Custom headers, e.g. `X-Android-Package`, `X-Android-Cert`, `X-Ios-Bundle-Identifier`            |

### Deprecated (legacy) options

These still work and are mapped to the new API, but prefer the options above:

| Legacy             | Maps to                                  |
| ------------------ | ---------------------------------------- |
| `language`         | `languageCode`                           |
| `components`       | `includedRegionCodes` (parses `country:xx`) |
| `queryTypes`       | `includedPrimaryTypes` (only `establishment` maps; other values = no type filter) |
| `lat` / `lng` / `radius` | `locationBias.circle`              |
| `strictBounds`     | turns the lat/lng/radius into `locationRestriction` |

> **Looking up venues** like _Johan Cruijff ArenA_, _Ziggo Dome_ or _Ahoy_?
> Set `includedPrimaryTypes: ['establishment']` (optionally with
> `includedRegionCodes: ['nl']`).

# Exposed properties

| Property        | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| clearSearch     | Clears your current search                                                 |
| isSearching     | Boolean that lets you know the search is underway                          |
| locationResults | The array of results of the search                                         |
| searchDetails   | Function that lets you get more details, good for when you select a result |
| searchError     | Errors that could occur during search                                      |
| term/setTerm    | The term is the search term used, it's set using setTerm                   |

# Code example

This is a minimalistic functionnal snippet that returns 3 results for your search.
Clicking on a result logs the details of that result.

```ts
  const { locationResults, setTerm, clearSearch, searchDetails, term } =
    useGoogleAutocomplete(API_KEY, {
      languageCode: 'en',
      includedPrimaryTypes: ['establishment'],
      debounce: 300,
    });

  return (
    <View>
      <TextInput
        value={term}
        onChangeText={setTerm}
      />
      {locationResults.slice(0, 3).map((el, i) => (
        <TouchableOpacity
          key={String(i)}
          onPress={async () => {
            const details = await searchDetails(el.place_id);
            console.log(JSON.stringify(details, null, 2));
          }}
        >
          <Text>{el.structured_formatting.main_text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
```

## Results

`locationResults` returns the following. The new-API prediction is normalized to
the field names below (backward compatible with previous versions); the raw
prediction is available on `_raw`.

```ts
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
  distance_meters?: number; // Present when origin parameter is provided
  isQueryPrediction?: boolean; // true for query predictions
  _raw: object; // raw Places API (New) prediction
}
```

When calling `searchDetails` this is what you get. Place Details (New) requires a
field mask — override `placeDetailsFieldMask` to request more/fewer fields.

```ts
export interface GoogleLocationDetailResult {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string;
  adr_address: string;
  vicinity: string;
  url: string; // googleMapsUri
  website: string; // websiteUri
  utc_offset: number; // utcOffsetMinutes
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
  _raw: object; // raw Places API (New) place
}
```

## Typings

You can import both result typing if you need for flow or typescript.

```js
import {
  GoogleLocationDetailResult,
  GoogleLocationResult,
} from 'react-native-google-autocomplete';
```

## Custom Headers

You can pass custom headers to the underlying Google Places API requests. This is useful for [application restrictions](https://developers.google.com/maps/api-security-best-practices#application-restriction) such as Android app or iOS bundle restrictions.

```ts
// Android
const { locationResults, setTerm } = useGoogleAutocomplete(API_KEY, {
  headers: {
    'X-Android-Package': 'com.example.app',
    'X-Android-Cert': 'your-signing-certificate-fingerprint',
  },
});

// iOS
const { locationResults, setTerm } = useGoogleAutocomplete(API_KEY, {
  headers: {
    'X-Ios-Bundle-Identifier': 'com.example.app',
  },
});
```

## Restrict by country

Pass `includedRegionCodes` with up to 15 CLDR country codes:

```ts
useGoogleAutocomplete(API_KEY, {
  includedRegionCodes: ['ca'], // Canada only
});
```

## Bias / restrict by location

```ts
useGoogleAutocomplete(API_KEY, {
  // soft bias around Amsterdam (50km)
  locationBias: {
    circle: {
      center: { latitude: 52.3676, longitude: 4.9041 },
      radius: 50000,
    },
  },
  // or a hard restriction with `locationRestriction` (same shape)
});
```
