import React, { useState, useEffect } from 'react';
import QRConfiguration from './QRConfiguration';
import QRPreview from './QRPreview';
import QRActions from './QRActions';
import { api } from '../../services/api';
import './QRGenerator.css';

const QRGenerator = () => {
  const [assetList, setAssetList] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [qrOptions, setQrOptions] = useState({
    errorCorrection: 'M',
    format: 'svg'
  });
  const [qrData, setQrData] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Fetch assets from backend
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets', { credentials: 'include' });
      const data = await response.json();
      
      const normalizedAssets = (data.assets || []).map(asset => ({
        ...asset,
        assetId: asset.asset_id || asset.assetId,
        asset_id: asset.asset_id || asset.assetId,
      }));
      
      setAssetList(normalizedAssets);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setAssetList([]);
    }
  };

  const handleGenerateQR = async () => {
    if (selectedAsset) {
      try {
        const assetId = selectedAsset.assetId || selectedAsset.asset_id;
        const result = await api.qr.generate(assetId, qrOptions);
        
        if (result.qr_url) {
          setQrData(result.qr_url);
          setShowQR(true);
        } else {
          console.error('No QR URL in response');
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        // TODO: Add proper error handling UI
      }
    }
  };

  return (
    <div className="qr-generator-container">
      <div className="page-header">
        <h2 className="page-title">QR Code Generator</h2>
        <p className="page-subtitle">Generate high-quality QR codes with advanced error correction</p>
      </div>

      <div className="qr-generator-grid">
        {/* Configuration Section */}
        <div className="qr-config-section">
          <QRConfiguration
            assetList={assetList}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            qrOptions={qrOptions}
            setQrOptions={setQrOptions}
          />
          
          {/* Generate Button */}
          <button
            onClick={handleGenerateQR}
            disabled={!selectedAsset}
            className="generate-qr-button md-button"
          >
            <span className="material-icons-round">qr_code</span>
            Generate QR Code
          </button>
        </div>

        {/* Preview Section */}
        <div className="qr-preview-section">
          <QRPreview
            data={qrData}
            options={qrOptions}
            showQR={showQR}
          />
          
          {showQR && qrData && (
            <QRActions
              data={qrData}
              options={qrOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
