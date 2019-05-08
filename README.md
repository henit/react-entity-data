# React Entity Data

Redux helper functions and composable components for form-inputs in React without tons of repeated logic

When creating React applications with Redux state, there is a tendency to end up with a lot of repeated logic for similar data handling processes. This includes:

1. Fetching data from a server/API
2. Organizing the data in the application state
3. Making changes to the data (through web forms)
4. Submitting the changes back to the server

Other than these basic steps, application code often ends up with [a lot of extra metadata surrounding the actual data](https://github.com/henit/entity-state), as well as all the logic for handling it. By standardizing the different parts of this process, you reduce the amount of repeated source code (a lot!), and also make more structured patterns in your data handling.

**React Entity Data** contains React implementations using the state structure from [Entity State](https://github.com/henit/entity-state). It includes state handlers, and React components for organizing the data into form components (fields / inputs) and applying events from them to actions managing the entity state.

## Installation


```
npm install react-entity-data
```

## Usage


```
// ES6
import { EntityData, ReduxActions, ReduxReducers } from 'entity-state';

// CommonJS
var EntityData = require('entity-state').EntityData;
var ReduxActions = require('entity-state').ReduxActions;
var ReduxReducers = require('entity-state').ReduxReducers;
```

Let's make state handlers and views for application data simple and flexible!

### Example

#### Doing it "manually"

**View**

```
<form className="user-form">
  <h1>User form</h1>

  <div className="field">
    <label>
      Name
      <input
        type="text"
        value={ user.name }
        onChange={ this.handleNameChange } />
    </label>
  </div>

  <label>
    E-mail
    <input
      type="email"
      value={ user.email }
      onChange={ this.handleEmailChange } />
  </label>

  <button onClick={ onSubmit }>Save changes</button>
</form>
```

**Redux actions**

```
handleChange(field, value) {
  return ({
    type: 'CHANGE_USER',
    field,
    value
  });
}

handleSubmit() {
  return async (dispatch, getState) => {
    const user = getState().user;

    dispatch({
      type: SUBMIT_USER_INITIALIZE
    });

    try {
      const res = fetch(`http://www.example.com/users/${user.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: user
      });

      if (!res) {
        dispatch({
          type: SUBMIT_USER_ERROR,
          message: 'No result from fetch.'
        });
        throw new Error('No result from fetch.');
      }

      const response = await res.json();

      dispatch({
        type: SUBMIT_USER_COMPLETE,
        user: response
      });

      return {
        statusCode: res.statusCode,
        response
      }

    } catch (e) {
      dispatch({
        type: SUBMIT_USER_ERROR,
        message: 'Can\'t connect to API.'
      });
      throw new Error('Can\'t connect to API.');
    }
  }
}
```

**Redux reducers**

```
const initialState = {
  data: null,
  receivedAt: null,
  pending: false,
  error: null
};

function user(state = initialState, action) {

  switch (action.type) {
    case CHANGE_USER:
      return {
        ...state,
        data: {
          ...(state.data || {}),
          [action.field]: action.value
        }
        ...state
      };

    case SUBMIT_USER_INITIALIZE:
      return {
        ...state,
        pending: true,
        error: null
      };

    case SUBMIT_USER_COMPLETE:
      return {
        ...state,
        pending: false,
        data: action.user,
        receivedAt: new Date()
      };

    case SUBMIT_USER_ERROR:
      return {
        ...state,
        error: action.error,
        pending: false
      };
  }
}
```

Ok, this example was very simplified. To handle all circumstances, there is usually quite a bit more logic needed. But it was still a lot of code just to be able to change some input values and submit them back to the server (assembly-flashback!). So then of course we make some reusable functions for things like the http request logic and so on. Here is an example of the same logic, using components and helpers from **React Entity Data**:

#### With React Entity Data

**View**

```
<form className="user-form">
  <h1>User</h1>

  <EntityData state={ userState } onChange={ onChange }>
    <StringField label="Name" path="name" />
    <StringField label="E-mail" path="name" />
  </EntityData>

  <button onClick={ this.handleSubmit }
</form>
```

**Redux actions**

```
export const handleChange = ReducActions.stage(CHANGE_USER);
export const handleSubmit = ReduxActions.httpRequest(SUBMIT_USER,
  user => Http.put(`users/${user.id}`, user);
);
```

**Redux reducers**

```
const initialState = EntityState.initialize();

export default function company(state = initialState, action) {

  switch (action.type) {
    case CHANGE_USER: return ReduxReducers.stage(state, action);
    case SUBMIT_USER: return ReduxReducers.httpRequest(state, action);
    default: return state;
  }

}
```

React Entity Data is made to be composable and flexible. It can be combined in many ways with business logic. The goal is to provide simplicity and reduce errors and maintenance by defining a familiar pattern to handling application state.

## The structure

The data structure for an entity state used in React Entity Data is based on [Entity State](https://github.com/henit/entity-state/blob/master/README.md#the-structure) with the additional boolean property `pending` for indicating that there is a request running that will update the given state. This property can be used for things like avoiding triggering a request while it is allready running, or for showing a loading spinner in the view.

## API

### EntityData

```
import { EntityData, withEntityData } from 'react-entity-data';
```

When a React view uses EntityData as part of the rendered output, it creates a context based on the properties given to the `EntityData` component. Child components at any depth inside this component can then "connect" to this context. The easiest way to do this is by making an Entity "variant" of the component, that is wrapped with the `withEntityData` function, like this:

```
export default function StringInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={ value }
      onChange={ e => onChange(e.target.value) } />
  );
}

export const EntityStringInput = withEntityData(StringInput);
```

EntityStringInput would then receive a value through the EntityData context, based on the path property and the data from the state sent to EntityData. Here is a very simplified use case example:

```
<EntityData
  state={ EntityState.load({ name: 'The name' }) }
  onChange={ console.info }
>
  <EntityStringInput path="name" />
</EntityData>
```

This will lead to the input having the name from the loaded state as value, and every change from the input tag will be sent to `console.info` with the arguments `('name', 'The value', { name: 'The name' })`. This can then be sent to any application logic responsible for handling the form changes. If you give an `onChange` function both to the `EntityData` component and directly on the `EntityStringInput` component, the first will be called with `path`, `value` and `source`, while the other will be called with just the `value`. The same goes for other events like `onError`.

#### Separate connected from disconnected

There is good reason for having `EntityStringInput` separate from `StringInput` instead of just exporting the connected variant (made with `withEntityData`) as `StringInput` directly. If you have a large form for managing an entity, like a user profile form wrapped with `EntityData`, you might find the need for an input inside that does not connect to the entity. Like a search field for adding new related data. In a case like this, you could combine connected and disconnected components:

```
<EntityData onChange={ updateUser }>

  <EntityStringInput path="field1" />
  <EntityStringInput path="field2" />

  <StringInput onChange={ doSomethingElse } />

  <EntityStringInput path="field3" />
  <EntityStringInput path="field4" />

</EntityData>
```

#### Properties

The EntityData components accepts the following properties:

Property          | Type                | Description
---               | ---                 | ---
`state`           | *object*            | The entity state. See "The structure" above for more info on this object
`data`            | *object* or *array* | If there is no state, only data to distribute into the fields, the `data` prop can be used. But that limits the functionality a bit, such as staging changes outside the original data.
`onChange`        | *function*          | Event handler, called when any child component connected to the EntityData with `withEntityData` calls onChange.
`onError`         | *function*          | Event handler, called when connected components call `onError`
`path`            | *string*            | Sub path, for using a sub structure of the data as source for connected components, or for nested sub structures (see description below).
`iterate`         | *boolean*           | To iterate through array data and send each element as source for connected components, instead of the whole array (see example below).
`onElementChange` | *function*          | When using iterate, this event handler will be called similar to `onChange`, but for the array element as source instead of the whole array.
`onElementError`  | *function*          | Event handler for iterate elements, when they call `onError`

#### Nesting EntityData components

In deep data structures, the paths to data can become a bit messy. Consider the following example:

```
const userState = EntityState.load({
  name: 'John Doe',
  company: {
    name: 'Doe INC',
    address: 'Missing Street'
  }
});
```

An EntityData render for editing this data, would have to look something like this:

```
<EntityData state={ userState }>
  <EntityStringInput path="name" />
  <EntityStringInput path="company.name" />
  <EntityStringInput path="company.address" />
</EntityData>
```

While repeating the company object name is not a big issue in this example, it could be in a more complex structure. Instead, EntityData components that are nested with `path` without any `state`/`data` props, lead using sub structures of the outer data set as source for their inner connected components. Here is an example:

```
<EntityData state={ userState } onChange={ console.info }>
  <EntityStringInput path="name" />

  <EntityData path="company" onChange={ console.info }>
    <EntityStringInput path="name" />
    <EntityStringInput path="address" />
  </EntityData>
</EntityData>
```

In this case, since both `EntityData` components has onChange methods, both will be called, but the inner one will be called with arguments like:

`('name', 'Doe INC.', { name: 'Doe INC', address: 'Missing Street'})`

and the outer one will be called with arguments like:

`('company.name', 'Doe INC.', { name: 'John Doe', company: { name: 'Doe INC', address: 'Missing Street' }})`

So you can decide where to add the handler functions you need based on how your state handlers are made.

#### Iterate state data

Consider an example with the data being an array of entities instead of just one object:

```
const usersState = EntityState.load([
  { name: 'Jon Snow' },
  { name: 'Daenerys Targaryen' },
  { name: 'Cersei Lannister' }
])
```

Since the number of elements in the array can vary, we cannot just refer to paths like `0.name` when making a list or form or for managing this data set. We would have to iterate through the actual array:

```
<EntityData state={ usersState }>
  { myUsers.data.forEach((user, i) =>
    <EntityStringInput path={ `${i}.name` } />
  )}
</EntityData>
```

Not very extensive syntax, but since we are trying to refer to paths instead of the actual data inside `EntityData`, this is what the `iterate` property is for. It basically takes an array in the data and uses each element as source for connected components instead of the whole array:

```
<EntityData state={ usersState } iterate>
  <EntityStringInput path="name" />
</EntityData>
```

#### Nest and iterate

The two ways of simplifying deep structures can also be combined:

```
const houseState = EntityState.load({
  title: 'House Lannister',
  members: [
    { name: 'Jaime Lannister' },
    { name: 'Tyrion Lannister' },
    { name: 'Cersei Lannister' }
  ]
});

<EntityData state={ houseState }>
  <EntityStringInput path="title" />

  <EntityData path="members" iterate>
    <EntityStringInput path="name" />
  </EntityData>
</EntityData>
```

Now if this where a large object with lots of form fields, think about how much you would save by not having to refer to properties from the state data directly and handler functions all over the place like this:
```
<StringInput value={ house.title } onChange={ ... } onError={ ...} />
```


### ReduxActions

`ReduxActions` is factory functions that creates Redux action creators for common operations. A few of them is very small and simple, and does not really reduce the amount of code much, but they still make a pattern of having reusable logic instead of putting the action creator logic into each set of actions, and also makes it easier to find similar operations in the code when refactoring etc.

#### .initialize(type)

For [initializing the entity state](https://github.com/henit/entity-state/blob/master/README.md#initializesource-sourcepath)

`type` - The action type constant

#### .load(type)

For [loading data into the entity state](https://github.com/henit/entity-state/blob/master/README.md#loaddata-source-sourcepath)

`type` - The action type constant

#### .set(type)

For [setting a new value in a part of the entity state data](https://github.com/henit/entity-state/blob/master/README.md#setpath-value-source-sourcepath)

`type` - The action type constant

#### .stage(type)

For [staging a new value without changing the original one in the entity state data](https://github.com/henit/entity-state/blob/master/README.md#stagepath-value-source-sourcepath)

`type` - The action type constant

#### .error(type)

For [setting an error on the entity state](https://github.com/henit/entity-state/blob/master/README.md#errorerror-source-sourcepath)

`type` - The action type constant

#### .pathError(type)

For [setting a path-specific error on the entity state](https://github.com/henit/entity-state/blob/master/README.md#patherrorpath-error-source-sourcepath)

`type` - The action type constant

#### .clear(type)

For [removing the whole entity state](https://github.com/henit/entity-state/blob/master/README.md#clearsource-sourcepath)

`type` - The action type constant

#### .clean(type)

For [cleaning the entity state while keeping the data](https://github.com/henit/entity-state/blob/master/README.md#cleansource-sourcepath)

`type` - The action type constant

#### .httpRequest(type, requestFn)

For making an http request

`type` - The action type constant
`requestFn` - An async function (returning a Promise) for making an HTTP request. Like a composition made with [Http](https://github.com/henit/entity-state/blob/master/README.md#http)


### ReduxReducers

`ReduxReducers` is factory functions that creates Redux reducers for common operations. Many of them wrap [EntityState functions](https://github.com/henit/entity-state/blob/master/README.md#entitystate) but with the right arguments from the state/action, so most of the helper functions just take `state`& `action` as arguments.

#### .initialize(state, action, statePath)

For [initializing the entity state](https://github.com/henit/entity-state/blob/master/README.md#initializesource-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .load(state, action, statePath)

For [loading data into the entity state](https://github.com/henit/entity-state/blob/master/README.md#loaddata-source-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .set(state, action, statePath)

For [setting a new value in a part of the entity state data](https://github.com/henit/entity-state/blob/master/README.md#setpath-value-source-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .stage(state, action, statePath)

For [staging a new value without changing the original one in the entity state data](https://github.com/henit/entity-state/blob/master/README.md#stagepath-value-source-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .error(state, action, statePath)

For [setting an error on the entity state](https://github.com/henit/entity-state/blob/master/README.md#errorerror-source-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .pathError(state, action, statePath)

For [setting a path-specific error on the entity state](https://github.com/henit/entity-state/blob/master/README.md#patherrorpath-error-source-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .clear(state, action, statePath)

For [removing the whole entity state](https://github.com/henit/entity-state/blob/master/README.md#clearsource-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .clean(state, action, statePath)

For [cleaning the entity state while keeping the data](https://github.com/henit/entity-state/blob/master/README.md#cleansource-sourcepath)

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state

#### .httpRequest(state, action, statePath, responsePath)

For making an http request

`state` - The application state (or substate)
`action` - The Redux action
`statePath` - Optional path when the entity state object is part of a structure instead of the root of the given state
`responsePath` - For extracting the http response from inside the body instead of using the whole response body as data for the entity state

#### .generateAt(statePath, types, initialState)

Generate a set of reducers based on the given object of types

Example, this makes a reducer function that catch the `CHANGE_USER` and `USER_ERROR` actions, and run the `stage` / `error` reducer functions on the `user` path inside the given state:

```
export default ReduxReducers.generateAt('user', {
  stage: CHANGE_USER,
  error: USER_ERROR
})
```

#### .generate(types, initialState) =>

Generates a set of reducers based on the given object of types, for the root of the given state.


---

*__React Entity Data__ is being actively used, and is in development. Suggestions and contributions are very welcome!*
