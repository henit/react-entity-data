import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { State, Store } from '@sambego/storybook-state';
//import { Button } from '@storybook/react/demo';
import { StringInput } from '../../src/components';

const store = new Store({
  standardEmpty: undefined,
  standardPlaceholder: undefined,
  standardValue: 'This is a value',
  multilineEmpty: undefined,
  multilinePlaceholder: undefined,
  multilineValue: 'This is a value'
});

const onChange = prop => val => {
  store.set({
    [prop]: val
  });
  action('onChange')(val);
};

storiesOf('Inputs', module)
  .add('StringInput', () => (
    <State store={store}>
      { state =>
        <div>
          <h1>StringInput</h1>

          <h2>Standard</h2>

          <h3>Empty</h3>

          <StringInput
            value={ state.standardEmpty }
            onChange={ onChange('standardEmpty') } />

          <h3>With placeholder</h3>

          <StringInput
            placeholder="This is a placeholder"
            value={ state.standardPlaceholder }
            onChange={ onChange('standardPlaceholder') } />

          <h3>With value</h3>

          <StringInput
            placeholder="Enter a text"
            value={ state.standardValue }
            onChange={ onChange('standardValue') } />

          <h2>Multiline</h2>

          <h3>Empty</h3>

          <StringInput
            value={ state.multilineEmpty }
            onChange={ onChange('multilineEmpty') }
            multiline />

          <h3>With placeholder</h3>

          <StringInput
            placeholder="Enter a text"
            value={ state.multilinePlaceholder }
            onChange={ onChange('multilinePlaceholder') }
            multiline />

          <h3>With value</h3>

          <StringInput
            placeholder="Enter a text"
            value={ state.multilineValue }
            onChange={ onChange('multilineValue') }
            multiline />

        </div>
      }
    </State>
  ));
