import * as React from 'react';
import * as PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import {
  GoogleLocationResult,
  GoogleService,
  GoogleLocationDetailResult,
} from './services/Google.service';
import { isFunction } from './utils';

export const initialState = {
  inputValue: '',
  locationResults: [],
};

const defaultProps: DefaultProps = {
  /**
   * Minimun length of the input before start fetching - default: 2
   */
  minLength: 2,
  /**
   * Debounce request time in ms - default: 300
   */
  debounce: 300,
  /**
   * Language for Google query - default: en
   */
  language: 'en',

  /**
   * See https://developers.google.com/places/web-service/autocomplete#place_types = default: address
   */
  queryTypes: 'address',
};

export interface DefaultProps {
  minLength: number;
  debounce: number;
  language: string;
  queryTypes: string;
}

export type P = Partial<
  {
    children: RenderCallback;
    render: RenderCallback;
  } & DefaultProps
> & {
  /**
   * Api Key provided by google
   */
  apiKey: string;
};

export type RenderCallback = (args: GoogleAutoCompleteProps) => JSX.Element;

export type GoogleAutoCompleteProps = {
  inputValue: S['inputValue'];
  locationResults: S['locationResults'];
  handleTextChange: (value: string) => void;
  handleEventChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchDetails: (placeId: string) => void;
};

export type S = Readonly<{
  inputValue: string;
  locationResults: GoogleLocationResult[];
}>;

export class GoogleAutoComplete extends React.PureComponent<P, S> {
  public static readonly defaultProps: DefaultProps = defaultProps;

  static propTypes = {
    minLength: PropTypes.number,
    debounce: PropTypes.number,
    apiKey: PropTypes.string.isRequired,
    language: PropTypes.string,
  };

  readonly state: S = initialState;

  /**
   * Keep track if the component isMounted or not
   */
  private _isMounted: boolean;

  /**
   * Search to google automplete service
   */
  private _search = debounce(async (term: string) => {
    if (this._isMounted) {
      const searchOpts = {
        key: this.props.apiKey,
        language: this.props.language!,
        types: this.props.queryTypes!,
      };

      try {
        const results = await GoogleService._search(term, searchOpts);

        this.setState({
          locationResults: results.predictions,
        });
      } catch (error) {
        throw error;
      }
    }
  }, this.props.debounce);

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const renderProps = {
      inputValue: this.state.inputValue,
      locationResults: this.state.locationResults,
      handleTextChange: this._handleTextChange,
      handleEventChange: this._handleEventChange,
      fetchDetails: this._searchDetails,
    };

    if (this.props.render) {
      return this.props.render(renderProps);
    }

    return isFunction(this.props.children)
      ? this.props.children(renderProps)
      : null;
  }

  /**
   * Handle the input change for react-native
   */
  private _handleTextChange = (inputValue: string) => {
    this.setState({
      inputValue,
    });

    if (inputValue.length >= this.props.minLength!) {
      this._search(inputValue);
    }
  };

  /**
   * Handle the input change for react web
   */
  private _handleEventChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    this.setState({
      inputValue: value,
    });

    if (value.length >= this.props.minLength!) {
      this._search(value);
    }
  };

  /**
   * Handle the search details when provide the place_id
   */
  private _searchDetails = async (
    placeId: string,
  ): Promise<GoogleLocationDetailResult | null> => {
    if (this._isMounted) {
      const searchOpts = {
        key: this.props.apiKey,
        language: this.props.language!,
        types: this.props.queryTypes!,
      };

      try {
        return GoogleService._searchDetails(placeId, searchOpts);
      } catch (error) {
        throw error;
      }
    }

    return null;
  };
}
