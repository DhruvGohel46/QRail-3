import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import MaintenanceInput from './MaintenanceInput';
import api from '../../services/api';
import './MaintenanceTab.css';

const MaintenanceTab = ({ user }) => {
  const [view, setView] = useState('scanner');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenanceType: 'General',
    operator: user?.username || '',
    description: '',
    status: 'completed',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadMaintenanceRecords();
  }, []);

  const loadMaintenanceRecords = async () => {
    try {
      const data = await api.maintenance.getAll();
      if (data.success) {
        setMaintenanceRecords(data.records || []);
      }
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
    }
  };

  const handleStartScan = () => {
    setShowScanner(true);
  };

  const handleScanComplete = async (assetId) => {
    try {
      console.log('Scan complete with asset ID:', assetId);
      
      setShowScanner(false);
      
      const response = await api.assets.getAll();
      const asset = response.assets.find(a => a.asset_id === assetId || a.assetId === assetId);
      
      if (!asset) {
        throw new Error('Asset not found');
      }
      
      setFormData(prev => ({
        ...prev,
        asset_id: asset.asset_id || asset.assetId,
        maintenanceType: 'General',
        date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'completed',
        operator: user?.username || ''
      }));
      
      setScannedAsset(asset);
      setView('form');
      
      console.log('Successfully loaded asset and switched to form view');
      
    } catch (error) {
      console.error('Error handling QR scan:', error);
      alert('Error: Unable to find asset details. Please try scanning again.');
      setScannedAsset(null);
      setFormData(prev => ({
        ...prev,
        assetId: '',
        description: ''
      }));
      setView('scanner');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // NEW: Handler for MaintenanceInput component
  const handleDescriptionUpdate = (newDescription) => {
    setFormData(prev => ({
      ...prev,
      description: newDescription
    }));
  };

  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    
    if (!scannedAsset) {
      alert('Please scan a QR code first');
      return;
    }

    try {
      const payload = {
        asset_id: scannedAsset.asset_id || scannedAsset.aid,
        maintenanceType: formData.maintenanceType,
        description: formData.description,
        status: formData.status,
        date: formData.date,
        performedBy: user?.username || 'Unknown'
      };

      const result = await api.maintenance.create(payload);
      
      if (result.success) {
        alert('Maintenance record saved successfully!');
        
        setFormData({
          asset_id: '',
          maintenanceType: 'General',
          operator: user?.username || '',
          description: '',
          status: 'completed',
          date: new Date().toISOString().split('T')[0]
        });
        setScannedAsset(null);
        setView('scanner');
        loadMaintenanceRecords();
      } else {
        alert('Error: ' + (result.error || 'Failed to save'));
      }
    } catch (error) {
      console.error('Maintenance submission error:', error);
      alert('Error submitting maintenance record');
    }
  };

  const cancelForm = () => {
    setScannedAsset(null);
    setView('scanner');
    setFormData({
      asset_id: '',
      maintenanceType: 'General',
      operator: user?.username || '',
      description: '',
      status: 'completed',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="maintenance-tab-container">
      <div className="page-header">
        <h2 className="page-title">Maintenance Records</h2>
        <p className="page-subtitle">Track and manage asset maintenance history</p>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleScanComplete}
      />

      {view === 'form' && scannedAsset && (
        <div className="md-card maintenance-form-card">
          <div className="card-header">
            <span className="material-icons-round card-icon">build</span>
            <h3>Add Maintenance Record</h3>
          </div>

          {/* Maintenance Form */}
          <form onSubmit={handleSubmitMaintenance} className="maintenance-form">
            <div className="form-grid">
              <div className="md-text-field">
                <label>Asset ID</label>
                <input
                  type="text"
                  name="asset_id"
                  value={scannedAsset?.asset_id || scannedAsset?.aid}
                  disabled
                  required
                />
              </div>

              <div className="md-text-field">
                <label>Maintenance Type</label>
                <select
                  name="maintenanceType"
                  value={formData.maintenanceType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Routine Maintenance">Routine Maintenance</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Repair">Repair</option>
                  <option value="Replacement">Replacement</option>
                </select>
              </div>

              <div className="md-text-field">
                <label>Operator</label>
                <input
                  type="text"
                  name="operator"
                  value={formData.operator}
                  onChange={handleInputChange}
                  placeholder="Enter operator name"
                  required
                />
              </div>

              <div className="md-text-field">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* NEW: MaintenanceInput Component Integration */}
              <div className="md-text-field" style={{ gridColumn: '1 / -1' }}>
                <MaintenanceInput 
                  onSubmit={handleDescriptionUpdate}
                  initialValue={formData.description}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="md-button">
                <span className="material-icons-round">save</span>
                Save Record
              </button>
              <button type="button" onClick={cancelForm} className="md-button secondary">
                <span className="material-icons-round">close</span>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions" style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginBottom: '16px' 
      }}>
        <button 
          onClick={handleStartScan} 
          className="md-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#1976D2',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span className="material-icons-round" style={{ fontSize: '20px' }}>qr_code_scanner</span>
          Scan QR Code
        </button>
      </div>

      {/* Maintenance Records Table */}
      <div className="md-card records-card">
        <div className="card-header">
          <span className="material-icons-round card-icon">history</span>
          <h3>Recent Maintenance Records</h3>
        </div>

        <div className="table-container">
          <table className="md-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Operator</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No maintenance records found
                  </td>
                </tr>
              ) : (
                maintenanceRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{record.asset_id}</td>
                    <td>{record.date}</td>
                    <td>{record.maintenance_type}</td>
                    <td>{record.operator}</td>
                    <td className="description-cell">{record.description}</td>
                    <td>
                      <span className={`md-badge ${record.status === 'completed' ? 'success' : 'warning'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTab;
