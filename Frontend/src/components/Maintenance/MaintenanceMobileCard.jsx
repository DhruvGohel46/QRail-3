import React from 'react';

const MaintenanceMobileCard = ({ record }) => {
  return (
    <div className="maintenance-mobile-card">
      <div className="card-header">
        <h3>{record.assetName || `Asset ${record.assetId}`}</h3>
        <span className={`status-badge ${record.status}`}>
          {record.status}
        </span>
      </div>
      <div className="card-details">
        <p><strong>Record ID:</strong> {record.id}</p>
        <p><strong>Asset ID:</strong> {record.assetId}</p>
        <p><strong>Description:</strong> {record.description}</p>
        <p><strong>Performed By:</strong> {record.performedBy}</p>
        <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default MaintenanceMobileCard;
