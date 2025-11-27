import React from 'react';
import './QRGenerator.css';

const QRPreview = ({ data, options, showQR }) => {
  const renderFormatMessage = () => {
    if (!options?.format) return null;
    
    const format = options.format.toLowerCase();
    if (format === 'pdf') {
      return (
        <div className="format-message">
          <div>
            <p>After Genration Downlord the QR file for preview</p>
          </div>
        </div>
      );
    } else if (format === 'svg') {
      return (
        <div className="format-message">
          <div>
            <p>After Genration Downlord the QR file for preview</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="md-card qr-preview-card">
      <div className="card-header">
        <span className="material-icons-round card-icon">visibility</span>
        <h3>Generated QR Code</h3>
      </div>

      <div className="qr-preview-container">
        {!showQR ? (
          <div className="qr-empty-state">
            <span className="material-icons-round">qr_code</span>
            <p>Generate a QR code to preview</p>
            <p className="text-sm">Select an asset and click generate</p>
          </div>
        ) : (
          <>
            <div className="qr-canvas-wrapper">
              {(options?.format === 'pdf' || options?.format === 'svg') ? (
                <div className="qr-preview-placeholder">
                  <span className="material-icons-round">
                    {options.format === 'pdf' ? 'picture_as_pdf' : 'code'}
                  </span>
                  <p>After generation, download the QR file for preview</p>
                </div>
              ) : (
                <img src={data} alt="click Generate QR Code" className="qr-preview-image" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRPreview;
