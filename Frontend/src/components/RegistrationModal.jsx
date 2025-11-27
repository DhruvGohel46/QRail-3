import React, { useState } from 'react';
import './RegistrationModal.css';
import api from '../services/api';
const RegistrationModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'manufacturer'
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpInputChange = (e) => {
    setOtpInput(e.target.value);
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setMessage({ text: 'Please enter an email address first', type: 'error' });
      return;
    }
    try {
      setSendingOtp(true);
      const res = await api.auth.sendOtp(formData.email);
      if (res.success) {
        setOtpSent(true);
        setMessage({ text: 'OTP sent to your email. Enter it below to verify.', type: 'success' });
      } else {
        setMessage({ text: res.error || 'Failed to send OTP', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error sending OTP: ' + err.message, type: 'error' });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || !formData.email) {
      setMessage({ text: 'Please enter the OTP and your email', type: 'error' });
      return;
    }
    try {
      setVerifyingOtp(true);
      const res = await api.auth.verifyOtp(formData.email, otpInput);
      if (res.success) {
        setOtpVerified(true);
        setMessage({ text: 'Email verified. You can now submit the registration.', type: 'success' });
      } else {
        setMessage({ text: res.error || 'Invalid OTP', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error verifying OTP: ' + err.message, type: 'error' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await api.auth.register(formData);

      if (result.success) {
        setMessage({ text: 'Registration submitted. Await admin approval.', type: 'success' });
        setTimeout(() => {
          onClose();
          setFormData({
            username: '',
            password: '',
            name: '',
            email: '',
            role: 'manufacturer'
          });
          setMessage({ text: '', type: '' });
        }, 2000);
      } else {
        setMessage({ text: result.error || 'Registration failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Registration error: ' + error.message, type: 'error' });
    }
  };

  if (!isOpen) return null;
  

  return (
    <div className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="material-icons-round">person_add</span>
          <h3>Register New Account</h3>
        </div>

        <div className="form-grid">
          <div className="md-text-field">
            <label>Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>

          <div className="md-text-field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <div className="md-text-field">
            <label>Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="md-text-field">
            <label>Email</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{ flex: 1 }}
              />
              <button className="md-button outline" onClick={handleSendOtp} disabled={sendingOtp}>
                {sendingOtp ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Send OTP')}
              </button>
            </div>
            {otpSent && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={handleOtpInputChange}
                  style={{ width: '160px' }}
                />
                <button className="md-button" onClick={handleVerifyOtp} disabled={verifyingOtp || otpVerified}>
                  {verifyingOtp ? 'Verifying...' : (otpVerified ? 'Verified' : 'Verify OTP')}
                </button>
              </div>
            )}
          </div>

          <div className="md-text-field">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="manufacturer">Manufacturer</option>
              <option value="worker">Worker</option>
              <option value="engineer">Engineer</option>
            </select>
          </div>
        </div>

        {message.text && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#4caf50' : '#f44336',
            color: 'white'
          }}>
            {message.text}
          </div>
        )}

        <div className="modal-actions">
          <button className="md-button outline" onClick={onClose}>
            Cancel
          </button>
          <button className="md-button" onClick={handleSubmit} disabled={!otpVerified}>
            {otpVerified ? 'Submit' : 'Verify Email First'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
