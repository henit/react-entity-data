import _get from 'lodash/fp/get';
import React from 'react';
import PropTypes from 'prop-types';
import EntityState from '../EntityState';

export const EntityDataContext = React.createContext({
  error: {}
});

export function withEntityData(Component) {

  return function EntityDataComponent(props) {
    return (
      <EntityDataContext.Consumer>
        { entityProps => {
          return <Component
            // Provide the props given to the component directly
            {...props}
            // But override with the entity-data specific logic
            value={
              // Provide the direct value if given, otherwese read from the entity data source
              props.value || ((props.source || entityProps.source) && props.path) ?
                _get(props.path, props.source || entityProps.source)
                :
                undefined
            }
            _entityDataOnChange={ entityProps._entityDataOnChange }
            _entityDataOnError={ entityProps._entityDataOnError } />;
        }
        }
      </EntityDataContext.Consumer>
    );
  };

}
/* eslint-enable react/prop-types */


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
        _entityDataOnChange: this.props.onChange,
        _entityDataOnError: this.props.onError
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
