import * as React from 'react';
import * as PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import { GoogleLocationResult, GoogleService } from './services/Google.service';
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
};

export interface DefaultProps {
  minLength: number;
  debounce: number;
  language: string;
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
};

export type S = Readonly<{
  inputValue: string;
  locationResults: GoogleLocationResult[];
}>;

export class GoogleAutoComplete extends React.PureComponent<P, S> {
  public static readonly defaultProps: DefaultProps = defaultProps;

  static propTypes = {
    minLength: PropTypes.string,
    debounce: PropTypes.number,
    apiKey: PropTypes.string.isRequired,
    language: PropTypes.string,
  };

  readonly state: S = initialState;

  /**
   * Keep track if the component isMounted or not
   */
  private _isMounted: boolean;

  private _search = debounce(async (term: string) => {
    if (this._isMounted) {
      const searchOpts = {
        key: this.props.apiKey,
        language: this.props.language || '',
      };

      try {
        const results = await GoogleService._search(term, searchOpts);

        this.setState({
          locationResults: results,
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

    this._search(inputValue);
  };

  /**
   *
   * Handle the input change for react web
   */
  private _handleEventChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    this.setState({
      inputValue: value,
    });

    this._search(value);
  };
}
