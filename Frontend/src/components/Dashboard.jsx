import React, { useState, useEffect } from 'react';
import Header from './Header';
import AssetList from './Assets/AssetList';
import QRGenerator from './QRGenerator/QRGenerator';
import ReportsTab from './Reports/ReportsTab';
import AdminPanel from './Admin/AdminPanel';
import MaintenanceTab from './Maintenance/MaintenanceTab';


const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('assets');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role-based permissions
  const PERMISSIONS = {
    admin: {
      tabs: ['assets', 'qr-generator', 'maintenance', 'reports', 'admin-panel'],
      canAddAsset: true,
      canDeleteAsset: true,
      canGenerateQR: true
    },
    manufacturer: {
      tabs: ['assets', 'qr-generator'],
      canAddAsset: true,
      canDeleteAsset: false,
      canGenerateQR: true
    },
    worker: {
      tabs: ['maintenance'],
      canAddAsset: false,
      canDeleteAsset: false,
      canGenerateQR: false
    },
    engineer: {
      tabs: ['maintenance', 'assets', 'reports'],
      canAddAsset: false,
      canDeleteAsset: true,
      canGenerateQR: false
    }
  };

  const userPermissions = PERMISSIONS[user.role] || PERMISSIONS.worker;

  useEffect(() => {
    // Set first allowed tab as active
    if (userPermissions.tabs.length > 0) {
      setActiveTab(userPermissions.tabs[0]);
    }
  }, [user.role]);

  const handleTabChange = (tabId) => {
    if (userPermissions.tabs.includes(tabId)) {
      setActiveTab(tabId);
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assets':
        return <AssetList permissions={userPermissions} />;
      case 'qr-generator':
        return <QRGenerator />;
      case 'maintenance':
        return <MaintenanceTab user={user} />;
      case 'reports':
        return <ReportsTab />;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return <AssetList permissions={userPermissions} />;
    }
  };

  return (
    <div id="mainApp">
      <Header
        user={user}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        allowedTabs={userPermissions.tabs}
      />

      <main className="main-content">
        <div className="container">
          <div className="content-section">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
