import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'filled', // 'filled', 'outline', 'text'
  disabled = false,
  icon = null,
  className = ''
}) => {
  const variantClass = {
    filled: 'md-button',
    outline: 'md-button outline',
    text: 'md-button text'
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClass} ${className}`}
    >
      {icon && <span className="material-icons-round">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
