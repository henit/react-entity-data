/* eslint-disable max-lines */
import _ from 'lodash/fp';
import React from 'react';
import PropTypes from 'prop-types';
import { createStore } from 'redux';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, radios, boolean, select } from '@storybook/addon-knobs';
import { withReduxStore, DebugReduxState } from '../ReduxState';
import { EntityState, ReduxAC, ReduxReducers } from '../../src';
import { withEntityData, EntityDataContext } from '../../src/components/EntityData';
import { EntityData, StringField, EntityStringField } from '../../src/components';

// Single entity state
const ENTITY_INITIALIZE_DATA = 'ENTITY_INITIALIZE_DATA';
const ENTITY_LOAD_DATA = 'ENTITY_LOAD_DATA';
const ENTITY_SET_DATA = 'ENTITY_SET_DATA';
const ENTITY_STAGE_DATA = 'ENTITY_STAGE_DATA';
const ENTITY_DATA_ERROR = 'ENTITY_DATA_ERROR';
const ENTITY_DATA_PATH_ERROR = 'ENTITY_DATA_PATH_ERROR';
const ENTITY_CLEAR_DATA = 'ENTITY_CLEAR_DATA';

let entityActions = ReduxAC.all({
  initialize: ENTITY_INITIALIZE_DATA,
  load: ENTITY_LOAD_DATA,
  set: ENTITY_SET_DATA,
  stage: ENTITY_STAGE_DATA,
  error: ENTITY_DATA_ERROR,
  pathError: ENTITY_DATA_PATH_ERROR,
  clear: ENTITY_CLEAR_DATA
});

const entityInitialState = EntityState.load({
  name: 'First Last',
  email: 'm@il.com',
  complain: 'Keep away!',
  number: 42
});

const entityReducer = ReduxReducers.generate({
  initialize: ENTITY_INITIALIZE_DATA,
  load: ENTITY_LOAD_DATA,
  set: ENTITY_SET_DATA,
  stage: ENTITY_STAGE_DATA,
  error: ENTITY_DATA_ERROR,
  pathError: ENTITY_DATA_PATH_ERROR,
  clear: ENTITY_CLEAR_DATA
}, entityInitialState);
const entityStore = createStore(entityReducer);

const entityOnChange = (path, value, data) => {
  // Update the store
  entityStore.dispatch(
    getOnChangeAction() === 'stage' ?
      entityActions.stage(path, value)
      :
      entityActions.set(path, value)
  );

  // Alert the storybook log
  action('entity onChange')(path, value, data);
};

// const entityOnElementChange = action('entity onElementChange');

const entityOnError = (path, err) => entityStore.dispatch(entityActions.pathError(path, err));

// Entity list state
const LIST_INITIALIZE_DATA = 'LIST_INITIALIZE_DATA';
const LIST_LOAD_DATA = 'LIST_LOAD_DATA';
const LIST_SET_DATA = 'LIST_SET_DATA';
const LIST_STAGE_DATA = 'LIST_STAGE_DATA';
const LIST_DATA_ERROR = 'LIST_DATA_ERROR';
const LIST_DATA_PATH_ERROR = 'LIST_DATA_PATH_ERROR';
const LIST_CLEAR_DATA = 'LIST_CLEAR_DATA';

let listActions = ReduxAC.all({
  initialize: LIST_INITIALIZE_DATA,
  load: LIST_LOAD_DATA,
  set: LIST_SET_DATA,
  stage: LIST_STAGE_DATA,
  error: LIST_DATA_ERROR,
  pathError: LIST_DATA_PATH_ERROR,
  clear: LIST_CLEAR_DATA
});

const listInitialState = {
  ...EntityState.load([
    {
      name: 'Entity one',
      number: 42
    },
    {
      name: 'Entity two',
      number: 43
    },
    {
      name: 'Entity three',
      number: 44
    }
  ]),
  error: { message: 'Whats wrong?' },
  pathError: {
    1: { message: 'Entity two has some errors' },
    '2.name': { message: 'Wrong name for nr three' }
  },
  pathLoading: {
    1: true
  }
};

const listReducer = ReduxReducers.generate({
  initialize: LIST_INITIALIZE_DATA,
  load: LIST_LOAD_DATA,
  set: LIST_SET_DATA,
  stage: LIST_STAGE_DATA,
  error: LIST_DATA_ERROR,
  pathError: LIST_DATA_PATH_ERROR,
  clear: LIST_CLEAR_DATA
}, listInitialState);
const listStore = createStore(listReducer);


const ComplainingEntityStringField = withEntityData((props) => {
  return (
    <StringField
      { ...props }
      onChange={
        props.onChange
      } />
  );
});


class DebugField extends React.Component {

  render() {
    const { changed, updating, updated, children } = this.props;

    return (
      <div>
        <div>
          { children }
        </div>

        <div style={{
          display: 'flex',
          flexFlow: 'row',
          alignItems: 'flex-start',
          paddingTop: '8px'
        }}>
          <div style={{ marginRight: '32px' }}>
            <strong>Changed: </strong>{ changed === undefined ? 'undefined' : changed.toString() }
          </div>
          <div style={{ marginRight: '16px' }}>
            <strong>Updating: </strong>{ updating === undefined ? 'undefined' : updating.toString() }
          </div>
          <div style={{ marginRight: '16px' }}>
            <strong>Updated: </strong>{ updated === undefined ? 'undefined' : updated.toString() }
          </div>

          <details>
            <summary style={{ outline: 'none', cursor: 'pointer' }}>Context</summary>
            <pre>{ JSON.stringify(this.context, null, 4) }</pre>
          </details>
        </div>
      </div>
    );
  }
}
DebugField.contextType = EntityDataContext;
DebugField.propTypes = {
  changed: PropTypes.bool,
  updating: PropTypes.bool,
  updated: PropTypes.bool,
  children: PropTypes.node
};

const EntityDebugField = withEntityData(DebugField);

const getOnChangeAction = () => radios('On change handler', {
  'Set changes directly on the data set': 'set',
  'Stage changes for update later': 'stage'
}, 'set');

function prepareState(state) {
  /* eslint-disable max-len */
  return {
    ...state,
    loading: select('loading', { True: true, False: false, Null: null }, null),
    updating: select('updating', { True: true, False: false, Null: null }, null),
    pathLoading: _.omitBy(_.isNil, {
      0: select('pathLoading.0', { True: true, False: false, Null: null }, null),
      1: select('pathLoading.1', { True: true, False: false, Null: null }, null),
      2: select('pathLoading.2', { True: true, False: false, Null: null }, null)
    }),
    pathUpdating: _.omitBy(_.isNil, {
      0: select('pathUpdating.0', { True: true, False: false, Null: null }, null),
      1: select('pathUpdating.1', { True: true, False: false, Null: null }, null),
      2: select('pathUpdating.2', { True: true, False: false, Null: null }, null)
    }),
    pathChange: _.omitBy(_.isUndefined, {
      ...state.pathChange,
      '0.name': boolean('pathChange.0.name: "Nr. one"', false) ? 'Nr. one' : state.pathChange['0.name'],
      '1.name': boolean('pathChange.1.name: "Nr. two"', false) ? 'Nr. two' : state.pathChange['1.name'],
      '2.name': boolean('pathChange.2.name: "Nr. three"', false) ? 'Nr. three' : state.pathChange['2.name']
    }),
    pathInitial: _.omitBy(_.isUndefined, {
      ...state.pathInitial,
      '0.name': boolean('pathInitial.0.name: "Entity one"', false) ? 'Entity one' : state.pathInitial['0.name'],
      '1.name': boolean('pathInitial.1.name: "Entity two"', false) ? 'Entity two' : state.pathInitial['1.name'],
      '2.name': boolean('pathInitial.2.name: "Entity three"', false) ? 'Entity three' : state.pathInitial['2.name']
    }),
    error: boolean('error: Whats wrong?', false) ? { message: 'Whats wrong?' } : undefined,
    pathError: _.omitBy(_.isUndefined, {
      ...state.pathError,
      0: boolean('pathError.0: { message: "Entity one has error" }', false) ? { message: 'Entity one has error' } : state.pathError[0],
      1: boolean('pathError.1: { message: "Entity two has error" }', false) ? { message: 'Entity two has error' } : state.pathError[1],
      2: boolean('pathError.2: { message: "Entity three has error" }', false) ? { message: 'Entity three has error' } : state.pathError[2]
    })
  };
  /* eslint-enable max-len */
}

const listOnChange = (path, value, data) => {
  // Update the store
  listStore.dispatch(
    getOnChangeAction() === 'stage' ?
      listActions.stage(path, value)
      :
      listActions.set(path, value)
  );

  // Alert the storybook log
  action('list onChange')(path, value, data);
};

const listOnElementChange = action('list onElementChange');

const listOnError = (path, err) => listStore.dispatch(listActions.pathError(path, err));


storiesOf('EntityData', module)
  .addDecorator(withKnobs)
  .add('With full state', withReduxStore(entityStore, (state, dispatch) => {

    return (
      <div>
        <h1>EntityData</h1>

        <h2>Single entity</h2>

        <h3>
          ... with full state (onChange handlers
          { getOnChangeAction() === 'stage' ? ' staging the changes' : ' setting the changes' })
        </h3>

        <EntityData
          state={ prepareState(state) }
          onChange={ entityOnChange }
          onError={ entityOnError }
        >
          <EntityStringField label="Name" path="name" />

          <a onClick={ () => dispatch(entityActions.pathError('name', new Error('Something wrong with the name..'))) }>
            Trigger error
          </a>

          <EntityStringField label="E-mail" path="email" />
          <a onClick={ () => dispatch(entityActions.pathError('email', new Error('Something wrong with the e-mail..'))) }>
            Trigger error
          </a>

          <ComplainingEntityStringField label="Complaining field" path="complain" />
        </EntityData>

        <DebugReduxState state={ prepareState(state) } />
        <a onClick={ () => dispatch(entityActions.initialize()) }>
          Initialize
        </a>
        {' | '}
        <a onClick={ () => dispatch(entityActions.clear()) }>
          Clear state
        </a>
        {' | '}
        <a onClick={ () => dispatch(entityActions.error(new Error('An error concerning the whole data set.'))) }>
          Error
        </a>
      </div>
    );
  }))
  .add('Path into data set', withReduxStore(listStore, (state, dispatch) => {

    return (
      <div>
        <h1>EntityData</h1>

        <h2>Nested entities</h2>

        <h3>
          ... with full state (onChange handlers
          { getOnChangeAction() === 'stage' ? ' staging the changes' : ' setting the changes' })
        </h3>

        <EntityData
          state={ prepareState(state) }
          path="1"
          onChange={ listOnChange }
          onError={ listOnError }
        >
          <EntityStringField label="Name" path="name" />
          <EntityStringField label="Number" path="number" />
        </EntityData>

        <DebugReduxState state={ prepareState(state) } />
      </div>
    );
  }))
  .add('Nested entity data', withReduxStore(listStore, (state, dispatch) => {

    return (
      <div>
        <h1>EntityData</h1>

        <h2>Nested entities</h2>

        <h3>
          ... with full state (onChange handlers
          { getOnChangeAction() === 'stage' ? ' staging the changes' : ' setting the changes' })
        </h3>

        <EntityData
          state={ prepareState(state) }
          onChange={ listOnChange }
          onError={ listOnError }
        >
          { state.data && state.data.map((element, index) =>
            <EntityData path={ index.toString() } key={ index } onChange={ listOnElementChange }>
              <EntityStringField label="Name" path="name" />
              <EntityStringField label="Number" path="number" />
              <hr />
            </EntityData>
          )}


          <hr />
        </EntityData>

        <DebugReduxState state={ prepareState(state) } />
      </div>
    );
  }))
  .add('Iterate array data', withReduxStore(listStore, (state, dispatch) => {

    return (
      <div>
        <h1>EntityData</h1>

        <h2>Iterate entity array</h2>

        <h3>
          ... with full state (onChange handlers
          { getOnChangeAction() === 'stage' ? ' staging the changes' : ' setting the changes' })
        </h3>

        <EntityData
          state={ prepareState(state) }
          onChange={ listOnChange }
          onElementChange={ listOnElementChange }
          onError={ listOnError }
          iterate
        >
          <EntityDebugField path="name">
            <EntityStringField label="Name" path="name" />
          </EntityDebugField>

          <EntityDebugField path="number">
            <EntityStringField label="Number" path="number" />
          </EntityDebugField>

          <hr />
        </EntityData>

        <DebugReduxState state={ prepareState(state) } />
      </div>
    );
  }))
  .add('Component props', withReduxStore(listStore, (state, dispatch) => {

    const unchangedState = EntityState.load({
      name: 'John Doe',
      number: 42
    });
    const nameChangedState = {
      ...unchangedState,
      pathChange: {
        name: 'John Smith'
      }
    };
    const nameUpdatingState = {
      ...unchangedState,
      pathChange: {
        name: 'John Smith'
      },
      pathInitial: {
        name: 'John Doe'
      },
      updating: true
    };
    const nameUpdatedState = {
      ...unchangedState,
      pathInitial: {
        name: 'John Doe'
      }
    };

    return (
      <div>
        <h1>EntityData</h1>

        <h2>Component props</h2>

        <h3>Unchanged</h3>
        <EntityData state={ unchangedState }>
          <EntityDebugField path="name">
            <EntityStringField label="Name" path="name" />
          </EntityDebugField>
          <EntityDebugField path="number">
            <EntityStringField label="Number" path="number" />
          </EntityDebugField>
        </EntityData>

        <DebugReduxState state={ unchangedState } />

        <h3>Name changed</h3>
        <EntityData state={ nameChangedState }>
          <EntityDebugField path="name">
            <EntityStringField label="Name" path="name" />
          </EntityDebugField>
          <EntityDebugField path="number">
            <EntityStringField label="Number" path="number" />
          </EntityDebugField>
        </EntityData>

        <DebugReduxState state={ nameChangedState } />

        <h3>Updating name</h3>
        <EntityData state={ nameUpdatingState }>
          <EntityDebugField path="name">
            <EntityStringField label="Name" path="name" />
          </EntityDebugField>
          <EntityDebugField path="number">
            <EntityStringField label="Number" path="number" />
          </EntityDebugField>
        </EntityData>

        <DebugReduxState state={ nameUpdatingState } />

        <h3>Updated name</h3>
        <EntityData state={ nameUpdatedState }>
          <EntityDebugField path="name">
            <EntityStringField label="Name" path="name" />
          </EntityDebugField>
          <EntityDebugField path="number">
            <EntityStringField label="Number" path="number" />
          </EntityDebugField>
        </EntityData>

        <DebugReduxState state={ nameUpdatedState } />

      </div>
    );
  }))
  .add('With data only', withReduxStore(entityStore, (state, dispatch) =>
    <div>
      <h1>EntityData</h1>

      <h2>... with data only</h2>

      <h3>Setting changes directly on the data</h3>

      <EntityData
        data={ state.data }
        onChange={
          (path, value, data) => {
            dispatch(entityActions.set(path, value));
            action('onChange')(path, value, data);
          }
        }
      >
        <EntityStringField label="Name" path="name" />
        <EntityStringField label="E-mail" path="email" />
        <ComplainingEntityStringField label="Complaining field" path="complain" />

        <DebugReduxState>{ state }</DebugReduxState>
      </EntityData>

      <h3>Staging changes</h3>

      <EntityData
        data={ state.data }
        onChange={
          (path, value, data) => {
            dispatch(entityActions.stage(path, value));
            action('onChange')(path, value, data);
          }
        }
      >
        <EntityStringField label="Name" path="foo" />
        <EntityStringField label="E-mail" path="email" />
        <ComplainingEntityStringField label="Complaining field" path="complain" />

        <DebugReduxState>{ state }</DebugReduxState>
      </EntityData>
    </div>
  ));
