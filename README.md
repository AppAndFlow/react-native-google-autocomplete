# React-Native-Google-Autocomplete

Using render props to make google automplete work nicely with any design.

## Installation

`yarn add react-native-google-autocomplete`

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
