import React from 'react';
import api from '../../services/api';
import './AssetActions.css';

const AssetActions = ({ asset, onEdit, canDelete, mobile }) => {
  const handleEdit = () => onEdit(asset);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      const assetId = asset.assetId || asset.asset_id;
      const result = await api.assets.delete(assetId);
      if (result.success) {
        window.location.reload(); // Refresh list after delete
      } else {
        alert('Failed to delete asset: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error deleting asset: ' + error.message);
    }
  };

  return (
    <div className={`asset-actions ${mobile ? 'mobile' : ''}`}>
      <button 
        className="md-icon-button edit" 
        title="Edit Asset"
        onClick={handleEdit}
        aria-label="Edit Asset"
      >
        <span className="material-icons-round">edit</span>
      </button>
      {canDelete && (
        <button 
          className="md-icon-button delete" 
          title="Delete Asset"
          onClick={handleDelete}
          aria-label="Delete Asset"
        >
          <span className="material-icons-round">delete</span>
        </button>
      )}
    </div>
  );
};

export default AssetActions;
