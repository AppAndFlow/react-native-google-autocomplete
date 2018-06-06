# React-Native-Google-Autocomplete

Using render props to make google autocomplete work nicely with any design.

## Installation

`yarn add react-native-google-autocomplete`


## Props


| Props  | Descriptions |
| ------------- | ------------- |
| apiKey  | Your api key get from https://developers.google.com/places/documentation  |
| debounce  | optional - default 300
| language | optional - default en |
| queryTypes | optional - default address - https://developers.google.com/places/web-service/autocomplete#place_types
| minLength | optional - default 2 - this is the min length of the term search before start
| components | optional - A grouping of places to which you would like to restrict your results.
| radius | optional - The distance (in meters) within which to return place results.


## Render Props


| Props  | Descriptions |
| ------------- | ------------- |
| inputValue  | A string you can put to your input for controlled input  |
| handleTextChange  | most important function this is the callback for the text change just put it inside your TextInput  |
| locationResults | The array result |
| fetchDetails | Http call when you have the place_id, good when you want to get more info after click an item
| isSearching | Boolean if search is on
| clearSearchs | Clear the search result, can be nice when you have a clear button next to your text input

## Results

The locationResults give you this

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

When call the fetchDetails this is what you got

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

## Examples

```js
import { GoogleAutoComplete } from 'react-native-google-autocomplete';

function MyComponent() {
  return (
    <GoogleAutoComplete apiKey="YOUR API KEY" debounce={300}>
      {({ inputValue, handleTextChange, locationResults, fetchDetails }) => (
        <React.Fragment>
          <TextInput
            style={{
              height: 40,
              width: 300,
              borderWidth: 1,
              paddingHorizontal: 16,
            }}
            value={inputValue}
            onChangeText={handleTextChange}
            placeholder="Location..."
          />
          <ScrollView style={{ maxHeight: 100 }}>
            {locationResults.map((el, i) => (
              <LocationItem
                {...el}
                fetchDetails={fetchDetails}
                key={String(i)}
              />
            ))}
          </ScrollView>
        </React.Fragment>
      )}
    </GoogleAutoComplete>
  );
}
```

## Typings

You can import both result typing if you need for flow or typescript.

```js
import { GoogleLocationDetailResult, GoogleLocationResult } from 'react-native-google-autocomplete';
```