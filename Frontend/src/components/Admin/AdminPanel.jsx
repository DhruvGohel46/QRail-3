import React, { useEffect, useState } from 'react';
import PendingUsersTable from './PendingUsersTable';
import ActiveUsersTable from './ActiveUsersTable';
import CreateAdminForm from './CreateAdminForm';
import api from '../../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'create'

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAllUsers();
      setActiveUsers(data.active_users || []);
      setPendingUsers(data.pending_users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Error loading users: ' + error.message);
      setActiveUsers([]);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleUpdate = () => {
    // Refresh the list after any changes
    fetchAllUsers();
  };

  return (
      <div className="admin-panel">
      <div className="admin-header">
        <h2>
          <span className="material-icons-round">admin_panel_settings</span>
          Admin Management
        </h2>
        <p>Manage users, approve registrations, and create admin accounts</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <span className="material-icons-round">group</span>
          Active Users
          <span className="user-count">{activeUsers.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span className="material-icons-round">pending_actions</span>
          Pending Approvals
          <span className="user-count">{pendingUsers.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <span className="material-icons-round">person_add</span>
          Create Admin
        </button>
      </div>      {/* Tab Content */}
      <div className="admin-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            {activeTab === 'active' && (
              <div className="active-users-section">
                <h3>Active Users</h3>
                {activeUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>No active users found</p>
                  </div>
                ) : (
                  <ActiveUsersTable users={activeUsers} onUpdate={handleUpdate} />
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="pending-users-section">
                <h3>Pending User Registrations</h3>
                {pendingUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>✅ No pending approvals</p>
                  </div>
                ) : (
                  <PendingUsersTable users={pendingUsers} onUpdate={handleUpdate} />
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="create-admin-section">
                <h3>Create New Admin User</h3>
                <CreateAdminForm onSuccess={handleUpdate} />
              </div>
            )}
          </>
        )}
      </div>


    </div>
  );
};

export default AdminPanel;
