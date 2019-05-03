import _get from 'lodash/fp/get';
import { EntityState } from 'entity-state';

/**
 * Factory functions for redux reducers
 */
let ReduxReducers = {};

ReduxReducers.initialize = (state, action, statePath = undefined) =>
  EntityState.initialize(state, statePath);

ReduxReducers.load = (state, action, statePath = undefined) =>
  EntityState.load(action.data, state, statePath);

ReduxReducers.set = (state, action, statePath = undefined) =>
  EntityState.set(action.path, action.value, state, statePath);

ReduxReducers.stage = (state, action, statePath = undefined) =>
  EntityState.stage(action.path, action.value, state, statePath);

ReduxReducers.error = (state, action, statePath = undefined) =>
  EntityState.error({
    message: _get('error.message', action) || 'Unknown error'
  }, state, statePath);

ReduxReducers.pathError = (state, action, statePath = undefined) =>
  EntityState.pathError(action.path, {
    message: _get('error.message', action) || 'Unknown error'
  }, state, statePath);

ReduxReducers.clear = (state, action, statePath = undefined) =>
  EntityState.clear(state, statePath);


ReduxReducers.httpRequest = (state, action, statePath = undefined, responsePath = '') => {
  // const responseData = _get(`response${responsePath ? `.${responsePath}` : ''}`, action);
  // const data = (action.statusCode >= 200 && action.statusCode <= 299) ?
  //   responseData || undefined : existingState.data;

  const existingState = (statePath ? _get(statePath, state) : state) || {};

  return {
    // Keep existing state metadata that is not inflicted by this request
    ...existingState,
    // Overwrite data from response only for the requeast complete dispatch
    data: action.status === 'complete' ?
      _get(`response${responsePath ? `.${responsePath}` : ''}`, action)
      :
      _get(statePath ? [statePath, 'data'] : 'data', state),
    loadedAt: action.receivedAt || existingState.loadedAt,
    error: action.error,
    pending: action.pending || false

    // METADATA FOR REQUERSTS???
  };
};

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
        //return EntityState.set(action.path, action.value, state);
        return ReduxReducers.set(state, action, statePath);

      case types.stage:
        //return EntityState.stage(action.path, action.value, state);
        return ReduxReducers.stage(state, action, statePath);

      case types.error:
        //return EntityState.error(action.error, state);
        return ReduxReducers.error(state, action, statePath);

      case types.pathError:
        //return EntityState.pathError(action.path, action.error, state);
        return ReduxReducers.pathError(state, action, statePath);

      case types.clear:
        return ReduxReducers.clear(state, action, statePath);

      default:
        return state;
    }
  };

ReduxReducers.generate = (types, initialState) => ReduxReducers.generateAt(undefined, types, initialState);

export default ReduxReducers;
