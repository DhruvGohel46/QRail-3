import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', // 'default', 'success', 'warning', 'error', 'info'
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {children}
    </span>
  );
};

export default Badge;

// Add to your CSS:
/*
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-small { padding: 2px 8px; font-size: 10px; }
.badge-medium { padding: 4px 12px; font-size: 12px; }
.badge-large { padding: 6px 16px; font-size: 14px; }

.badge-default { background: #e0e0e0; color: #333; }
.badge-success { background: #e8f5e9; color: #388e3c; }
.badge-warning { background: #fff3e0; color: #f57c00; }
.badge-error { background: #ffebee; color: #c62828; }
.badge-info { background: #e3f2fd; color: #1976d2; }
*/
