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
          changed={ path ? pathChange[path] !== undefined : false }
          loading={ path ? Boolean(pathLoading[path]) : loading }
          updating={ path ? Boolean(pathChange[path] !== undefined && updating) : updating }
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
    onMode: PropTypes.func,
    onElementMode: PropTypes.func,
    onSubmit: PropTypes.func,
    onElementSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    onElementCancel: PropTypes.func,
    onDelete: PropTypes.func,
    onElementDelete: PropTypes.func,
    onError: PropTypes.func,
    onElementError: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func
    ]),

    path: PropTypes.string,
    iterate: PropTypes.bool,
    iterateKey: PropTypes.func // Function for getting element key in iterations
  };

  static defaultProps = {

  };

  state = {
    editing: false
  };

  get base() {
    // If there is state/data given to the component as props, consider it a base component and skip
    // bubbling of events to possible parent EntityData components.
    return this.props.state || this.props.data;
  }

  get data() {
    const { state, path } = this.props;
    // If state is given, merge local changes to get the current state of the data.
    // If no direct state/data is given use from outer context EntityData
    const sourceData = state ? EntityState.dataWithChanges(state) : this.props.data || _get('context.data', this);
    return path ? _get(path, sourceData) : sourceData;
  }

  toggleEditing = () => {
    this.setState({
      editing: !this.state.editing
    });
  };

  bubbleEvent = (event, subPath, ...args) => {
    const { onMode, onSubmit, onCancel, onDelete } = this.props;

    // Call the event-prop of the EntityData implementation if given
    switch (event) {
      case 'mode': onMode && onMode(subPath, this.data, ...args); break;
      case 'submit': onSubmit && onSubmit(subPath, this.data, ...args); break;
      case 'cancel': onCancel && onCancel(subPath, this.data, ...args); break;
      case 'delete': onDelete && onDelete(subPath, this.data, ...args);  break;
    }

    if (this.base) {
      // Skip bubbling events for base EntityData
      return;
    }

    // Bubble the event up the EntityData-tree. If this EventData was indented with a path from the
    // parent structure, prefix it (from the path prop)
    const fullPath = [this.props.path, subPath].filter(Boolean).join('.') || undefined;
    this.context.bubbleEvent && this.context.bubbleEvent(event, fullPath);
  };

  handleMode = (...args) => this.bubbleEvent('mode', undefined, ...args);
  handlePathMode = (subPath, ...args) => this.bubbleEvent('mode', subPath, ...args);
  handleSubmit = (...args) => this.bubbleEvent('submit', undefined, ...args);
  handlePathSubmit = (subPath, ...args) => this.bubbleEvent('submit', subPath, ...args);
  handleCancel = (...args) => this.bubbleEvent('cancel', undefined, ...args);
  handlePathCancel = (subPath, ...args) => this.bubbleEvent('cancel', subPath, ...args);
  handleDelete = (...args) => this.bubbleEvent('delete', undefined, ...args);
  handlePathDelete = (subPath, ...args) => this.bubbleEvent('delete', subPath, ...args);

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
      // path,
      state,
      iterate,
      iterateKey,
      onMode,
      onSubmit,
      onCancel,
      onDelete,
      children
    } = this.props;

    const data = this.data;

    return (
      <EntityDataContext.Provider value={{
        data,
        loadedAt: state ? state.loadedAt : _get('context.loadedAt', this),
        ...this.recursiveStructure('pathError', 'error'),
        ...this.recursiveStructure('pathChange'),
        ...this.recursiveStructure('pathInitial'),
        ...this.recursiveStructure('pathMode', 'mode'),
        ...this.recursiveStructure('pathLoading', 'loading'),
        ...this.recursiveStructure('pathUpdating', 'updating'),
        editing: this.state.editing,
        onToggleEdit: this.toggleEditing,
        onChange: this.handleChange,
        handleCancel: (onCancel || (!this.base && this.context.handleCancel)) ? this.handleCancel : undefined,
        handleDelete: (onDelete || (!this.base && this.context.handleDelete)) ? this.handleDelete : undefined,
        handleMode: (onMode || (!this.base && this.context.handleMode)) ? this.handleMode : undefined,
        handleSubmit: (onSubmit || (!this.base && this.context.handleSubmit)) ? this.handleSubmit : undefined,
        bubbleEvent: this.bubbleEvent,
        onError: this.props.onError
      }}>
        { iterate && Array.isArray(data) ?
          data.map((element, index) =>
            <EntityData
              key={ iterateKey ? iterateKey(element) : index }
              path={ index.toString() }
              onChange={ this.props.onElementChange }
              onSubmit={ this.props.onElementSubmit }
              onDelete={ this.props.onElementDelete }
              onMode={ this.props.onElementMode }
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
