import React, { useState } from 'react';
import './login.css';
import api from '../services/api';

const Login = ({ onLoginSuccess, onOpenRegistration }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'manufacturer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleHint, setRoleHint] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    if (name === 'role') {
      setRoleHint(`Tip: The username must belong to the ${value} role.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.auth.login(formData);

      if (result.success) {
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 500);
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-form-card">
        <div className="login-header">
          <div className="app-icon">
            <span className="material-icons-round">train</span>
          </div>
          <h2>QRail</h2>
          <p style={{ fontWeight: 900, color: 'black' }}>Indian Railways</p>
          <p>Smart QR-based tracking system for railway infrastructure</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-text-field">
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder=" "
            />
            <label htmlFor="username">Username</label>
            <div className="field-border"></div>
          </div>

          <div className="login-text-field">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder=" "
            />
            <label htmlFor="password">Password</label>
            <div className="field-border"></div>
          </div>

          <div className="login-text-field">
            <div className="role-select">
              <select
                id="userRole"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="role-dropdown"
                required
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="worker">Worker</option>
                <option value="engineer">Engineer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {roleHint && <div className="role-hint show">{roleHint}</div>}

          <button type="submit" className={`login-button ${loading ? 'loading' : ''}`} disabled={loading}>
            <span className="button-content">
              <span className="material-icons-round">login</span>
              {loading ? 'Signing In...' : 'Sign In'}
            </span>
            <div className="ripple"></div>
          </button>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              className="md-button outline"
              onClick={onOpenRegistration}
            >
              <span className="material-icons-round">person_add</span>
              Register New Account
            </button>
          </div>
        </form>

        {error && (
          <div className="login-error" style={{ display: 'flex' }}>
            <span className="material-icons-round">error_outline</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
