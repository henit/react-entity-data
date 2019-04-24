import React from 'react';
import PropTypes from 'prop-types';
// import { withEntityData } from '../data/EntityData';
import Field from '../Field';
import StringInput from './StringInput';

export default function StringField({ label, error, ...props }) {
  return (
    <Field label={ label } error={ error }>
      <StringInput { ...props } />
    </Field>
  );
}

StringField.propTypes = {
  label: PropTypes.string,
  error: PropTypes.object
};

// export default withEntityData(StringField);
