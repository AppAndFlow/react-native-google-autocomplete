import * as React from 'react';

const initialState = {
  inputValue: '',
  locationResults: [],
};

const defaultProps = {
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
  language: 'en'
};

type DefaultProps = typeof defaultProps;

type P = Partial<
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

type RenderCallback = (args: GoogleAutoCompleteProps) => JSX.Element;

type GoogleAutoCompleteProps = {
  inputValue: S['inputValue'];
  locationResults: S['locationResults'];
  handleTextChange: (value: string) => void;
  handleEventChange: (e: InputEvent) => void;
};

type S = Readonly<typeof initialState>;

class GoogleAutoComplete extends React.PureComponent<P, S> {
  static readonly defaultProps: DefaultProps = defaultProps;

  /**
   * Keep track if the component isMounted or not
   */
  _isMounted: boolean;

  state = initialState;

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

    if (this.props.children) {
      return this.props.children!(renderProps);
    }

    throw new Error('Plz use the render props or at least provided a children');
  }

  /**
   * Handle the input change for react-native
   */
  private _handleTextChange = (inputValue: string) => {
    this.setState({
      inputValue,
    });
  };

  /**
   *
   * Handle the input change for react web
   */
  private _handleEventChange = (e: InputEvent) => {
    this.setState({
      inputValue: e.target.value,
    });
  };
}

export default GoogleAutoComplete;
