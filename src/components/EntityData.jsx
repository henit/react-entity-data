import _get from 'lodash/fp/get';
import React from 'react';
import PropTypes from 'prop-types';
import EntityState from '../EntityState';

export const EntityDataContext = React.createContext({
  error: {}
});

export function withEntityData(Component) {

  const EntityDataComponent = class EntityDataComponent extends React.PureComponent {

    constructor(props) {
      super(props);

      this.handleChange = this.handleChange.bind(this);
      this.handleError = this.handleError.bind(this);
    }

    static contextType = EntityDataContext;
    static propTypes = {
      path: PropTypes.string,
      value: PropTypes.any,
      source: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
      ]),
      onChange: PropTypes.func,
      onError: PropTypes.func
    };

    handleChange(...args) {
      this.props.onChange && this.props.onChange(...args);
      this.context.onChange && this.context.onChange(this.props.path, ...args);
    }

    handleError(...args) {
      this.props.onError && this.props.onError(...args);
      this.context.onError && this.context.onError(this.props.path, ...args);
    }

    render() {
      return (
        <Component
          { ...this.props }
          value={
            // Provide the direct value if given, otherwese read from the entity data source
            this.props.value || ((this.props.source || this.context.source) && this.props.path) ?
              _get(this.props.path, this.props.source || this.context.source)
              :
              undefined
          }
          onChange={ this.handleChange }
          onError={ this.handleError } />
      );
    }

  };

  return EntityDataComponent;
}

export default class EntityData extends React.PureComponent {

  get data() {
    const { state, data } = this.props;

    if (!state) {
      // No full state available, return the data if given
      return data;
    }

    return EntityState.dataWithChanges(state);
  }

  render() {
    return (
      <EntityDataContext.Provider value={{
        source: this.data,
        onChange: this.props.onChange,
        onError: this.props.onError
      }}>
        { this.props.children }
      </EntityDataContext.Provider>
    );
  }
}

EntityData.propTypes = {
  state: PropTypes.object,
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),

  // How long to wayt (debounce) before running onUpdate when inputs are changed
  onChange: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.node
};

EntityData.defaultProps = {
  // updateDelay: 2500
};
