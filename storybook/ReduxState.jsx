import React from 'react';
import PropTypes from 'prop-types';
// import { createStore } from 'redux';

class ReduxStoreProvider extends React.Component {

  // constructor(props) {
  //   super(props);

  //   this._reduxStore = createStore(props.reducer);
  // }

  componentDidMount() {
    this.props.store.subscribe(() => {
      this.forceUpdate();
    });
  }

  render() {
    const { store, children } = this.props;

    if ((typeof children) === 'function') {
      return children(store.getState(), store.dispatch) || null;
    }

    return children || null;
  }

}

ReduxStoreProvider.propTypes = {
  store: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ])
};

export const withReduxStore = (store, story) => () => { // eslint-disable-line react/display-name
  return (
    <ReduxStoreProvider store={ store }>
      { (state, dispatch) => story(state, dispatch) }
    </ReduxStoreProvider>
  );
};

export const DebugReduxState = ({ state }) => (
  <pre>
    <code>
      { JSON.stringify(state, null, 4) }
    </code>
  </pre>
);

DebugReduxState.propTypes = {
  state: PropTypes.object
};
