import * as React from 'react';

const initialState = {
  inputValue: '',
  locationResults: [],
};

const defaultProps = {
  minLength: 2,
};

type DefaultProps = typeof defaultProps;

type P = Partial<
  {
    children: RenderCallback;
    render: RenderCallback;
  } & DefaultProps
>;

type RenderCallback = (args: GoogleAutoCompleteProps) => JSX.Element;

type GoogleAutoCompleteProps = {
  inputValue: S['inputValue'];
  locationResults: S['locationResults'];
  handleChange: (value: string) => void;
};

type S = Readonly<typeof initialState>;

class GoogleAutoComplete extends React.PureComponent<P, S> {
  static defaultProps = {
    minLength: 2,
  };

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
      handleChange: this._handleChange,
    };

    if (this.props.render) {
      return this.props.render(renderProps);
    }

    return this.props.children(renderProps);
  }

  private _handleChange = (inputValue: string) => {
    this.setState({
      inputValue,
    });
  };
}
