import React, { useState } from 'react';
import api from '../../services/api';

const CreateAdminForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.password || !formData.name || !formData.email) {
      alert('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!formData.email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.admin.createAdmin(formData);
      if (result.success) {
        alert(result.message || 'Admin user created successfully!');
        // Reset form
        setFormData({
          username: '',
          password: '',
          name: '',
          email: ''
        });
        onSuccess();
      } else {
        alert('Failed to create admin: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error creating admin: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-admin-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 6 characters)"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="form-info">
          <p>ℹ️ This will create a new admin user with full system access</p>
        </div>

        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? 'Creating...' : '✨ Create Admin User'}
        </button>
      </form>

      <style jsx>{`
        .create-admin-form {
          max-width: 600px;
          margin: 0 auto;
        }

        form {
          background: #f7fafc;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2d3748;
        }

        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }

        input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .password-input-wrapper {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
        }

        .password-input-wrapper input {
          padding-right: 45px;
        }

        .form-info {
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .form-info p {
          margin: 0;
          color: #2c5282;
          font-size: 14px;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .submit-button:hover:not(:disabled) {
          background-color: #2c5282;
        }

        .submit-button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .create-admin-form {
            max-width: 100%;
          }

          form {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateAdminForm;
