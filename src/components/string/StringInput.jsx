import React from 'react';
import PropTypes from 'prop-types';
import bemCn from 'bem-cn';

const block = bemCn('string-input');

export default class StringInput extends React.PureComponent {

  constructor(props) {
    super(props);

    this._rnd = Math.round(Math.random() * 100000);

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  handleKeyDown(e) {
    if (e.keyCode === 13) {
      this.props.onPressEnter && this.props.onPressEnter();
    }
    this.props.onKeyDown && this.props.onKeyDown(e);
  }

  handleKeyUp(e) {
    this.props.onKeyUp && this.props.onKeyUp(e);
  }

  handleChange(e) {
    const { allowEmpty, onChange } = this.props;
    const inputValue = e.target.value;
    const value = (inputValue && inputValue.length > 0) ? inputValue : (allowEmpty ? '' : undefined);
    onChange && onChange(value);
  }

  handleFocus() {
    this.props.onFocus && this.props.onFocus();
  }

  handleBlur() {
    this.props.onBlur && this.props.onBlur();
  }

  render() {
    const {
      className,
      multiline,
      // type,
      placeholder,
      value,
      // min,
      // max,
      autoFocus,
      maxLength,
      onChange
    } = this.props;

    const elementValue = (onChange && value !== undefined) ? value.toString() || '' : undefined;
    const elementDefaultValue = (!onChange && value !== undefined) ? value.toString() || '' : undefined;

    if (multiline) {
      return (
        <textarea
          rows="1"
          className={ block.mix(className).toString() }
          value={ elementValue }
          defaultValue={ elementDefaultValue }
          placeholder={ placeholder }
          maxLength={ maxLength }
          onChange={ this.handleChange }
          onFocus={ this.handleFocus }
          onBlur={ this.handleBlur }
          onKeyDown={ this.handleKeyDown }
          onKeyUp={ this.handleKeyUp }
          ref={ (input) => this._textarea = input }
          autoFocus={ autoFocus } />
      );
    }

    return (
      <input
        className={ block.mix(className).toString() }
        type="text"
        value={ elementValue }
        defaultValue={ elementDefaultValue }
        placeholder={ placeholder }
        //min={ min }
        //max={ max }
        maxLength={ maxLength }
        onChange={ this.handleChange }
        onFocus={ this.handleFocus }
        onBlur={ this.handleBlur }
        onKeyUp={ this.handleKeyUp }
        onKeyDown={ this.handleKeyDown }
        autoFocus={ autoFocus } />
    );
  }
}

StringInput.propTypes = {
  className: PropTypes.string,
  //type: PropTypes.oneOf(['text', 'number', 'email', 'url']),
  multiline: PropTypes.bool,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  //min: PropTypes.number,
  //max: PropTypes.number,
  allowEmpty: PropTypes.bool,
  autoFocus: PropTypes.bool,
  minLength: PropTypes.number,
  maxLength: PropTypes.number, // Max value characters
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
  onPressEnter: PropTypes.func
};

StringInput.defaultProps = {
  value: '',
  type: 'text',
  allowEmpty: false,
  maxHeight: 400,
  autoFocus: false
};
