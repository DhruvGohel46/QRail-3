import React from 'react';
import StatsCard from './StatsCard';

const statsMeta = [
  { key: 'totalAssets', label: 'Total Assets' },
  { key: 'activeAssets', label: 'Active Assets' },
  { key: 'maintenanceRecords', label: 'Maintenance Records' },
  { key: 'scannedToday', label: 'Assets Scanned Today' },
];

const StatsGrid = ({ stats }) => (
  <section className="stats-section">
    <div className="stats-grid">
      {statsMeta.map((sm) => (
        <StatsCard
          key={sm.key}
          label={sm.label}
          value={stats[sm.key] ?? 0}
          type={sm.key}
        />
      ))}
    </div>
  </section>
);

export default StatsGrid;
