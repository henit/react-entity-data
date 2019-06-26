// import _get from 'lodash/fp/get';
// import _partial from 'lodash/fp/partial';
// import { EntityState, Http } from 'entity-state';

/**
 * Redux action creaators for entity data operations
 */
let ReduxActions = {};

ReduxActions.pathClean = (type, path) => {
  if ((typeof type) !== 'string' || (typeof path) !== 'string') {
    throw new Error('Invalid arguments for pathClean.');
  }

  return {
    type,
    path
  };
};

ReduxActions.toggleMode = (type, path, value) => ({ type, path, value });

export default ReduxActions;
