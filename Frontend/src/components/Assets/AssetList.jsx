import React, { useState, useEffect } from 'react';
import AssetSearch from './AssetSearch';
import AssetTable from './AssetTable';
import './AssetList.css';
import AssetMobileCard from './AssetMobileCard';
import AddAssetModal from './AddAssetModal';

const AssetList = ({ permissions }) => {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  // Fetch assets from backend API
  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets', { credentials: 'include' });
      const data = await response.json();

      // Normalize asset data: convert snake_case to camelCase for consistency
      const normalizedAssets = (data.assets || []).map(asset => ({
        ...asset,
        assetId: asset.asset_id || asset.assetId,
        asset_id: asset.asset_id || asset.assetId,
        mfgDate: asset.manufacturing_date || asset.mfg_date || asset.mfgDate,
        manufacturer: asset.manufacturer,
        type: asset.type,
        status: asset.status,
        hasQR: asset.hasQR || asset.has_qr || false,
      }));

      setAssets(normalizedAssets);
      setFilteredAssets(normalizedAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
      setAssets([]);
      setFilteredAssets([]);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Enhanced filter - search across Asset ID, Type, Manufacturer, and Status
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAssets(assets);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredAssets(
        assets.filter(asset => {
          const assetId = (asset.assetId || asset.asset_id || '').toString().toLowerCase();
          const type = (asset.type || '').toLowerCase();
          const manufacturer = (asset.manufacturer || asset.manufacturer_id || asset.manufacturerId || '').toString().toLowerCase();
          const status = (asset.status || '').toLowerCase();
          
          return (
            assetId.includes(lower) ||
            type.includes(lower) ||
            manufacturer.includes(lower) ||
            status.includes(lower)
          );
        })
      );
    }
  }, [searchTerm, assets]);

  const openAddModal = () => {
    setEditAsset(null);
    setShowAddModal(true);
  };

  const openEditModal = (asset) => {
    setEditAsset(asset);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditAsset(null);
  };

  const onSaveAsset = () => {
    fetchAssets();
    closeModal();
  };

  return (
    <div className="asset-list-container">
      <div className="page-header flex justify-between items-center mobile-stack">
        <div className="header-content flex-col gap-8">
          <h2 className="page-title">Asset Management</h2>
          <p className="page-subtitle hide-mobile">Manage your railway assets with intelligent tracking</p>
        </div>
        {permissions && permissions.canAddAsset && (
          <button onClick={openAddModal} className="md-button add-asset-btn mobile-full-width">
            <span className="material-icons-round">add</span>
            Add New Asset
          </button>
        )}
      </div>

      <div className="card p-24 p-tablet-20 p-mobile-16">
        <div className="flex-col gap-24 mobile-gap-16">
          <AssetSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          
          {/* Results count */}
          {searchTerm && (
            <div className="search-results-info">
              <p className="results-count">
                Found <strong>{filteredAssets.length}</strong> asset{filteredAssets.length !== 1 ? 's' : ''} 
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          )}

          <div className="table-container">
            <AssetTable
              assets={filteredAssets}
              onEdit={openEditModal}
              canDelete={permissions?.canDeleteAsset}
            />
          </div>
        </div>
      </div>

      <AddAssetModal
        isOpen={showAddModal}
        asset={editAsset}
        onClose={closeModal}
        onSave={onSaveAsset}
      />
    </div>
  );
};

export default AssetList;
