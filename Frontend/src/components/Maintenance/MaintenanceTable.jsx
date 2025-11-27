import React from 'react';

const MaintenanceTable = ({ records }) => {
  return (
    <table className="maintenance-table">
      <thead>
        <tr>
          <th>Record ID</th>
          <th>Asset ID</th>
          <th>Description</th>
          <th>Operator Name</th>
          <th>Maintenance Type</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {records.length > 0 ? records.map(record => (
          
          <tr key={record.id}>
            <td>{record.id}</td>
            <td>{record.asset_id}</td>
            <td>{record.description}</td>
            <td>{record.operator}</td>
            <td>{record.maintenance_type}</td>
            <td>{new Date(record.date).toLocaleDateString()}</td>
            <td>
              <span className={`status-badge ${record.status}`}>
                {record.status}
              </span>
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="7" style={{ textAlign: 'center' }}>No maintenance records found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default MaintenanceTable;
