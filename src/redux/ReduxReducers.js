import _get from 'lodash/fp/get';
import _set from 'lodash/fp/set';
import _defaultTo from 'lodash/fp/defaultTo';
import { EntityState } from 'entity-state';

/**
 * Factory functions for redux reducers
 */
let ReduxReducers = {};


ReduxReducers.getEntityState = (state, statePath = undefined) => {
  return (statePath ? _get(statePath, state) : state) || {};
};

ReduxReducers.setEntityState = (entityState, state, statePath = undefined) => {
  return statePath ? _set(statePath, entityState, state) : entityState;
};

/**
 * Initialize entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.initialize = (state, action, statePath = undefined) =>
  EntityState.initialize(state, statePath);

/**
 * Load data into entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.load = (state, action, statePath = undefined) =>
  EntityState.load(action.data, state, statePath);

/**
 * Set new value in entity state data
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.set = (state, action, statePath = undefined) =>
  EntityState.set(action.path, action.value, state, statePath);

/**
 * Stage a data change in pathChanges (while leaving the original data unchanged)
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.stage = (state, action, statePath = undefined) =>
  EntityState.stage(action.path, action.value, state, statePath);

/**
 * Set an error (for the whole data set) into the entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.error = (state, action, statePath = undefined) =>
  EntityState.error({
    message: _get('error.message', action) || 'Unknown error'
  }, state, statePath);

/**
 * Set a path-specific error into the entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.pathError = (state, action, statePath = undefined) =>
  EntityState.pathError(action.path, {
    message: _get('error.message', action) || 'Unknown error'
  }, state, statePath);

/**
 * Clear the entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.clear = (state, action, statePath = undefined) =>
  EntityState.clear(state, statePath);

/**
 * Clean the entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @return {object} New state
 */
ReduxReducers.clean = (state, action, statePath = undefined) =>
  EntityState.clean(state, statePath);

/**
 * Run http-request for an entity state, dispatching actions for the state of the request
 * @param {object} state Application state
 * @param {object} action Action
 * @param {string} [statePath] Path in the state where the target entity state is located
 * @param {string} [responsePath] Path into the response structure where the data to put into the state is located
 * @return {object} New state
 */
ReduxReducers.httpRequest = (state, action, statePath = undefined) => {
  const existingEntityState = ReduxReducers.getEntityState(state, statePath);

  const entityState = Object.assign(
    {
      ...existingEntityState,
      pending: _defaultTo(false, action.pending),
      operation: _defaultTo(undefined, action.operation),
      error: _defaultTo(undefined, action.error)
    },

    action.load && {
      data: action.data,
      loadedAt: action.receivedAt || (new Date()).toISOString()
    },

    action.clean && {
      pathChange: {},
      pathInitial: action.delayCleanInitial ? existingEntityState.pathInitial : {}
    },
  );

  return ReduxReducers.setEntityState(entityState, state, statePath);
};

/**
 * Generate a set of reducers for the given type constants, to a given path in the state
 * @param {string} statePath Path in the state where the entity state is located (used for all the created reducers)
 * @param {object} types Action types to cover. I.e { load: LOAD_USER }
 * @param {object} initialState The initial state for the target state path
 * @return {function} Reducer function
 */
ReduxReducers.generateAt = (statePath, types, initialState = EntityState.initialize()) =>
  (state = initialState, action) => {
    if (!action.type) {
      return state;
    }

    switch (action.type) {
      case types.initialize:
        return ReduxReducers.initialize(state, action, statePath);

      case types.load:
        return ReduxReducers.load(state, action, statePath);

      case types.set:
        return ReduxReducers.set(state, action, statePath);

      case types.stage:
        return ReduxReducers.stage(state, action, statePath);

      case types.error:
        return ReduxReducers.error(state, action, statePath);

      case types.pathError:
        return ReduxReducers.pathError(state, action, statePath);

      case types.clear:
        return ReduxReducers.clear(state, action, statePath);

      case types.clean:
        return ReduxReducers.clean(state, action, statePath);

      default:
        return state;
    }
  };

/**
 * Generate a set of reducers for the given type constants
 * @param {object} types Action types to cover. I.e { load: LOAD_USER }
 * @param {object} initialState The initial state for the target state path
 * @return {function} Reducer function
 */
ReduxReducers.generate = (types, initialState) => ReduxReducers.generateAt(undefined, types, initialState);

export default ReduxReducers;
