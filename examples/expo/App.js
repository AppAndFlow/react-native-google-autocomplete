import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { GoogleAutoComplete } from 'react-native-google-autocomplete';

import LocationItem from './src/components/LocationItem';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <GoogleAutoComplete
          apiKey="YOUR API KEY"
          debounce={300}
        >
          {({
            inputValue,
            handleTextChange,
            locationResults,
            fetchDetails,
          }) => (
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
