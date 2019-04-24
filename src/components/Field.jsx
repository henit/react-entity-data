import React from 'react';
import PropTypes from 'prop-types';
import bemCn from 'bem-cn';
// import InputError from './InputError';

const block = bemCn('field');

export default function Field({ className, active, label, error, rightActions, children }) {

  const mods = { active, error: Boolean(error) };

  return (
    <div className={ block(mods).mix(className).toString() }>
      <div className={ block('label').toString() }>
        { label &&
          <label className={ block('label').toString() }>{ label }</label>
        }
        { rightActions &&
          <div className={ block('right-actions').toString() }>
            { rightActions }
          </div>
        }
      </div>
      { children }
      { error &&
        <p className={ block('error').toString() }>
          { error }
        </p>

        //<InputError error={ error } />
      }
    </div>
  );
}

Field.propTypes = {
  className: PropTypes.string,
  active: PropTypes.bool,
  label: PropTypes.string,
  error: PropTypes.object,
  rightActions: PropTypes.node,
  children: PropTypes.node
};

Field.defaultProps = {
  active: false
};
