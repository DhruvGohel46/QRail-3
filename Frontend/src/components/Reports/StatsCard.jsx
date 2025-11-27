import React, { useEffect, useState } from 'react';
import './StatsGrid.css';

const StatIcon = ({ type }) => {
  // Enhanced icons with more specific representations
  const icons = {
    totalAssets: "inventory_2",
    activeAssets: "check_circle",
    maintenanceRecords: "build_circle",
    users: "group",
    scannedToday: "qr_code_scanner"
  };
  return <span className="material-icons-round">{icons[type] || "analytics"}</span>;
};

const StatsCard = ({ label, value, type }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    // Animate the number counting up
    const duration = 1000; // 1 second animation
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [value]);

  // Format the number with commas for better readability
  const formattedValue = displayValue.toLocaleString();

  return (
    <div className="stats-card">
      <div className="stats-icon">
        <StatIcon type={type} />
      </div>
      <div className="stats-info">
        <div className="stats-value">{formattedValue}</div>
        <div className="stats-label">{label}</div>
      </div>
    </div>
  );
};

export default StatsCard;
