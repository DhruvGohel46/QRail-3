import React from 'react';
import AssetActions from './AssetActions';
import './AssetMobileCard.css';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'maintenance':
      return 'warning';
    case 'retired':
      return 'error';
    case 'installed':
      return 'info';
    default:
      return 'default';
  }
};

const AssetMobileCard = ({ asset, onEdit, canDelete }) => {
  const assetId = asset.assetId || asset.asset_id;
  const mfgDate = asset.manufacturing_date || asset.mfg_date || asset.mfgDate;
  const manufacturerId = asset.manufacturer_id || asset.manufacturerId || asset.manufacturer;

  return (
    <div className="asset-mobile-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">Asset {asset.type || 'Unknown Type'}</h3>
          <span className="card-type">{asset.type || 'Asset'}</span>
        </div>
        <span className={`md-badge ${getStatusColor(asset.status)}`}>
          {asset.status || 'Active'}
        </span>
      </div>
      <div className="card-details">
        <div className="detail-row">
          <span className="detail-label">Asset ID</span>
          <span className="detail-value">{assetId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Manufacturer</span>
          <span className="detail-value">{manufacturerId || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Manufacturing Date</span>
          <span className="detail-value">{formatDate(mfgDate)}</span>
        </div>
      </div>
      <div className="card-actions">
        <AssetActions asset={asset} onEdit={onEdit} canDelete={canDelete} mobile />
      </div>
    </div>
  );
};

export default AssetMobileCard;
