import React from 'react';
import './AssetSearch.css';

const AssetSearch = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="asset-search-container">
      <div className="search-field">
        <span className="material-icons-round search-icon">search</span>
        <input
          type="text"
          placeholder="Search by Asset ID, Type, Manufacturer, or Status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            className="clear-button"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <span className="material-icons-round">close</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AssetSearch;
