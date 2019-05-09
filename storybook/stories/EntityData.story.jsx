import React from 'react';
import { createStore } from 'redux';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, radios } from '@storybook/addon-knobs';
import { withReduxStore, DebugReduxState } from '../ReduxState';
import { EntityState, ReduxActions, ReduxReducers } from '../../src';
import { withEntityData } from '../../src/components/EntityData';
import { EntityData, StringField, EntityStringField } from '../../src/components';

// Single entity state
const ENTITY_INITIALIZE_DATA = 'ENTITY_INITIALIZE_DATA';
const ENTITY_LOAD_DATA = 'ENTITY_LOAD_DATA';
const ENTITY_SET_DATA = 'ENTITY_SET_DATA';
const ENTITY_STAGE_DATA = 'ENTITY_STAGE_DATA';
const ENTITY_DATA_ERROR = 'ENTITY_DATA_ERROR';
const ENTITY_DATA_PATH_ERROR = 'ENTITY_DATA_PATH_ERROR';
const ENTITY_CLEAR_DATA = 'ENTITY_CLEAR_DATA';

let entityActions = ReduxActions.all({
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

let listActions = ReduxActions.all({
  initialize: LIST_INITIALIZE_DATA,
  load: LIST_LOAD_DATA,
  set: LIST_SET_DATA,
  stage: LIST_STAGE_DATA,
  error: LIST_DATA_ERROR,
  pathError: LIST_DATA_PATH_ERROR,
  clear: LIST_CLEAR_DATA
});

const listInitialState = EntityState.load([
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
]);

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
const getOnChangeAction = () => radios('On change handler', {
  'Set changes directly on the data set': 'set',
  'Stage changes for update later': 'stage'
}, 'set');

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
          state={ state }
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

        <DebugReduxState state={ state } />
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
          state={ state }
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

        <DebugReduxState state={ state } />
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
          state={ state }
          onChange={ listOnChange }
          onElementChange={ listOnElementChange }
          onError={ listOnError }
          iterate
        >
          <EntityStringField label="Name" path="name" />
          <EntityStringField label="Number" path="number" />

          <hr />
        </EntityData>

        <DebugReduxState state={ state } />
      </div>
    );
  }))
  .add('With data only', withReduxStore(entityReducer, (state, dispatch) =>
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
