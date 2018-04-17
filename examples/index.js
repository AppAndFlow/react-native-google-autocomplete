import React from 'react';

import { GoogleAutoComplete } from '../dist';

class App extends React.Component {
  render() {
    return (
      <div>
        <GoogleAutoComplete apiKey="hello" debounce={300}>
          {({ inputValue, handleEventChange, locationResults }) => (
            <div>
              <input onChange={handleEventChange} value={inputValue} />

              <div>
                {locationResults.map((el, i) => (
                  <li key={String(i)}>{el.formatted_address}</li>
                ))}
              </div>
            </div>
          )}
        </GoogleAutoComplete>
      </div>
    );
  }
}
