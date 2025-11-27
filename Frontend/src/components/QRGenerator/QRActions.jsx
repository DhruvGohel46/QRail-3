import React from 'react';
import './QRGenerator.css';

const QRActions = ({ data, options }) => {
  const handleDownload = async () => {
    try {
      const a = document.createElement('a');
      a.href = data;
      a.download = `asset-qr-${Date.now()}.${options.format}`;
      a.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleSendToLaser = () => {
    alert('QR code sent to laser marking system (feature stub).');
  };

  return (
    <div className="qr-actions">
      <button onClick={handleDownload} className="md-button">
        <span className="material-icons-round">download</span>
        Download QR Code
      </button>
      <button onClick={handleSendToLaser} className="md-button secondary">
        <span className="material-icons-round">flash_on</span>
        Send to Laser
      </button>
    </div>
  );
};

export default QRActions;
