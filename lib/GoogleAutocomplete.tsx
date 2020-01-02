import * as React from 'react';
import * as PropTypes from 'prop-types';
import { debounce } from 'lodash';

import {
  GoogleLocationResult,
  GoogleService,
  GoogleLocationDetailResult,
} from './services/Google.service';
import { isFunction } from './utils';

export const initialState = {
  inputValue: '',
  locationResults: [],
  isSearching: false,
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
  queryTypes:
    | 'address'
    | 'geocode'
    | 'cities'
    | 'establishment'
    | 'geocode|establishment';
}

export type P = Partial<
  {
    children: RenderCallback;
    render: RenderCallback;
    components: string;
    radius: string;
    lat: number;
    lng: number;
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
  fetchDetails: (placeId: string) => Promise<GoogleLocationDetailResult>;
  clearSearch: () => void;
  isSearching: boolean;
};

export type S = Readonly<{
  inputValue: string;
  locationResults: GoogleLocationResult[];
  isSearching: boolean;
}>;

export class GoogleAutoComplete extends React.PureComponent<P, S> {
  public static readonly defaultProps: DefaultProps = defaultProps;

  static propTypes = {
    /**
     * Minimun length before sending a search request default 2
     */
    minLength: PropTypes.number,
    /**
     * Time for debouncing the search default 300
     */
    debounce: PropTypes.number,
    /**
     * Your api key
     */
    apiKey: PropTypes.string.isRequired,
    /**
     * The language code, indicating in which language the results should be returned, if possible.
     * Searches are also biased to the selected language;
     * results in the selected language may be given a higher ranking.
     */
    language: PropTypes.string,
    /**
     * A grouping of places to which you would like to restrict your results
     */
    components: PropTypes.string,
    /**
     * The distance (in meters) within which to return place results.
     * Note that setting a radius biases results to the indicated area,
     * but may not fully restrict results to the specified area.
     */
    radius: PropTypes.string,

    /**
     * The latitude to retrieve place information
     */
    lat: PropTypes.number,

    /**
     * The longitude to retrieve place information
     */
    lng: PropTypes.number,
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
      this.setState({ isSearching: true });

      const searchOpts = {
        key: this.props.apiKey,
        language: this.props.language!,
        types: this.props.queryTypes!,
        components: this.props.components,
        radius: this.props.radius,
        lat: this.props.lat,
        lng: this.props.lng,
      };

      try {
        const results = await GoogleService._search(term, searchOpts);

        this.setState({
          locationResults: results.predictions,
          isSearching: false,
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
      isSearching: this.state.isSearching,
      clearSearch: this._clearSearch,
    };

    if (this.props.render) {
      return this.props.render(renderProps);
    }

    return isFunction(this.props.children)
      ? this.props.children(renderProps)
      : null;
  }

  private _clearSearch = () => {
    if (this._isMounted) {
      this.setState({
        locationResults: [],
        inputValue: '',
      });
    }
  };

  /**
   * Handle the input change for react-native
   */
  private _handleTextChange = (inputValue: string) => {
    if (this.props.apiKey == null) {
      throw new Error('Api Key is required');
    }

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
  ): Promise<GoogleLocationDetailResult> => {
    const searchOpts = {
      key: this.props.apiKey,
      language: this.props.language!,
      types: this.props.queryTypes!,
      components: this.props.components,
    };

    try {
      return GoogleService._searchDetails(placeId, searchOpts);
    } catch (error) {
      throw error;
    }
  };
}
