import _partial from 'lodash/fp/partial';
// import Http from '../Http';
import { Http } from 'entity-state';

/**
 * Factory functions for redux action creators
 */
let ReduxActions = {};

ReduxActions.initialize = type => () => ({ type });
ReduxActions.load = type => data => ({ type, data });
ReduxActions.set = type => (path, value) => ({ type, path, value });
ReduxActions.stage = type => (path, value) => ({ type, path, value });
ReduxActions.error = type => error => ({ type, error });
ReduxActions.pathError = type => (path, error) => ({ type, path, error });
ReduxActions.clear = type => () => ({ type });

// Main request method

ReduxActions.httpRequest = (type, requestFn) => {

  const typeInitiate = (Array.isArray(type) && type[0]) || type;
  const typeComplete = (Array.isArray(type) && type[1]) || type;
  const typeError = (Array.isArray(type) && type[2]) || type;

  return (...args) => async dispatch => {
    dispatch({
      type: typeInitiate,
      status: 'initiate',
      pending: true
    });

    try {
      // const { statusCode, response } = await Http.request(options);
      const { statusCode, response } = await requestFn(...args);

      dispatch({
        type: typeComplete,
        status: 'complete',
        pending: false,
        receivedAt: (new Date()).toISOString(),
        statusCode,
        error: null,
        response
      });

      return {
        statusCode,
        response,
        error: null
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

ReduxActions.httpRequest0 = (type, requestFn, options = {}) => {
  const {
    method = 'GET',
    path = '',
    query = {},
    body,
    params // Action parameters (additional to the request info)
  } = options;

  const typeInitiate = (Array.isArray(type) && type[0]) || type;
  const typeComplete = (Array.isArray(type) && type[1]) || type;
  const typeError = (Array.isArray(type) && type[2]) || type;

  return async dispatch => {
    dispatch({
      type: typeInitiate,
      status: 'initiate',
      pending: true,
      request: { method, path, query, body },
      params
    });

    try {
      // const { statusCode, response } = await Http.request(options);
      const { statusCode, response } = await requestFn(options);

      dispatch({
        type: typeComplete,
        status: 'complete',
        pending: false,
        receivedAt: (new Date()).toISOString(),
        statusCode,
        error: null,
        response,
        params
      });

      return {
        statusCode,
        response,
        error: null
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
        },
        params
      });
    }
  };
};

// ReduxActions.httpRequest

// actions.get = (type, path, query, options = {}) =>
ReduxActions.httpGet = (type, requestFn, path, query, options = {}) =>
  ReduxActions.httpRequest(type, requestFn, {
    ...options,
    method: 'GET',
    path,
    query
  });

// actions.post = (type, path, body, options = {}) =>
ReduxActions.httpPost = (type, requestFn, path, body, options = {}) =>
  ReduxActions.httpRequest(type, requestFn, {
    ...options,
    method: 'POST',
    path,
    body
  });

// actions.put = (type, path, body, options = {}) =>
ReduxActions.httpPut = (type, requestFn, path, body, options = {}) =>
  ReduxActions.httpRequest(type, requestFn, {
    ...options,
    method: 'PUT',
    path,
    body
  });

// actions.patch = (type, path, body, options = {}) =>
ReduxActions.httpPatch = (type, requestFn, path, body, options = {}) =>
  ReduxActions.httpRequest(type, requestFn, {
    ...options,
    method: 'PATCH',
    path,
    body
  });

// actions.delete = (type, path, query, options = {}) =>
ReduxActions.httpDelete = (type, requestFn, path, query, options = {}) =>
  ReduxActions.httpRequest(type, requestFn, {
    ...options,
    method: 'DELETE',
    path,
    query
  });

ReduxActions.withOptions = (options = {}) => ({
  request: (callOptions = {}) => Http.request({ ...options, ...callOptions }),
  get: (path, query, callOptions = {}) => Http.get(path, query, { ...options, ...callOptions }),
  post: (path, body, callOptions = {}) => Http.post(path, body, { ...options, ...callOptions }),
  put: (path, body, callOptions = {}) => Http.put(path, body, { ...options, ...callOptions }),
  patch: (path, body, callOptions = {}) => Http.patch(path, body, { ...options, ...callOptions }),
  delete: (path, query, callOptions = {}) => Http.delete(path, query, { ...options, ...callOptions })
});



ReduxActions.all = types => ({
  initialize: types.initialize ? ReduxActions.initialize(types.initialize) : undefined,
  load: types.load ? ReduxActions.load(types.load) : undefined,
  set: types.set ? ReduxActions.set(types.set) : undefined,
  stage: types.stage ? ReduxActions.stage(types.stage) : undefined,
  error: types.error ? ReduxActions.error(types.error) : undefined,
  pathError: types.pathError ? ReduxActions.pathError(types.pathError) : undefined,
  clear: types.clear ? ReduxActions.clear(types.clear) : undefined,

  // Remove?
  // httpRequest: types.httpRequest ? ReduxActions.httpRequest(types.httpRequest) : undefined,
  httpRequest: types.httpRequest ? _partial(ReduxActions.httpRequest, [types.httpRequest]) : undefined,

  httpGet: types.httpGet ? ReduxActions.httpGet(types.httpGet) : undefined,
  httpPost: types.httpPost ? ReduxActions.httpPost(types.httpPost) : undefined,
  httpPut: types.httpPut ? ReduxActions.httpPut(types.httpPut) : undefined,
  httpPatch: types.httpPatch ? ReduxActions.httpPatch(types.httpPatch) : undefined,
  httpDelete: types.httpDelete ? ReduxActions.httpDelete(types.httpDelete) : undefined
});

export default ReduxActions;
