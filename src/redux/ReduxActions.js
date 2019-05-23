import _get from 'lodash/fp/get';
import _partial from 'lodash/fp/partial';
import _defaultTo from 'lodash/fp/defaultTo';
import { Http } from 'entity-state';

/**
 * Factory functions for redux action creators
 */
let ReduxActions = {};

/**
 * Initialize entity state
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.initialize = type => () => ({ type });

/**
 * Load data into entity state
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.load = type => data => ({ type, data });

/**
 * Set new value in entity state data
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.set = type => (path, value) => ({ type, path, value });

/**
 * Stage a data change in pathChanges (while leaving the original data unchanged)
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.stage = type => (path, value) => ({ type, path, value });

/**
 * Set an error (for the whole data set) into the entity state
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.error = type => error => ({ type, error });

/**
 * Set a path-specific error into the entity state
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.pathError = type => (path, error) => ({ type, path, error });

/**
 * Clear the entity state
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.clear = type => () => ({ type });

/**
 * Clean the entity state (removing pathChange, errors etc but keeping the data)
 * @param {string} type Action type constant
 * @return {object} Action
 */
ReduxActions.clean = type => () => ({ type });

// Main request method

/**
 * Run http-request for an entity state, dispatching actions for the state of the request
 * @param {string} type Action type constant
 * @param {function} requestFn Async function making the actual http request
 * @param {object} [options] Options
 * @param {string} [option.operation] CRUD operation type. "create", "read", "update" or "delete"
 * @param {bool} [options.load] Load the request response into data when completed (default: true)
 * @param {bool} [options.clean] Clean state when state completes (default: true)
 * @param {number} [options.delayCleanInitial] Time (ms or true for default) before cleaning initial values from state
 * @param {string} [options.responsePath] Path into the response that contains the data for the state (if not at root)
 * @return {function} Thunk action
 */
ReduxActions.httpRequest = (type, requestFn, options = {}) => {
  const typeInitiate = (Array.isArray(type) && type[0]) || type;
  const typeComplete = (Array.isArray(type) && type[1]) || type;
  const typeError = (Array.isArray(type) && type[2]) || type;
  const typeClean = (Array.isArray(type) && type[3]) || type;

  return (...args) => async dispatch => {
    dispatch({
      type: typeInitiate,
      operation: options.operation,
      status: 'initiate',
      pending: true
    });

    try {
      const { statusCode, response } = await requestFn(...args);

      //setTimeout(() => {
      dispatch({
        type: typeComplete,
        status: 'complete',
        pending: false,
        receivedAt: (new Date()).toISOString(),
        clean: _defaultTo(true, options.clean),
        delayCleanInitial: Boolean(options.delayCleanInitial),
        load: _defaultTo(true, options.load),
        data: options.responsePath ? _get(options.responsePath, response) : response
      });
      //}, 2000);

      if (options.delayCleanInitial) {
        setTimeout(() => {

          dispatch({
            type: typeClean,
            status: 'clean',
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
        pending: false,
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
 * Compose http request functions with the given options merged with the argument options
 * @param {object} [options] Options to apply to request calls
 * @return {object} Function literal
 */
ReduxActions.withOptions = (options = {}) => ({
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
ReduxActions.all = types => ({
  initialize: types.initialize ? ReduxActions.initialize(types.initialize) : undefined,
  load: types.load ? ReduxActions.load(types.load) : undefined,
  set: types.set ? ReduxActions.set(types.set) : undefined,
  stage: types.stage ? ReduxActions.stage(types.stage) : undefined,
  error: types.error ? ReduxActions.error(types.error) : undefined,
  pathError: types.pathError ? ReduxActions.pathError(types.pathError) : undefined,
  clear: types.clear ? ReduxActions.clear(types.clear) : undefined,

  httpRequest: types.httpRequest ? _partial(ReduxActions.httpRequest, [types.httpRequest]) : undefined
});

export default ReduxActions;
