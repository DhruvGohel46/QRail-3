import React, { useState } from 'react';
import api from '../../services/api';

const ApprovalActions = ({ user, onUpdate, mobile }) => {
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!window.confirm(`Approve user "${user.username}" as ${user.role}?`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = await api.admin.approveUser(user.username);
      
      if (result.success) {
        alert(`User "${user.username}" approved successfully!`);
        onUpdate();
      } else {
        alert('Failed to approve user: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error approving user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Reject user "${user.username}"? This cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = await api.admin.rejectUser(user.username);
      
      if (result.success) {
        alert(`User "${user.username}" rejected.`);
        onUpdate();
      } else {
        alert('Failed to reject user: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error rejecting user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`approval-actions ${mobile ? 'mobile' : ''}`}>
      <button 
        className="md-button approve"
        onClick={handleApprove}
        disabled={processing}
        title="Approve User"
      >
        <span className="material-icons-round">check_circle</span>
        {mobile && <span>Approve</span>}
      </button>
      <button 
        className="md-button reject outline"
        onClick={handleReject}
        disabled={processing}
        title="Reject User"
      >
        <span className="material-icons-round">cancel</span>
        {mobile && <span>Reject</span>}
      </button>
    </div>
  );
};

export default ApprovalActions;
