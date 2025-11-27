import React from 'react';

const MobileMenuToggle = ({ isOpen, onToggle }) => {
  return (
    <div 
      className={`mobile-menu-toggle ${isOpen ? 'active' : ''}`}
      onClick={onToggle}
      role="button"
      aria-label="Toggle menu"
      aria-expanded={isOpen}
    >
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
    </div>
  );
};

export default MobileMenuToggle;

// Add to your CSS:
/*
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s ease;
}

.hamburger-line {
  width: 24px;
  height: 2px;
  background-color: var(--md-sys-color-on-primary);
  transition: all 0.3s ease;
  border-radius: 2px;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.mobile-menu-toggle.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: flex;
  }
}
*/
