import React, { useState } from 'react';
import api from '../../services/api';

const ActiveUsersTable = ({ users, onUpdate }) => {
  const [deleting, setDeleting] = useState(null);

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(username);
    try {
      const result = await api.admin.deleteUser(username);
      if (result.success) {
        alert(`User "${username}" deleted successfully!`);
        onUpdate();
      } else {
        alert('Failed to delete user: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#e53e3e',
      manufacturer: '#3182ce',
      engineer: '#38a169',
      worker: '#718096'
    };
    return colors[role] || '#718096';
  };

  return (
    <div className="active-users-table-container">
      {/* Desktop Table */}
      <div className="desktop-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.username}</strong></td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span 
                    className="role-badge" 
                    style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                  >
                    {user.role}
                  </span>
                </td>
                <td>{user.created_date || 'N/A'}</td>
                <td>{user.last_login || 'Never'}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user.username)}
                    disabled={deleting === user.username}
                    className="delete-button"
                  >
                    {deleting === user.username ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card-header">
              <h4>{user.username}</h4>
              <span 
                className="role-badge" 
                style={{ backgroundColor: getRoleBadgeColor(user.role) }}
              >
                {user.role}
              </span>
            </div>
            <div className="user-card-body">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Created:</strong> {user.created_date || 'N/A'}</p>
              <p><strong>Last Login:</strong> {user.last_login || 'Never'}</p>
            </div>
            <div className="user-card-actions">
              <button
                onClick={() => handleDeleteUser(user.username)}
                disabled={deleting === user.username}
                className="delete-button"
              >
                {deleting === user.username ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .active-users-table-container {
          width: 100%;
        }

        .desktop-table {
          display: block;
          overflow-x: auto;
        }

        .mobile-cards {
          display: none;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        th {
          background-color: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }

        tr:hover {
          background-color: #f7fafc;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .delete-button {
          background-color: #fc8181;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.3s;
        }

        .delete-button:hover:not(:disabled) {
          background-color: #f56565;
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .desktop-table {
            display: none;
          }

          .mobile-cards {
            display: block;
          }

          .user-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          }

          .user-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
          }

          .user-card-header h4 {
            margin: 0;
            color: #2d3748;
          }

          .user-card-body p {
            margin: 8px 0;
            color: #4a5568;
          }

          .user-card-actions {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
          }

          .delete-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ActiveUsersTable;
