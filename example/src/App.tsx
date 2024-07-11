import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useGoogleAutocomplete } from '@appandflow/react-native-google-autocomplete';

const API_KEY = '';

const isWeb = Platform.OS === 'web';

export default function App() {
  const { setTerm, locationResults, isSearching } = useGoogleAutocomplete(
    API_KEY,
    {
      language: 'en',
      minLength: 3,
      proxyUrl: isWeb ? 'https://cors-anywhere.herokuapp.com/' : undefined,
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <TextInput
          placeholder="Search"
          onChangeText={setTerm}
          style={styles.input}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        {isSearching && locationResults.length === 0 && (
          <Text>Searching...</Text>
        )}
        {locationResults.map((location) => (
          <View key={location.id}>
            <Text>{location.structured_formatting.main_text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
    marginTop: 100,
    paddingHorizontal: 16,
  },
  box: {
    paddingHorizontal: 16,
    width: '100%',
  },
});
