import React from 'react';

const Select = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  required = false,
  placeholder = 'Select...',
  disabled = false
}) => {
  return (
    <div className="md-text-field">
      {label && <label htmlFor={name}>{label}{required && ' *'}</label>}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;

