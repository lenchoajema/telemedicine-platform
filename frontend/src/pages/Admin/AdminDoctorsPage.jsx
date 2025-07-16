import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import apiClient from '../../api/apiClient';
import './AdminPages.css';

export default function AdminDoctorsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verified, pending, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      console.log('Fetching doctors for admin...');
      const response = await apiClient.get('/doctors');
      console.log('Admin doctors API response:', response);
      
      // Handle different response formats
      let doctorsArray = [];
      if (Array.isArray(response)) {
        doctorsArray = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        doctorsArray = response.data;
      } else if (response && Array.isArray(response.data)) {
        doctorsArray = response.data;
      }
      
      console.log('Processed doctors array for admin:', doctorsArray);
      setDoctors(doctorsArray);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      addNotification('Failed to load doctors', 'error');
      setDoctors([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const updateDoctorStatus = async (doctorId, status) => {
    try {
      await apiClient.put(`/admin/doctors/${doctorId}/status`, { status });
      addNotification(`Doctor ${status} successfully`, 'success');
      fetchDoctors(); // Refresh the list
    } catch (error) {
      addNotification('Failed to update doctor status', 'error');
    }
  };

  const filteredDoctors = Array.isArray(doctors) ? doctors.filter(doctor => {
    const matchesSearch = !searchTerm || 
      `${doctor.user?.profile?.firstName} ${doctor.user?.profile?.lastName}`
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = !specialtyFilter || doctor.specialization === specialtyFilter;
    
    const matchesStatus = filter === 'all' || doctor.verificationStatus === filter;

    return matchesSearch && matchesSpecialty && matchesStatus;
  }) : [];

  const specialties = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner"></div>
        <p>Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Doctor Management</h1>
        <p>Manage doctor accounts and verifications</p>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Doctors</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Verification</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
            <option value="">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>{doctors.filter(d => d.verificationStatus === 'verified').length}</h3>
          <p>Verified Doctors</p>
        </div>
        <div className="stat-card">
          <h3>{doctors.filter(d => d.verificationStatus === 'pending').length}</h3>
          <p>Pending Verification</p>
        </div>
        <div className="stat-card">
          <h3>{doctors.length}</h3>
          <p>Total Doctors</p>
        </div>
      </div>

      <div className="doctors-table">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialization</th>
              <th>License</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map(doctor => (
              <tr key={doctor._id}>
                <td>
                  <div className="doctor-info">
                    <img 
                      src={doctor.user?.profile?.photo || '/default-doctor.png'} 
                      alt="Doctor"
                      className="doctor-avatar"
                    />
                    <div>
                      <div className="doctor-name">
                        {doctor.user?.profile?.firstName} {doctor.user?.profile?.lastName}
                      </div>
                      <div className="doctor-email">{doctor.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td>{doctor.specialization || 'Not specified'}</td>
                <td>{doctor.licenseNumber || 'Not provided'}</td>
                <td>
                  <span className={`status-badge ${doctor.verificationStatus || 'pending'}`}>
                    {doctor.verificationStatus || 'pending'}
                  </span>
                </td>
                <td>
                  {new Date(doctor.user?.createdAt || doctor.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div className="action-buttons">
                    {doctor.verificationStatus !== 'verified' && (
                      <button 
                        className="btn btn-success"
                        onClick={() => updateDoctorStatus(doctor._id, 'verified')}
                      >
                        Verify
                      </button>
                    )}
                    {doctor.verificationStatus !== 'rejected' && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => updateDoctorStatus(doctor._id, 'rejected')}
                      >
                        Reject
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary"
                      onClick={() => window.open(`/doctors/${doctor._id}`, '_blank')}
                    >
                      View Profile
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDoctors.length === 0 && (
          <div className="empty-state">
            <p>No doctors found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
