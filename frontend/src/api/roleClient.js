import apiClient from './apiClient';

// Fetch all available privileges
export const fetchPrivileges = () => apiClient.get('/admin/roles/privileges');
export const fetchRoles = () => apiClient.get('/admin/roles');
export const fetchRoleById = (id) => apiClient.get(`/admin/roles/${id}`);
export const createRole = (roleData) => apiClient.post('/admin/roles', roleData);
export const updateRole = (id, updates) => apiClient.put(`/admin/roles/${id}`, updates);
export const toggleRoleActive = (id) => apiClient.patch(`/admin/roles/${id}/disable`);
