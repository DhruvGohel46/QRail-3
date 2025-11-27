import React from 'react';
import './Header.css';

const Header = ({ user, onLogout, mobileMenuOpen, toggleMobileMenu, activeTab, onTabChange, allowedTabs = [] }) => {
  const navItems = [
    { id: 'assets', icon: 'inventory', label: 'Asset Management' },
    { id: 'qr-generator', icon: 'qr_code', label: 'QR Generation' },
    { id: 'maintenance', icon: 'build', label: 'Maintenance' },
    { id: 'reports', icon: 'analytics', label: 'Reports & Analytics' },
    { id: 'admin-panel', icon: 'admin_panel_settings', label: 'Admin Panel' }
  ];
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo/Brand Section */}
        <div className="header-brand">
          <div className="app-icon">
            <span className="material-icons-round">train</span>
          </div>
          <div className="header-text">
            <h1>QRail</h1>
            <p>Smart Asset Management Platform</p>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="nav-container">
          <nav className={`navbar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {navItems
              .filter(item => allowedTabs.includes(item.id))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  id={`nav-${item.id}`}
                  title={item.label}
                >
                  <span className="material-icons-round">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </button>
              ))}
          </nav>
        </div>

        {/* Right Side - User Info & Actions */}
        <div className="header-actions">
          <div className="user-info">
            <span className="user-name">{user?.name || user?.username || 'Guest'}</span>
            <span className="user-role">
              {user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User'}
            </span>
          </div>
          
          <button className="logout-button" onClick={onLogout} title="Logout">
            <span className="material-icons-round">logout</span>
          </button>

          {/* Mobile Menu Toggle */}
          <div 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
