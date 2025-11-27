import React, { useState } from 'react';
import api from '../../services/api';
import './ExportOptions.css';


const ExportOptions = () => {
  const [loading, setLoading] = useState(false);

  // Function for Excel download
  const handleExcelExport = async () => {
    setLoading(true);
    try {
      const blob = await api.reports.export('excel');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'assets_report.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export Excel: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function for XML download
  const handleXMLExport = async () => {
    setLoading(true);
    try {
      const blob = await api.reports.export('xml');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'assets_report.xml';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export XML: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-options" style={{ marginTop: 24 }}>
      <h3>Export Data</h3>
      <button 
        className="md-button" 
        onClick={handleExcelExport}
        disabled={loading}
      >
        <span className="material-icons-round">download</span> Export as Excel
      </button>
      <button 
        className="md-button outline" 
        onClick={handleXMLExport}
        disabled={loading}
        style={{ marginLeft: 10 }}
      >
        <span className="material-icons-round">download</span> Export as XML
      </button>
    </div>
  );
};

export default ExportOptions;
