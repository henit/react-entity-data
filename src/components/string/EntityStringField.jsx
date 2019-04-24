import React from 'react';
import PropTypes from 'prop-types';
import StringField from './StringField';
import { withEntityData } from '../EntityData';

class EntityStringField extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    this.props.onChange && this.props.onChange(value);
    this.props._entityDataOnChange && this.props._entityDataOnChange(this.props.path, value);
  }

  render() {
    const {
      _entityDataOnChange, // eslint-disable-line no-unused-vars
      _entityDataOnError, // eslint-disable-line no-unused-vars
      ...props
    } = this.props;

    return (
      <StringField
        { ...props }
        onChange={ this.handleChange } />
    );
  }
}

EntityStringField.propTypes = {
  path: PropTypes.string,
  onChange: PropTypes.func,
  _entityDataOnChange: PropTypes.func,
  _entityDataOnError: PropTypes.func
};

export default withEntityData(EntityStringField);
