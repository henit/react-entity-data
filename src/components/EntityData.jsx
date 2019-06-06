import _get from 'lodash/fp/get';
import React from 'react';
import PropTypes from 'prop-types';
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
      const { path } = this.props;
      const { loadedAt, loading, updating, pathChange, pathInitial, pathLoading, error, pathError } = this.context;
      const data = this.props.data || this.context.data;
      const value = this.props.value || (data && path) ? _get(path, data) : undefined;
      // const valueChanged = Boolean(path && pathChange[path] !== undefined);
      // const valueUpdating = Boolean(valueChanged && updating);
      // const valueUpdated = Boolean(path && !updating && !pathChange[path] && pathInitial[path]);

      // TODO check re-renders

      return (
        <Component
          { ...this.props }
          value={ value }
          // Path specific error when given, else give the error for the whole data set
          error={ path ? pathError[path] : error }
          onChange={ this.handleChange }
          onError={ this.handleError }
          loadedAt={ loadedAt }
          // changed={ valueChanged }
          changed={ path ? pathChange[path] !== undefined : false }
          // updating={ valueUpdating }
          loading={ path ? Boolean(pathLoading[path]) : loading }
          updating={ path ? Boolean(pathChange[path] !== undefined && updating) : updating }
          // updated={ valueUpdated }
          updated={ path ? Boolean(!updating && !pathChange[path] && pathInitial[path]) : false } />
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
    iterate: PropTypes.bool,
    iterateKey: PropTypes.func, // Function for getting element key in iterations
    saveState: PropTypes.number // Time (ms) after save for holding save state
  };

  static defaultProps = {

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

  getFromState(path, def = undefined) {
    return this.props.state ? (_get(path, this.props.state) || def) : (_get(`context.${path}`, this) || def);
  }

  recursiveStructure(recursivePath, wholePath) {
    // Recursive structures is entity state data that has path into the data as key (like pathChange).
    // When an EntityData has a path (indenting into the data structure), update the path based structures
    // so the inner component can receive both data and metadata as if the indented level where the whole
    // data set

    const { path } = this.props;
    const outer = this.getFromState(recursivePath, {});

    const inner = path ?
      Object.keys(outer)
        .filter(pathKey => pathKey.substring(0, path.length) === path && pathKey !== path)
        .reduce((inner, pathKey) => ({
          ...inner,
          [pathKey.substring(path.length + 1)]: outer[pathKey]
        }), {})
      :
      outer;

    if (wholePath === undefined) {
      return {
        [recursivePath]: inner
      };
    }

    return {
      [wholePath]: (outer && outer[path] !== undefined) ?
        outer[path]
        :
        this.getFromState(wholePath),
      [recursivePath]: inner
    };
  }

  render() {
    const {
      path,
      state,
      iterate,
      iterateKey,
      children
    } = this.props;

    // If state is given, merge local changes to get the current state of the data.
    // If no direct state/data is given use from outer context EntityData
    const sourceData = state ? EntityState.dataWithChanges(state) : this.props.data || _get('context.data', this);
    const data = path ? _get(path, sourceData) : sourceData;

    return (
      <EntityDataContext.Provider value={{
        data,
        loadedAt: state ? state.loadedAt : _get('context.loadedAt', this),
        ...this.recursiveStructure('pathError', 'error'),
        ...this.recursiveStructure('pathChange'),
        ...this.recursiveStructure('pathInitial'),
        ...this.recursiveStructure('pathLoading', 'loading'),
        ...this.recursiveStructure('pathUpdating', 'updating'),
        onChange: this.handleChange,
        onError: this.props.onError
      }}>
        { iterate && Array.isArray(data) ?
          data.map((element, index) =>
            <EntityData
              key={ iterateKey ? iterateKey(element) : index }
              path={ index.toString() }
              onChange={ this.props.onElementChange }
            >
              { typeof children === 'function' ? children(element, index) : children }
            </EntityData>
          )
          :
          (typeof children === 'function' ? children(data) : children)
        }
      </EntityDataContext.Provider>
    );
  }
}
