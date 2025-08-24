import React, { useState, useEffect } from "react";
import {
  fetchRoles,
  createRole,
  updateRole,
  toggleRoleActive,
} from "../../api/roleClient";
import RoleForm from "../../components/admin/RoleForm";
import "./RoleManagementPage.css";

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  const loadRoles = async () => {
    try {
      const resp = await fetchRoles();
      setRoles(resp.data.data);
    } catch (err) {
      setError("Failed to load roles");
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleAdd = () => {
    setEditingRole(null);
    setShowForm(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  const handleSave = async (data) => {
    try {
      if (editingRole) {
        await updateRole(editingRole._id, data);
      } else {
        await createRole(data);
      }
      setShowForm(false);
      loadRoles();
    } catch (err) {
      setError("Failed to save role");
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleRoleActive(id);
      loadRoles();
    } catch (err) {
      setError("Failed to update role status");
    }
  };

  return (
    <div className="role-mgmt-page">
      <header>
        <h2>Role Management</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          Add New Role
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <table className="roles-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Privileges</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role._id} className={!role.isActive ? "inactive" : ""}>
              <td>{role.name}</td>
              <td>{role.description}</td>
              <td>{role.privileges.join(", ")}</td>
              <td>{role.isActive ? "Active" : "Inactive"}</td>
              <td>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEdit(role)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => handleToggle(role._id)}
                >
                  {role.isActive ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <RoleForm
              initialData={editingRole}
              onSubmit={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
