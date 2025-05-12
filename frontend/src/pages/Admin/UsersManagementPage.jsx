import { useState, useEffect } from 'react';
//import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './AdminPages.css';

export default function UsersManagementPage() {
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          console.error('Users API error:', response.status);
          
          // Use mock data if API fails in development
          if (import.meta.env.DEV) {
            const mockUsers = [
              {
                _id: '1',
                email: 'admin@telemedicine.com',
                profile: { 
                  firstName: 'Admin', 
                  lastName: 'User',
                  fullName: 'Admin User'
                },
                role: 'admin',
                status: 'active',
                createdAt: new Date().toISOString()
              },
              {
                _id: '2',
                email: 'doctor@telemedicine.com',
                profile: { 
                  firstName: 'Sample', 
                  lastName: 'Doctor',
                  fullName: 'Sample Doctor'
                },
                role: 'doctor',
                status: 'active',
                createdAt: new Date().toISOString()
              },
              {
                _id: '3',
                email: 'patient@telemedicine.com',
                profile: { 
                  firstName: 'Sample', 
                  lastName: 'Patient',
                  fullName: 'Sample Patient'
                },
                role: 'patient',
                status: 'active',
                createdAt: new Date().toISOString()
              }
            ];
            setUsers(mockUsers);
            addNotification('Using mock data - API returned an error', 'warning');
            return;
          }
          
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        // Check if the data is structured with a users property (pagination)
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('Unexpected API response format:', data);
          throw new Error('Unexpected API response format');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        addNotification(`Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [addNotification]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user => {
    // Apply role filter
    if (filter !== 'all' && user.role !== filter) return false;
    
    // Apply search filter
    if (searchTerm) {
      const email = user.email.toLowerCase();
      const firstName = user.profile?.firstName?.toLowerCase() || '';
      const lastName = user.profile?.lastName?.toLowerCase() || '';
      const fullName = user.profile?.fullName?.toLowerCase() || `${firstName} ${lastName}`.trim();
      
      if (!email.includes(searchTerm.toLowerCase()) && 
          !fullName.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update the local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));

      addNotification('User status updated successfully', 'success');
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page users-management-page">
      <h1>Users Management</h1>
      
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-dropdown">
          <select value={filter} onChange={handleFilterChange}>
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-results">No users found</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.profile?.fullName || (user.profile?.firstName && user.profile?.lastName) 
                       ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() 
                       : 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {user.status === 'active' ? (
                        <button 
                          className="btn-sm danger" 
                          onClick={() => handleStatusChange(user._id, 'suspended')}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button 
                          className="btn-sm success" 
                          onClick={() => handleStatusChange(user._id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                      <button className="btn-sm">Edit</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
