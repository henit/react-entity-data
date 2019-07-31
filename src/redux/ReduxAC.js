import _get from 'lodash/fp/get';
import _partial from 'lodash/fp/partial';
import { EntityState, Http } from 'entity-state';

/**
 * Factory functions for redux action creators
 */
let ReduxAC = {};

/**
 * Initialize entity state
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.initialize = type => () => ({ type });

/**
 * Load data into entity state
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.load = type => data => ({ type, data });

/**
 * Set new value in entity state data
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.set = type => (path, value) => ({ type, path, value });

/**
 * Stage a data change in pathChanges (while leaving the original data unchanged)
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.stage = type => (path, value) => ({ type, path, value });

/**
 * Set an error (for the whole data set) into the entity state
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.error = type => error => ({ type, error });

/**
 * Set a path-specific error into the entity state
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.pathError = type => (path, error) => ({ type, path, error });

/**
 * Clear the entity state
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.clear = type => () => ({ type });

/**
 * Clean the entity state (removing pathChange, errors etc but keeping the data)
 * @param {string} type Action type constant
 * @return {function} Action creator
 */
ReduxAC.clean = type => () => ({ type });

// Main request method

/**
 * Run http-request for an entity state, dispatching actions for the state of the request
 * @param {string} type Action type constant
 * @param {function} requestFn Async function making the actual http request
 * @param {object} [options] Options
 * @param {string} [option.loading] True to flag the state as loading during request
 * @param {string} [option.updating] True to flag the state as updating during request
 * @param {string} [option.path] Path to what part of the dataset the request is for. Undefined for
                                 the whole set
 * @param {bool} [options.loadResponse] Load response data when request is complete
 * @param {bool} [options.clean] Clean the state when request completes
 * @param {bool} [options.clear] Clear the whole state when request completes
 * @param {number} [options.delayCleanInitial] Time (ms or true for default) before cleaning initial values from state
 * @param {string} [options.responsePath] Path into the response that contains the data for the state (if not at root)
 * @return {function} Action creator (thunk)
 */
ReduxAC.httpRequest = (type, requestFn, options = {}) => {
  const typeInitiate = (Array.isArray(type) && type[0]) || type;
  const typeComplete = (Array.isArray(type) && type[1]) || type;
  const typeError = (Array.isArray(type) && type[2]) || type;
  const typeClean = (Array.isArray(type) && type[3]) || type;

  return (...args) => async dispatch => {
    dispatch({
      type: typeInitiate,
      status: 'initiate',
      loading: options.loading,
      updating: options.updating,
      path: options.path
    });

    try {
      const { statusCode, response } = await requestFn(...args);
      // await new Promise(resolve => setTimeout(resolve, 3000)); // Testing delayed response

      dispatch({
        type: typeComplete,
        status: 'complete',
        loadResponse: options.loadResponse,
        loading: false,
        updating: false,
        path: options.path,
        load: options.load,
        clean: options.clean,
        clear: options.clear,
        receivedAt: (new Date()).toISOString(),
        delayCleanInitial: Boolean(options.delayCleanInitial),
        data: options.responsePath ? _get(options.responsePath, response) : response
      });

      if (options.clean && options.delayCleanInitial) {
        setTimeout(() => {

          dispatch({
            type: typeClean,
            status: 'clean',
            loading: false,
            updating: false,
            path: options.path,
            clean: true
          });

        }, (typeof options.delayCleanInitial) !== 'number' ? 3000 : options.delayCleanInitial);
      }

      return {
        statusCode,
        response
      };

    } catch (e) {
      dispatch({
        type: typeError,
        status: 'error',
        loading: false,
        updating: false,
        path: options.path,
        statusCode: e.statusCode,
        error: {
          message: e.message,
          details: e.details,
          stack: e.stack,
          connectionError: e.connectionError
        }
      });
    }
  };
};


/**
 * Dispatch action from given action creator using the data from given path in the state
 * @param {string|array} statePath String for path to entity state, data from state will be sent to action.
                         Alternatively, array of path to entity state, and path inside data to target data.
 * @param {function} actionCreator Action creator that will be used to create the action to dispatch with target data
 * @return {function} Action creator
 */
ReduxAC.withData = (statePath, actionCreator) => (...args) => (dispatch, getState) => {
  const data = Array.isArray(statePath) ?
    _get(`${statePath[0]}.data.${statePath[1]}`, getState())
    :
    _get(`${statePath}.data`, getState());

  return dispatch(actionCreator(data));
};

/**
 * Dispatch action from given action creator using the data (including local changes) from given path in the state
 * @param {string|array} statePath String for path to entity state, data from state will be sent to action.
                         Alternatively, array of path to entity state, and path inside data to target data.
 * @param {function} actionCreator Action creator that will be used to create the action to dispatch with target data
 * @return {function} Action creator
 */
ReduxAC.withChangedData = (statePath, actionCreator) => (...args) => (dispatch, getState) => {
  const entityState = Array.isArray(statePath) ?
    _get(statePath[0], getState())
    :
    _get(statePath, getState());

  return dispatch(actionCreator(EntityState.dataWithChanges(entityState)));
};

/**
 * Toggle mode value of entity state
 * @param {string} type Action type constant
 * @param {string} value Value to toggle
 * @return {function} Action creator
 */
ReduxAC.toggleMode = (type, value) => path => ({ type, path, value });

/**
 * Compose http request functions with the given options merged with the argument options
 * @param {object} [options] Options to apply to request calls
 * @return {object} Function literal
 */
ReduxAC.withOptions = (options = {}) => ({
  request: (callOptions = {}) => Http.request({ ...options, ...callOptions }),
  get: (path, query, callOptions = {}) => Http.get(path, query, { ...options, ...callOptions }),
  post: (path, body, callOptions = {}) => Http.post(path, body, { ...options, ...callOptions }),
  put: (path, body, callOptions = {}) => Http.put(path, body, { ...options, ...callOptions }),
  patch: (path, body, callOptions = {}) => Http.patch(path, body, { ...options, ...callOptions }),
  delete: (path, query, callOptions = {}) => Http.delete(path, query, { ...options, ...callOptions })
});


/**
 * Generate action creators for the given types
 * @param {object} types Types (i.e { load: LOAD_USER })
 * @return {object} Function lietarl
 */
ReduxAC.all = types => ({
  initialize: types.initialize ? ReduxAC.initialize(types.initialize) : undefined,
  load: types.load ? ReduxAC.load(types.load) : undefined,
  set: types.set ? ReduxAC.set(types.set) : undefined,
  stage: types.stage ? ReduxAC.stage(types.stage) : undefined,
  error: types.error ? ReduxAC.error(types.error) : undefined,
  pathError: types.pathError ? ReduxAC.pathError(types.pathError) : undefined,
  clear: types.clear ? ReduxAC.clear(types.clear) : undefined,

  httpRequest: types.httpRequest ? _partial(ReduxAC.httpRequest, [types.httpRequest]) : undefined
});

export default ReduxAC;
