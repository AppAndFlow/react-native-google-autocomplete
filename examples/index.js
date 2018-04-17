import React from 'react';

import { GoogleAutoComplete } from '../lib';

class App extends React.Component {
  render() {
    return (
      <div>
        <GoogleAutoComplete apiKey="hello" debounce={200}>
          {({ inputValue, handleEventChange, locationResults }) => (
            <div>
              <input onChange={handleEventChange} value={inputValue} />

              <div>
                {locationResults.map((el, i) => <li key={String(i)}>hello</li>)}
              </div>
            </div>
          )}
        </GoogleAutoComplete>
      </div>
    );
  }
}
