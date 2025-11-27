import React from 'react';
import ApprovalActions from './ApprovalActions';

const PendingUsersTable = ({ users, onUpdate }) => {
  return (
    <div className="pending-users-table-container">
      <table className="pending-users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.role}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <ApprovalActions 
                  user={user} 
                  onUpdate={onUpdate}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="pending-users-mobile">
        {users.map(user => (
          <div key={user.username} className="pending-user-card">
            <div className="card-header">
              <h3>{user.name}</h3>
              <span className={`role-badge ${user.role}`}>
                {user.role}
              </span>
            </div>
            <div className="card-details">
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            <ApprovalActions 
              user={user} 
              onUpdate={onUpdate}
              mobile
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingUsersTable;
