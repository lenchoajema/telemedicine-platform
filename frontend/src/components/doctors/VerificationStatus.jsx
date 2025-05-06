import React from 'react';
import './VerificationStatus.css';

export default function VerificationStatus({ status, size = 'medium', showLabel = true }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          label: 'Verified',
          color: 'green',
          icon: '✓'
        };
      case 'rejected':
        return {
          label: 'Not Verified',
          color: 'red',
          icon: '✕'
        };
      case 'pending':
      default:
        return {
          label: 'Pending Verification',
          color: 'amber',
          icon: '⟳'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const sizeClass = `verification-status-${size}`;

  return (
    <div className="verification-status-container">
      <span className={`verification-status ${sizeClass} ${statusInfo.color}`}>
        <span className="status-icon">{statusInfo.icon}</span>
        {showLabel && <span className="status-label">{statusInfo.label}</span>}
      </span>
    </div>
  );
}
