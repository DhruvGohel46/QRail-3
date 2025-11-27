import React from 'react';
import './QRGenerator.css';

const QRConfiguration = ({ assetList, selectedAsset, setSelectedAsset, qrOptions, setQrOptions }) => {
  const handleAssetChange = (e) => {
    const assetId = e.target.value;
    if (assetId === '') {
      setSelectedAsset(null);
      return;
    }
    
    const asset = assetList.find(a => 
      (a.assetId || a.asset_id).toString() === assetId.toString()
    );
    setSelectedAsset(asset || null);
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setQrOptions(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="md-card qr-config-card">
      <div className="card-header">
        <span className="material-icons-round card-icon">settings</span>
        <h3>Configuration</h3>
      </div>

      <div className="qr-config-form">
        {/* Asset Selection */}
        <div className="md-text-field">
          <label>Select Asset</label>
          <select
            value={selectedAsset ? (selectedAsset.assetId || selectedAsset.asset_id) : ''}
            onChange={handleAssetChange}
            className="asset-select"
          >
            <option value="">Choose an asset...</option>
            {assetList.map((asset) => (
              <option
                key={asset.assetId || asset.asset_id}
                value={asset.assetId || asset.asset_id}
              >
                {asset.assetId || asset.asset_id} - {asset.type}
              </option>
            ))}
          </select>
        </div>

        {/* Output Format */}
        <div className="md-text-field">
          <label>Output Format</label>
          <select
            name="format"
            value={qrOptions.format}
            onChange={handleOptionChange}
          >
            <option value="png">PNG (Preview)</option>
            <option value="svg">SVG (Laser)</option>
            <option value="pdf">PDF (Document)</option>
          </select>
        </div>

        {/* Selected Asset Info */}
        {selectedAsset && (
          <div className="selected-asset-info">
            <h4>Selected Asset Details</h4>
            <div className="asset-detail-row">
              <span className="detail-label">Asset ID:</span>
              <span className="detail-value">{selectedAsset.assetId || selectedAsset.asset_id}</span>
            </div>
            <div className="asset-detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedAsset.type}</span>
            </div>
            <div className="asset-detail-row">
              <span className="detail-label">Manufacturer:</span>
              <span className="detail-value">{selectedAsset.manufacturer || selectedAsset.manufacturer_id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRConfiguration;
