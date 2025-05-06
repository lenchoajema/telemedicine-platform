import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import VerificationStatus from '../../components/doctors/VerificationStatus';
import './VerificationReviewPage.css';

export default function VerificationReviewPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { doctorId } = useParams();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  
  // Fetch all pending verifications
  useEffect(() => {
    const fetchPendingVerifications = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/verifications/pending`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPendingList(data);
        }
      } catch (error) {
        console.error('Error fetching pending verifications:', error);
      }
    };
    
    fetchPendingVerifications();
  }, []);
  
  // Fetch specific doctor details if ID is provided
  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/verifications/${doctorId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
        } else {
          addNotification('Failed to fetch doctor details', 'error');
        }
      } catch (error) {
        console.error('Error fetching doctor details:', error);
        addNotification('Error fetching doctor details', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorDetails();
  }, [doctorId, addNotification]);
  
  const handleApprove = async () => {
    await updateVerificationStatus('approve');
  };
  
  const handleReject = async () => {
    if (!notes.trim()) {
      addNotification('Please provide rejection reason in the notes', 'error');
      return;
    }
    await updateVerificationStatus('reject');
  };
  
  const updateVerificationStatus = async (action) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/verifications/${doctorId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        addNotification(`Doctor verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
        
        // Remove from pending list
        setPendingList(pendingList.filter(item => item._id !== doctorId));
        
        // Redirect to pending list
        navigate('/admin/verifications');
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} verification`);
      }
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
      addNotification(error.message || `Error ${action}ing verification`, 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="verification-review-page">
        <div className="unauthorized-message">
          <h2>Unauthorized Access</h2>
          <p>You must be an admin to view this page.</p>
          <Link to="/" className="btn-back">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="verification-review-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="verification-review-page">
      <div className="verification-review-container">
        <h1>Doctor Verification Review</h1>
        
        {!doctorId ? (
          <div className="pending-verifications-list">
            <h2>Pending Verifications</h2>
            {pendingList.length === 0 ? (
              <p className="no-items">No pending verification requests</p>
            ) : (
              <ul className="pending-list">
                {pendingList.map(item => (
                  <li key={item._id} className="pending-list-item">
                    <div className="doctor-basic-info">
                      <h3>
                        Dr. {item.user?.profile?.firstName} {item.user?.profile?.lastName}
                      </h3>
                      <p>{item.specialization}</p>
                      <p className="submitted-date">
                        Submitted: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/admin/verifications/${item._id}`} className="btn-view-details">
                      Review Request
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          doctor && (
            <div className="doctor-verification-details">
              <div className="verification-header">
                <div className="doctor-info">
                  <h2>Dr. {doctor.user?.profile?.firstName} {doctor.user?.profile?.lastName}</h2>
                  <p className="doctor-email">{doctor.user?.email}</p>
                  <VerificationStatus status={doctor.verificationStatus} />
                </div>
                <Link to="/admin/verifications" className="btn-back">Back to List</Link>
              </div>
              
              <div className="detail-section">
                <h3>Professional Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Specialization</span>
                    <span className="detail-value">{doctor.specialization}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">License Number</span>
                    <span className="detail-value">{doctor.licenseNumber}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Education</h3>
                {doctor.education && doctor.education.length > 0 ? (
                  <ul className="education-list">
                    {doctor.education.map((edu, index) => (
                      <li key={index} className="education-item">
                        <div className="education-degree">{edu.degree}</div>
                        <div className="education-institution">{edu.institution}</div>
                        <div className="education-year">{edu.year}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-items">No education information provided</p>
                )}
              </div>
              
              <div className="detail-section">
                <h3>Experience</h3>
                {doctor.experience && doctor.experience.length > 0 ? (
                  <ul className="experience-list">
                    {doctor.experience.map((exp, index) => (
                      <li key={index} className="experience-item">
                        <div className="experience-position">{exp.position}</div>
                        <div className="experience-hospital">{exp.hospital}</div>
                        <div className="experience-period">
                          {exp.startYear} - {exp.endYear}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-items">No experience information provided</p>
                )}
              </div>
              
              <div className="detail-section">
                <h3>Verification Documents</h3>
                {doctor.verificationDocuments && doctor.verificationDocuments.length > 0 ? (
                  <ul className="document-list">
                    {doctor.verificationDocuments.map((doc, index) => (
                      <li key={index} className="document-item">
                        <div className="document-type">
                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        </div>
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="document-link"
                        >
                          View Document
                        </a>
                        <div className="document-date">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-items">No documents uploaded</p>
                )}
              </div>
              
              <div className="detail-section">
                <h3>Review Notes</h3>
                <textarea
                  className="review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your review notes here (required for rejection)"
                  rows={4}
                />
              </div>
              
              <div className="verification-actions">
                <button 
                  className="btn-reject" 
                  onClick={handleReject}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Reject Verification'}
                </button>
                <button 
                  className="btn-approve" 
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Approve Verification'}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
