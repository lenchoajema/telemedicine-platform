import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Key,
  Shield,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import "./AdminUsersManagement.css";

const AdminUsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "patient",
    password: "",
    phone: "",
    specialization: "",
  });
  const [passwordResetData, setPasswordResetData] = useState({
    userId: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    role: "",
    timeZone: "",
    phone: "",
    specialization: "",
  });
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    doctors: 0,
    patients: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/users");
      // Backend returns { users: [...], pagination: {...} }
      if (response.data.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.log("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get("/admin/users/stats");
      // Backend returns { totalUsers, recentUsers, byRole, summary }
      if (response.data) {
        setDashboardStats({
          totalUsers: response.data.totalUsers || 0,
          doctors: response.data.summary?.doctors || 0,
          patients: response.data.summary?.patients || 0,
          admins: response.data.summary?.admins || 0,
        });
      }
    } catch (error) {
      console.log("Error fetching dashboard stats:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/admin/users", formData);
      // Backend returns { message: '...', user: {...} }
      if (response.data.message && response.data.user) {
        await fetchUsers();
        await fetchDashboardStats();
        setShowCreateModal(false);
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          role: "patient",
          password: "",
          phone: "",
          specialization: "",
        });
        setError(null);
      }
    } catch (error) {
      console.log("Error creating user:", error);
      setError(error.response?.data?.error || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        const response = await apiClient.delete(`/admin/users/${userId}`);
        // Backend returns { message: 'User deleted successfully' }
        if (response.data.message) {
          await fetchUsers();
          await fetchDashboardStats();
          setError(null);
        }
      } catch (error) {
        console.log("Error deleting user:", error);
        setError(error.response?.data?.error || "Failed to delete user");
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await apiClient.post(
        `/admin/users/${passwordResetData.userId}/reset-password`,
        {
          newPassword: passwordResetData.newPassword,
        }
      );

      // Backend returns { message: '...', temporaryPassword?: '...' }
      if (response.data.message) {
        setShowPasswordResetModal(false);
        setPasswordResetData({
          userId: "",
          newPassword: "",
          confirmPassword: "",
        });
        setError(null);
        alert("Password reset successfully");
      }
    } catch (error) {
      console.log("Error resetting password:", error);
      setError(error.response?.data?.error || "Failed to reset password");
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await apiClient.put(`/admin/users/${userId}/status`, {
        status: newStatus,
      });

      // Backend returns { message: '...', user: {...} }
      if (response.data.message) {
        await fetchUsers();
        await fetchDashboardStats();
      }
    } catch (error) {
      console.log("Error updating user status:", error);
      setError(error.response?.data?.error || "Failed to update user status");
    }
  };

  const filteredUsers = (users || []).filter((user) => {
    const firstName = user.firstName || user.profile?.firstName || "";
    const lastName = user.lastName || user.profile?.lastName || "";
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${firstName} ${lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="status-icon active" size={16} />;
      case "inactive":
        return <XCircle className="status-icon inactive" size={16} />;
      case "pending":
        return <AlertCircle className="status-icon pending" size={16} />;
      default:
        return <AlertCircle className="status-icon" size={16} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "role-admin";
      case "doctor":
        return "role-doctor";
      case "patient":
        return "role-patient";
      default:
        return "role-default";
    }
  };

  if (loading) {
    return (
      <div className="admin-users-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users-management">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Users size={24} /> User Management
          </h1>
          <p>Manage platform users, roles, and permissions</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.activeUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon doctors">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.doctors}</h3>
            <p>Doctors</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon patients">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.patients}</h3>
            <p>Patients</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td className="user-info">
                  <div className="user-avatar">
                    {(user.firstName || user.profile?.firstName || "U")[0]}
                    {(user.lastName || user.profile?.lastName || "N")[0]}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.firstName || user.profile?.firstName || "Unknown"}{" "}
                      {user.lastName || user.profile?.lastName || "User"}
                    </div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <div className="status-container">
                    {getStatusIcon(user.status)}
                    <span className={`status-text ${user.status}`}>
                      {user.status}
                    </span>
                  </div>
                </td>
                <td className="contact-info">
                  <div className="contact-item">
                    <Mail size={14} />
                    {user.email}
                  </div>
                  {user.profile?.phone && (
                    <div className="contact-item">
                      <Phone size={14} />
                      {user.profile.phone}
                    </div>
                  )}
                </td>
                <td className="joined-date">
                  <Calendar size={14} />
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="actions-cell">
                  <div className="actions-dropdown">
                    <button
                      className="dropdown-toggle"
                      onClick={() =>
                        setShowDropdown(
                          showDropdown === user._id ? null : user._id
                        )
                      }
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showDropdown === user._id && (
                      <div className="dropdown-menu">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditForm({
                              firstName:
                                user.firstName || user.profile?.firstName || "",
                              lastName:
                                user.lastName || user.profile?.lastName || "",
                              email: user.email || "",
                              username: user.username || "",
                              role: user.role || "patient",
                              timeZone: user.timeZone || "",
                              phone: user.profile?.phone || "",
                              specialization:
                                user.profile?.specialization || "",
                            });
                            setShowEditModal(true);
                            setShowDropdown(null);
                          }}
                        >
                          <Edit size={16} />
                          Edit User
                        </button>
                        <button
                          onClick={() => {
                            setPasswordResetData({
                              ...passwordResetData,
                              userId: user._id,
                            });
                            setShowPasswordResetModal(true);
                            setShowDropdown(null);
                          }}
                        >
                          <Key size={16} />
                          Reset Password
                        </button>
                        <button
                          onClick={() => {
                            handleStatusToggle(user._id, user.status);
                            setShowDropdown(null);
                          }}
                        >
                          {user.status === "active" ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                          {user.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteUser(user._id);
                            setShowDropdown(null);
                          }}
                          className="delete-action"
                        >
                          <Trash2 size={16} />
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <UserPlus size={20} /> Create New User
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                {formData.role === "doctor" && (
                  <div className="form-group full-width">
                    <label>Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      placeholder="e.g., Cardiology, General Medicine"
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasswordResetModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Key size={20} /> Reset Password
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowPasswordResetModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordResetData.newPassword}
                  onChange={(e) =>
                    setPasswordResetData({
                      ...passwordResetData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={passwordResetData.confirmPassword}
                  onChange={(e) =>
                    setPasswordResetData({
                      ...passwordResetData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  minLength="6"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowPasswordResetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Edit size={20} /> Edit User
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // Build payload: profile names always allowed; elevated fields may require super endpoint
                  const basePayload = {
                    profile: {
                      firstName: editForm.firstName,
                      lastName: editForm.lastName,
                      ...(editForm.phone ? { phone: editForm.phone } : {}),
                      ...(editForm.role === "doctor" && editForm.specialization
                        ? { specialization: editForm.specialization }
                        : {}),
                    },
                    role: editForm.role,
                  };

                  const elevated = {};
                  if (editForm.email) elevated.email = editForm.email;
                  if (editForm.username) elevated.username = editForm.username;
                  if (editForm.timeZone) elevated.timeZone = editForm.timeZone;

                  const hasElevated = Object.keys(elevated).length > 0;
                  const payload = hasElevated
                    ? { ...basePayload, ...elevated }
                    : basePayload;

                  let resp;
                  if (hasElevated) {
                    // Super admin endpoint uses PATCH
                    resp = await apiClient.patch(
                      `/admin/users/super/${selectedUser._id}`,
                      payload
                    );
                  } else {
                    resp = await apiClient.put(
                      `/admin/users/${selectedUser._id}`,
                      payload
                    );
                  }
                  if (resp.data?.message) {
                    await fetchUsers();
                    await fetchDashboardStats();
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setError(null);
                  }
                } catch (err) {
                  console.log("Error updating user:", err);
                  setError(
                    err.response?.data?.error || "Failed to update user"
                  );
                }
              }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Email (super admin)</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Username (super admin)</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Zone (super admin)</label>
                  <input
                    type="text"
                    value={editForm.timeZone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, timeZone: e.target.value })
                    }
                    placeholder="e.g., UTC"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                {editForm.role === "doctor" && (
                  <div className="form-group full-width">
                    <label>Specialization</label>
                    <input
                      type="text"
                      value={editForm.specialization}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          specialization: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagement;
