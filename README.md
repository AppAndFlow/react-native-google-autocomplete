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

## Usage

The `useGoogleAutocomplete` hook takes 2 arguments

| Arg    | Description                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| apiKey | [Your google places api key](https://developers.google.com/maps/documentation/places/web-service/overview) |
| config | optional config object                                                                                     |

# Config object

| Property        | Description                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| debounce        | optional - default 300                                                                                 |
| debounceOptions | optional - Configuration options for debounce behavior.                                                |
| language        | optional - default 'en'                                                                                |
| queryTypes      | optional - default address - https://developers.google.com/places/web-service/autocomplete#place_types |
| minLength       | optional - default 2 - this is the min length of the term search before start                          |
| components      | optional - A grouping of places to which you would like to restrict your results                       |
| radius          | optional - The distance (in meters) within which to return place results                               |
| lat             | optional - The latitude. If provided, lng is required                                                  |
| lng             | optional - The longitude. If provided, lat is required                                                 |
| strictBounds    | optional - Returns only places that are strictly within the region defined by location and radius.     |
| proxyUrl        | optional - This is required if you want to use the hook in a Web based platform. Since we dont use the Google SDK,  the http call will fail because of issues related to CORS unless a proxyUrl is provided                       |
| headers         | optional - Custom headers to include in the Google Places API requests. Useful for passing platform-specific API restrictions such as `X-Android-Package`, `X-Android-Cert`, or `X-Ios-Bundle-Identifier`. |

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
      language: 'en',
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

`locationResults` returns the following. The maximum result set by Google is 5 locations by query.

```js
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
```

When calling the searchDetails this is what you get

```js
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

If you want to restrict the search by country you can add this as a props `components="country:ca"`. This here would example restrict it to Canada only.
