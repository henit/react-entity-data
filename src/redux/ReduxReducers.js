import _get from 'lodash/fp/get';
import _set from 'lodash/fp/set';
import _defaultTo from 'lodash/fp/defaultTo';
import { EntityState } from 'entity-state';

/**
 * Factory functions for redux reducers
 */
let ReduxReducers = {};

// ReduxReducers.serial = (state, action, handlers) =>
//   Array.isArray(handlers) ?
//     handlers.reduce((state, handler) => handler(state, action), state)
//     :
//     handlers(state, action);

ReduxReducers.serial = (handlers) => (state, action) =>
  Array.isArray(handlers) ?
    handlers.reduce((state, handler) => handler(state, action), state)
    :
    handlers(state, action);

/**
 * Combine reducers for different entity data handling purposes to one reducer for
 * the whole data set
 * @param {mixed} initialState Initial state
 * @param {object} handlers Handlers with key being action types, and value being a single reducer or array of reducers
 * @return {function} Reducer for multiple handlers
 */
ReduxReducers.createReducer = (initialState, handlers) =>
  function reducer(state = initialState, action) {
    if (handlers.hasOwnProperty(action.type)) {
      return ReduxReducers.serial(handlers[action.type])(state, action);
    } else {
      // No handler for given action type
      return state;
    }
  };

ReduxReducers.getEntityState = (state, statePath = undefined) => {
  return (statePath ? _get(statePath, state) : state) || {};
};

ReduxReducers.setEntityState = (entityState, state, statePath = undefined) => {
  return statePath ? _set(statePath, entityState, state) : entityState;
};

/**
 * Generator function to make a reducer that provide the given reduce state from a sub path of
 * the original state as if it was the base state for the reducer
 * @param {string} path Sub path of outer state
 * @param {function} reducer Reducer that should receive the inner state content
 * @return {function} New reducer that take the outer state
 */
ReduxReducers.reducePath = (path, reducer) => (state, action) =>
  _set(path, reducer(_get(path, state), action), state);

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
  EntityState.clear(state, statePath) || null;

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

  if (action.clear) {
    // return EntityState.clear();
    return ReduxReducers.setEntityState(null, state, statePath);
  }

  const entityState = Object.assign(
    {
      ...existingEntityState,
      error: _defaultTo(undefined, action.error)
    },

    // Loading / updating state
    action.path ? {
      pathLoading: _set(action.path, action.loading ? true : undefined, existingEntityState.pathLoading || {}),
      pathUpdating: _set(action.path, action.updating ? true : undefined, existingEntityState.pathUpdating || {})
    } : {
      loading: _defaultTo(false, action.loading),
      updating: _defaultTo(false, action.updating)
    },


    // Load data into state
    action.loadResponse && (
      action.path ? {
        data: _set(action.path, action.data, existingEntityState.data)
      } : {
        data: action.data,
        loadedAt: action.receivedAt || (new Date()).toISOString()
      }
    ),

    action.clean && {
      pathChange: {},
      pathInitial: action.delayCleanInitial ? existingEntityState.pathInitial : {}
    },
  );

  return ReduxReducers.setEntityState(entityState, state, statePath);
};

ReduxReducers.validate = (state, action, statePath) => {
  const withError = action.error ?
    EntityState.error(action.error, state, statePath)
    :
    state;

  if (!action.pathError) {
    return withError;
  }

  const ret = Object
    .keys(action.pathError)
    .reduce(
      (state, path) =>
        EntityState.pathError(path, action.pathError[path], state, statePath)
      , withError
    );

  return ret;
};

/**
 * Toggle mode value of entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @return {object} New state
 */
ReduxReducers.toggleMode = (state, action) => {
  if (action.path) {
    // Path based mode values
    const existing = state.pathMode || {};
    const pathMode = {
      ...existing,
      [action.path]: existing[action.path] === action.value ? undefined : action.value
    };
    return _set('pathMode', pathMode, state);
  } else {
    // Whole state mode
    const mode = state.mode === action.value ? undefined : action.value;
    return _set('mode', mode, state);
  }
};

/**
 * Clean paths of a given prefix of the entity state
 * @param {object} state Application state
 * @param {object} action Action
 * @return {object} New state
 */
ReduxReducers.pathClean = (state, action) =>
  EntityState.cleanPath(action.path || '', state);

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

      case types.httpRequest:
        return ReduxReducers.httpRequest(state, action, statePath);

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
