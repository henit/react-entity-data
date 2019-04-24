import React from 'react';
import PropTypes from 'prop-types';
import bemCn from 'bem-cn';

const block = bemCn('string-input');

export default class StringInput extends React.PureComponent {

  constructor(props) {
    super(props);

    this._rnd = Math.round(Math.random() * 100000);
    console.log(`(StringInput ${this._rnd}, ${props.path}) constructor`);

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

  componentDidUpdate(prevProps) {
    console.log(`(StringInput ${this._rnd}, ${this.props.path}) WHAT CHANGED?`);
    for (const index in this.props) {
      if (this.props[index] !== prevProps[index]) {
        console.info(index, prevProps[index], '-->', this.props[index]);
        // console.log('CHANGED: ' + index);
      }
    }
  }

  render() {
    console.log(`(StringInput ${this._rnd}, ${this.props.path}) render`);

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



/*
import React from 'react';
import PropTypes from 'prop-types';
import bemCn from 'bem-cn';

const block = bemCn('input');

export default class Input extends React.PureComponent {

  constructor(props) {
    super(props);

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
      type,
      placeholder,
      value,
      min,
      max,
      autoFocus,
      maxLength,
      onChange
    } = this.props;

    const elementValue = (onChange && value !== undefined) ? value.toString() || '' : undefined;
    const elementDefaultValue = (!onChange && value !== undefined) ? value.toString() || '' : undefined;

    return (
      <input
        className={ block.mix(className)() }
        type={ type }
        value={ elementValue }
        defaultValue={ elementDefaultValue }
        placeholder={ placeholder }
        min={ min }
        max={ max }
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

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.oneOf(['text', 'number', 'email', 'url']),
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  min: PropTypes.number,
  max: PropTypes.number,
  allowEmpty: PropTypes.bool,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number, // Max value characters
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
  onPressEnter: PropTypes.func
};

Input.defaultProps = {
  value: '',
  type: 'text',
  allowEmpty: false,
  maxHeight: 400,
  autoFocus: false
};
*/



/*
import React from 'react';
import PropTypes from 'prop-types';
import bemCn from 'bem-cn';

const block = bemCn('textarea');

export default class Textarea extends React.PureComponent {

  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  handleKeyDown(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      this.props.onPressEnter && this.props.onPressEnter();
    }
    this.props.onKeyDown && this.props.onKeyDown(e);
  }

  handleKeyUp(e) {
    this.ajustHeight();
    this.props.onKeyUp && this.props.onKeyUp(e);
  }

  ajustHeight() {
    if (!this._textarea) {
      return;
    }

    const clientHeight = this._textarea.clientHeight;
    const scrollHeight = this._textarea.scrollHeight;

    if (scrollHeight > clientHeight) {
      this._textarea.style.height = `${Math.min(scrollHeight, this.props.maxHeight)}px`;
    }
  }

  componentDidMount() {
    this.ajustHeight();
  }

  componentDidUpdate() {
    this.ajustHeight();
  }

  handleChange(e) {
    const { allowEmpty, onChange } = this.props;
    const inputValue = e.target.value;
    const value = (inputValue && inputValue.length > 0) ? inputValue : (allowEmpty ? '' : undefined);
    onChange && onChange(value);
  }

  handleFocus() {
    const { value, onFocus } = this.props;
    onFocus && onFocus(value);
  }

  handleBlur() {
    const { value, onBlur } = this.props;
    onBlur && onBlur(value);
  }

  render() {
    const {
      className,
      placeholder,
      value,
      autoFocus,
      maxLength,
      onChange
    } = this.props;

    const elementValue = (onChange && value !== undefined) ? value.toString() || '' : undefined;
    const elementDefaultValue = (!onChange && value !== undefined) ? value.toString() || '' : undefined;

    return (
      <textarea
        rows="1"
        className={ block.mix(className)() }
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
}

Textarea.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  allowEmpty: PropTypes.bool,
  maxHeight: PropTypes.number, // Pixels
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number, // Max value characters
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
  onPressEnter: PropTypes.func
};

Textarea.defaultProps = {
  value: '',
  allowEmpty: false,
  maxHeight: 400,
  autoFocus: false
};

*/
