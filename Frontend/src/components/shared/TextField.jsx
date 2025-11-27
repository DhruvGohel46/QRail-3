import React from 'react';

const TextField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false,
  placeholder = ' ',
  error = '',
  disabled = false
}) => {
  return (
    <div className="md-text-field">
      {label && <label htmlFor={name}>{label}{required && ' *'}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'error' : ''}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};

export default TextField;
