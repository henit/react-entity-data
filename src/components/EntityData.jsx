import _get from 'lodash/fp/get';
import React from 'react';
import PropTypes from 'prop-types';
// import EntityState from '../EntityState';
import { EntityState } from 'entity-state';

export const EntityDataContext = React.createContext({
  error: {}
});

/**
 * Connect a component with EntityData
 * @param {object} Component React component
 * @return {function} Render component
 */
export function withEntityData(Component) {

  /*
   * Higher-order component for a component that is using entity data
   */
  class EntityDataComponent extends React.PureComponent {

    static contextType = EntityDataContext;

    static propTypes = {
      path: PropTypes.string,
      value: PropTypes.any,
      data: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
      ]),
      onChange: PropTypes.func,
      onError: PropTypes.func
    };

    // Event handlers. Trigger direct event props on the component,
    // and EntityData event props with the input path

    handleChange = (value) => {
      this.props.onChange && this.props.onChange(value);
      this.context.onChange && this.context.onChange(this.props.path, value, this.context.data);
    };

    handleError = (error) => {
      this.props.onError && this.props.onError(error);
      this.context.onError && this.context.onError(this.props.path, error, this.context.data);
    };

    render() {
      // Provide the direct value if given, otherwese read from the entity data source
      const path = this.props.path;
      const data = this.props.data || this.context.data;
      const value = this.props.value || (data && path) ? _get(path, data) : undefined;

      return (
        <Component
          { ...this.props }
          value={ value }
          onChange={ this.handleChange }
          onError={ this.handleError } />
      );
    }

  }

  const name = Component.displayName || Component.name || 'Component';
  EntityDataComponent.displayName = `EntityData${name}`;

  return EntityDataComponent;
}


export default class EntityData extends React.PureComponent {

  // For nesting contexts
  static contextType = EntityDataContext;

  static propTypes = {
    state: PropTypes.object,
    data: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array
    ]),

    // How long to wayt (debounce) before running onUpdate when inputs are changed
    onChange: PropTypes.func,
    onElementChange: PropTypes.func,
    onError: PropTypes.func,
    onElementError: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func
    ]),

    path: PropTypes.string,
    iterate: PropTypes.bool
  };

  handleChange = (path, value, data) => {
    // Direct onChange on this instance. Use the inner path regardless of outer EntityData components
    this.props.onChange && this.props.onChange(path, value, data);

    if (this.props.state || this.props.data) {
      // When this instance has state/data via direct props, consider it a "base" instance for
      // the given data, regardless of parent components. Ignore any context received from parents.
      return;
    }

    // Bubble the event up the EntityData-tree
    const fullPath = [this.context.path, this.props.path, path].filter(Boolean).join('.');

    this.context.onChange && this.context.onChange(fullPath, value, this.context.data);

  };

  render() {
    const {
      path,
      state,
      data,
      children
    } = this.props;

    // If state is given, merge local changes to get the current state of the data.
    // If no direct state/data is given use from outer context EntityData
    const sourceData = state ? EntityState.dataWithChanges(state) : data || _get('context.data', this);
    const innerData = path ? _get(path, sourceData) : sourceData;

    return (
      <EntityDataContext.Provider value={{
        data: innerData,
        onChange: this.handleChange,
        onError: this.props.onError
      }}>
        { this.props.iterate && Array.isArray(innerData) ?
          innerData.map((element, index) =>
            <EntityData
              key={ index }
              path={ index.toString() }
              onChange={ this.props.onElementChange }
            >
              { typeof children === 'function' ? children(element, index) : children }
            </EntityData>
          )
          :
          (typeof children === 'function' ? children(innerData) : children)
        }
      </EntityDataContext.Provider>
    );
  }
}
