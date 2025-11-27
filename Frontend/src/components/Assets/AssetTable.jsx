import React from 'react';
import AssetActions from './AssetActions';
import './AssetTable.css';

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

const AssetTable = ({ assets, onEdit, canDelete }) => {
  return (
    <>
      {/* Desktop/Tablet View */}
      <table className="md-table">
        <thead>
          <tr>
            <th>Asset ID</th>
            <th>Type</th>
            <th>Manufacturer</th>
            <th>Mfg Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.length > 0 ? assets.map(asset => {
            const assetId = asset.assetId || asset.asset_id;
            const mfgDate = asset.mfgDate || asset.mfg_date;
            const manufacturerId = asset.manufacturer_id || asset.manufacturerId || asset.manufacturer;
            
            return (
              <tr key={assetId}>
                <td>{assetId}</td>
                <td>{asset.type}</td>
                <td>{manufacturerId}</td>
                <td>{formatDate(mfgDate)}</td>
                <td><span className={`md-badge ${getStatusColor(asset.status)}`}>{asset.status}</span></td>
                <td>
                  <AssetActions asset={asset} onEdit={onEdit} canDelete={canDelete} />
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="6">
                <div className="empty-state">
                  <span className="material-icons-round">inventory_2</span>
                  <p>No assets found.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Mobile View */}
      <div className="mobile-table-container">
        {assets.length > 0 ? (
          assets.map(asset => {
            const assetId = asset.assetId || asset.asset_id;
            const mfgDate = asset.mfgDate || asset.mfg_date;
            const manufacturerId = asset.manufacturer_id || asset.manufacturerId || asset.manufacturer;

            return (
              <div key={assetId} className="mobile-table-card">
                <div className="mobile-card-header">
                  <h3 className="mobile-card-title">Asset {assetId}</h3>
                  <span className={`md-badge ${getStatusColor(asset.status)}`}>{asset.status}</span>
                </div>
                
                <div className="mobile-card-details">
                  <div className="mobile-detail-row">
                    <span className="mobile-detail-label">Type</span>
                    <span className="mobile-detail-value">{asset.type}</span>
                  </div>
                  <div className="mobile-detail-row">
                    <span className="mobile-detail-label">Manufacturer</span>
                    <span className="mobile-detail-value">{manufacturerId}</span>
                  </div>
                  <div className="mobile-detail-row">
                    <span className="mobile-detail-label">Mfg Date</span>
                    <span className="mobile-detail-value">{formatDate(mfgDate)}</span>
                  </div>
                </div>

                <div className="mobile-card-actions">
                  <button
                    className="mobile-action-btn"
                    onClick={() => onEdit(asset)}
                  >
                    <span className="material-icons-round">edit</span>
                    Edit
                  </button>
                  {canDelete && (
                    <button
                      className="mobile-action-btn danger"
                      onClick={() => console.log('Delete', assetId)}
                    >
                      <span className="material-icons-round">delete</span>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <span className="material-icons-round">inventory_2</span>
            <p>No assets found.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AssetTable;