# React-Native-Google-Autocomplete

Using render props to make google automplete work nicely with any design.

## Installation

`yarn add react-native-google-autocomplete`

## Props


| Props  | Descriptions |
| ------------- | ------------- |
| inputValue  | A string you can put to your input for controlled input  |
| handleTextChange  | most important function this is the callback for the text change just put it inside your TextInput  |
| locationResults | The array result |
| fetchDetails | Http call when you have the place_id, good when you want to get more info after click an item

## Examples

Example in the examples folder

```js
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
