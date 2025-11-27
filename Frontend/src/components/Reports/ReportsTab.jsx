import React, { useEffect, useState } from 'react';
import StatsGrid from './StatsGrid';
import ExportOptions from './ExportOptions';
import api from '../../services/api';
import './ReportsTab.css';

const ReportsTab = () => {
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    maintenanceRecords: 0,
    users: 0,
    scannedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch report stats from backend
    api.reports.getStats()
      .then(data => {
        setStats(data.stats || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="reports-tab">
      <h2>Reports & Analytics</h2>
      {loading ? (
        <div>Loading stats...</div>
      ) : (
        <StatsGrid stats={stats} />
      )}
      <ExportOptions />
    </div>
  );
};

export default ReportsTab;
