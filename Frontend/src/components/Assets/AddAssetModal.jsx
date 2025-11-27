import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AddAssetModal.css';

const AddAssetModal = ({ isOpen, onClose, asset, onSave }) => {
  const [formData, setFormData] = useState({
    type: '',
    manufacturer: '',
    mfg_date: '',
    inst_date: '',
    status: 'Manufactured',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (asset) {
      // Debug log to see incoming asset data
      console.log('Editing asset:', asset);
      
      // Format dates to YYYY-MM-DD format for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        type: asset.type || '',
        manufacturer: asset.manufacturer_id || asset.manufacturerId || asset.manufacturer || '',
        mfg_date: formatDateForInput(asset.mfg_date || asset.mfgDate),
        inst_date: formatDateForInput(asset.inst_date || asset.instDate),
        status: asset.status || 'Manufactured',
      });
    } else {
      setFormData({
        type: '',
        manufacturer: '',
        mfg_date: '',
        inst_date: '',
        status: 'Manufactured',
      });
    }
  }, [asset]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.type || !formData.manufacturer.trim() || !formData.mfg_date) {
      setError('Type, Manufacturer ID, and Manufacturing Date are required');
      return;
    }

    setLoading(true);
    try {
      // Transform data to match API expectations
      const apiData = {
        type: formData.type,
        manufacturer_id: formData.manufacturer,
        manufacturing_date: formData.mfg_date,
        installation_date: formData.inst_date || null,
        status: formData.status
      };

      console.log('Submitting data:', apiData); // Debug log

      const assetId = asset ? (asset.assetId || asset.asset_id) : null;
      const result = assetId
        ? await api.assets.update(assetId, apiData)
        : await api.assets.create(apiData);

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save asset');
      }
    } catch (err) {
      setError('Error saving asset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal ${isOpen ? 'show' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="material-icons-round">
            {asset ? 'edit' : 'add_circle'}
          </span>
          <h3>{asset ? 'Edit Asset' : 'Add New Asset'}</h3>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Type Select Dropdown */}
          <div className="md-text-field">
            <label>Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="track">Track</option>
              <option value="sleeper">Sleeper</option>
            </select>
          </div>

          {/* Manufacturer ID */}
          <div className="md-text-field">
            <label>Manufacturer ID</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              placeholder="MFG-789"
              required
            />
          </div>

          {/* Manufacturing Date */}
          <div className="md-text-field">
            <label>Manufacturing Date</label>
            <input
              type="date"
              name="mfg_date"
              value={formData.mfg_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Installation Date (Optional) */}
          <div className="md-text-field">
            <label>Installation Date (Optional)</label>
            <input
              type="date"
              name="inst_date"
              value={formData.inst_date}
              onChange={handleChange}
            />
          </div>

          {/* Status Dropdown */}
          <div className="md-text-field">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="Manufactured">Manufactured</option>
              <option value="Installed">Installed</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message" style={{ 
              color: 'var(--md-sys-color-error)', 
              marginTop: '12px',
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="md-button outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="md-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : asset ? 'Update Asset' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
