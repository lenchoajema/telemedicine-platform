import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./RoleForm.css";
import { fetchPrivileges } from "../../api/roleClient";

export default function RoleForm({ initialData, onSubmit, onCancel }) {
  const safeData = initialData || {};
  const [name, setName] = useState(safeData.name || "");
  const [description, setDescription] = useState(safeData.description || "");
  const [privileges, setPrivileges] = useState(safeData.privileges || []);
  const [privilegeOptions, setPrivilegeOptions] = useState([]);
  const [loadingPrivileges, setLoadingPrivileges] = useState(true);
  const [isActive, setIsActive] = useState(
    safeData.isActive !== undefined ? safeData.isActive : true
  );

  useEffect(() => {
    const data = initialData || {};
    setName(data.name || "");
    setDescription(data.description || "");
    setPrivileges(data.privileges || []);
    setIsActive(data.isActive !== undefined ? data.isActive : true);
  }, [initialData]);
  useEffect(() => {
    fetchPrivileges()
      .then((res) => setPrivilegeOptions(res.data.data || []))
      .catch((err) => console.error("Failed to fetch privileges", err))
      .finally(() => setLoadingPrivileges(false));
  }, []);

  const togglePrivilege = (priv) => {
    setPrivileges((prev) =>
      prev.includes(priv) ? prev.filter((p) => p !== priv) : [...prev, priv]
    );
  };
  // Select or deselect all privileges
  const toggleAllPrivileges = () => {
    if (privileges.length === privilegeOptions.length) {
      setPrivileges([]);
    } else {
      setPrivileges([...privilegeOptions]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description, privileges, isActive });
  };

  return (
    <form className="role-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Role Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Privileges</label>
        <div className="select-all">
          <label>
            <input
              type="checkbox"
              checked={
                !loadingPrivileges &&
                privileges.length === privilegeOptions.length
              }
              disabled={loadingPrivileges}
              onChange={toggleAllPrivileges}
            />
            Select All Privileges
          </label>
        </div>
        <div className="privileges-list">
          {privilegeOptions.map((priv) => (
            <label key={priv}>
              <input
                type="checkbox"
                checked={privileges.includes(priv)}
                onChange={() => togglePrivilege(priv)}
                disabled={loadingPrivileges}
              />
              {priv}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Save Role
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

RoleForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
