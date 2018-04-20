import { View, TextInput, Text } from 'react-native';
import React from 'react';
import { shallow, mount, render } from 'enzyme';

import { GoogleAutoComplete } from '../lib/GoogleAutocomplete';

describe('<GoogleAutoComplete />', () => {
  test('should render correctly', () => {
    const wrapper = shallow(
      <GoogleAutoComplete apiKey="myKey">
        {({ inputValue, handleTextChange }) => (
          <View>
            <TextInput value={inputValue} onChangeText={handleTextChange} />
          </View>
        )}
      </GoogleAutoComplete>,
    );

    expect(wrapper).toMatchSnapshot();
  });

  test('should return the value from onChangeText to inputValue', () => {
    const wrapper = shallow(
      <GoogleAutoComplete apiKey="myKey">
        {({ inputValue, handleTextChange }) => (
          <TextInput value={inputValue} onChangeText={handleTextChange} />
        )}
      </GoogleAutoComplete>,
    );

    wrapper.find('TextInput').simulate('changeText', '560 av');

    expect(wrapper.find('TextInput').prop('value')).toBe('560 av');
  });

  test('should have props pass and defaultProps', () => {
    const wrapper = mount(
      <GoogleAutoComplete apiKey="myKey">
        {({ inputValue, handleTextChange }) => (
          <View>
            <TextInput value={inputValue} onChangeText={handleTextChange} />
          </View>
        )}
      </GoogleAutoComplete>,
    );

    expect(wrapper.prop('language')).toBe('en');
    expect(wrapper.prop('apiKey')).toBe('myKey');
    expect(wrapper.prop('debounce')).toBe(300);
    expect(wrapper.prop('queryTypes')).toBe('address');
    expect(wrapper.prop('minLength')).toBe(2);
  });

  test('should have the state of the instance equal what the input change', () => {
    const wrapper = shallow(
      <GoogleAutoComplete apiKey="myKey">
        {({ inputValue, handleTextChange }) => (
          <View>
            <TextInput value={inputValue} onChangeText={handleTextChange} />
          </View>
        )}
      </GoogleAutoComplete>,
    );

    wrapper.find('TextInput').simulate('changeText', '560 av');

    const instance = wrapper.instance();

    expect(instance.state.inputValue).toBe('560 av');
  });
});
