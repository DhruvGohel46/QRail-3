import React, { useState } from 'react';
import api from '../../services/api';

const QRFileUpload = ({ isOpen, onClose, onScanComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('qr_image', file);

    try {
      const result = await api.qr.scanFromFile(file);

      if (result.success && result.assetId) {
        onScanComplete(result.assetId);
      } else {
        setError(result.error || 'Failed to read QR code from image');
      }
    } catch (err) {
      setError('Error uploading file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload QR Code Image</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="file-upload-area">
            <span className="material-icons-round" style={{ fontSize: 64, color: '#1976d2' }}>
              qr_code_2
            </span>
            <p>Select a QR code image to scan</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ marginTop: 16 }}
            />
          </div>

          {uploading && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p>Processing image...</p>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ marginTop: 16, color: '#f44336' }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="md-button outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRFileUpload;
 