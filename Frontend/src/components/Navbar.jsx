import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ activeTab, onTabChange, allowedTabs }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'assets', icon: 'inventory', label: 'Asset Management' },
    { id: 'qr-generator', icon: 'qr_code', label: 'QR Generation' },
    { id: 'maintenance', icon: 'build', label: 'Maintenance' },
    { id: 'reports', icon: 'analytics', label: 'Reports & Analytics' },
    { id: 'admin-panel', icon: 'admin_panel_settings', label: 'Admin Panel' }
  ];

  const toggleMobileMenu = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/logo192.png" alt="QRail" className="nav-logo" />
          <span className="nav-title">QRail</span>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          {navItems
            .filter(item => allowedTabs.includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                id={`nav-${item.id}`}
              >
                <span className="material-icons-round">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </button>
            ))}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="material-icons-round">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      <div 
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-nav-links">
          {navItems
            .filter(item => allowedTabs.includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`mobile-nav-link ${activeTab === item.id ? 'active' : ''}`}
              >
                <span className="material-icons-round">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
