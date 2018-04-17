import * as React from 'react';

const initialState = {
  inputValue: '',
};

type P = Partial<{
  children: RenderCallback;
  render: RenderCallback;
}>;

type RenderCallback = (args: GoogleAutoCompleteProps) => JSX.Element;

type GoogleAutoCompleteProps = { inputValue: S['inputValue'] };

type S = Readonly<typeof initialState>;

class GoogleAutoComplete extends React.PureComponent<P, S> {
  _isMounted: boolean;

  state = {
    inputValue: '',
  };

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const renderProps = { inputValue: this.state.inputValue };

    if (this.props.render) {
      return this.props.render(renderProps);
    }

    return this.props.children(renderProps);
  }
}
