import React from 'react';
import { createStore, combineReducers } from 'redux';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, radios } from '@storybook/addon-knobs';
import { withReduxStore, DebugReduxState } from '../ReduxState';
import { EntityState, ReduxActions, ReduxReducers } from '../../src';
import { withEntityData } from '../../src/components/EntityData';
import { EntityData, StringInput, StringField, EntityStringInput, EntityStringField } from '../../src/components';

const INITIALIZE_DATA = 'INITIALIZE_DATA';
const LOAD_DATA = 'LOAD_DATA';
const SET_DATA = 'SET_DATA';
const STAGE_DATA = 'STAGE_DATA';
const DATA_ERROR = 'DATA_ERROR';
const DATA_PATH_ERROR = 'DATA_PATH_ERROR';
const CLEAR_DATA = 'CLEAR_DATA';


const initialState = EntityState.load({
  name: 'First Last',
  email: 'm@il.com',
  complain: 'Keep away!',
  number: 42
});

const reducer = ReduxReducers.generate({
  initialize: INITIALIZE_DATA,
  load: LOAD_DATA,
  set: SET_DATA,
  stage: STAGE_DATA,
  error: DATA_ERROR,
  pathError: DATA_PATH_ERROR,
  clear: CLEAR_DATA
}, initialState);
const store = createStore(reducer);

let actions = ReduxActions.all({
  initialize: INITIALIZE_DATA,
  load: LOAD_DATA,
  set: SET_DATA,
  stage: STAGE_DATA,
  error: DATA_ERROR,
  pathError: DATA_PATH_ERROR,
  clear: CLEAR_DATA
});

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


const onChange = (path, value) => {
  // Update the store
  store.dispatch(
    getOnChangeAction() === 'stage' ?
      actions.stage(path, value)
      :
      actions.set(path, value)
  );

  // Alert the storybook log
  action('onChange')(path, value);
};

const onError = (path, err) => store.dispatch(actions.pathError(path, err));


storiesOf('EntityData', module)
  .addDecorator(withKnobs)
  .add('With full state', withReduxStore(store, (state, dispatch) => {

    return (
      <div>
        <h1>EntityData</h1>

        <h2>
          ... with full state (onChange handlers
          { getOnChangeAction() === 'stage' ? ' staging the changes' : ' setting the changes' })
        </h2>

        <EntityData
          state={ state }
          onChange={ onChange }
          onError={ onError }
        >
          <EntityStringField label="Name" path="name" />

          <a onClick={ () => dispatch(actions.pathError('name', new Error('Something wrong with the name..'))) }>
            Trigger error
          </a>

          <EntityStringField label="E-mail" path="email" />
          <a onClick={ () => dispatch(actions.pathError('email', new Error('Something wrong with the e-mail..'))) }>
            Trigger error
          </a>

          <ComplainingEntityStringField label="Complaining field" path="complain" />
        </EntityData>

        <DebugReduxState state={ state } />
        <a onClick={ () => dispatch(actions.initialize()) }>
          Initialize
        </a>
        {' | '}
        <a onClick={ () => dispatch(actions.clear()) }>
          Clear state
        </a>
        {' | '}
        <a onClick={ () => dispatch(actions.error(new Error('An error concerning the whole data set.'))) }>
          Error
        </a>
      </div>
    );
  }
  ))
  .add('With data only', withReduxStore(reducer, (state, dispatch) =>
    <div>
      <h1>EntityData</h1>

      <h2>... with data only</h2>

      <h3>Setting changes directly on the data</h3>

      <EntityData
        data={ state.data }
        onChange={
          (path, value) => {
            dispatch(actions.set(path, value));
            action('onChange')(path, value);
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
          (path, value) => {
            dispatch(actions.stage(path, value));
            action('onChange')(path, value);
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
