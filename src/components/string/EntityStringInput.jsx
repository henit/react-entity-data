import React from 'react';
import StringInput from './StringInput';
import { withEntityData } from '../EntityData';

function EntityStringInput({ _entityDataOnChange, _entityDataOnError, ...props }) {
  return (
    <StringInput
      { ...props }
      onChange={ value => {
        console.log('INNER...', value);

        props.onChange && props.onChange(value);
        _entityDataOnChange && _entityDataOnChange(props.path, value);
      }} />
  );
}

export default withEntityData(EntityStringInput);
