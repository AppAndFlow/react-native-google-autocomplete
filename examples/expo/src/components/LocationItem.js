import React, { PureComponent } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';

class LocationItem extends PureComponent {
  state = {};
  _handlePress = async () => {
    const res = await this.props.fetchDetails(this.props.place_id);

    Alert.alert('Result', res.result.formatted_address);
  };
  render() {
    return (
      <TouchableOpacity onPress={this._handlePress}>
        <Text>{this.props.description}</Text>
      </TouchableOpacity>
    );
  }
}

export default LocationItem;
