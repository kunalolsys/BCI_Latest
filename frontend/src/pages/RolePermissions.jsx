import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const PERMISSIONS = [
  'Admin',
  'Setup',
  'Workshop Template',
  'Plan & Launch',
  'Doer',
  'Workshop History',
];

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', permissions: [] });
  const [saving, setSaving] = useState(false);

  // Fetch all roles
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/roles`,
        { withCredentials: true }
      );
      setRoles(res.data.roles || []);
    } catch (err) {
      setError('Failed to fetch roles');
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Toggle permission for a role
  const handleTogglePermission = async (roleId, permission) => {
    setSaving(true);
    const role = roles.find((r) => r._id === roleId);
    if (!role) return;
    const hasPermission = role.permissions.includes(permission);
    const updatedPermissions = hasPermission
      ? role.permissions.filter((p) => p !== permission)
      : [...role.permissions, permission];
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/setup/roles/${roleId}`,
        { permissions: updatedPermissions },
        { withCredentials: true }
      );
      setRoles((roles) =>
        roles.map((r) =>
          r._id === roleId ? { ...r, permissions: updatedPermissions } : r
        )
      );
      toast.success('Permissions updated');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update permissions'
      );
    } finally {
      setSaving(false);
    }
  };

  // Edit role name
  const handleEditRoleName = (roleId) => {
    setEditingRoleId(roleId);
  };

  const handleRoleNameChange = (roleId, value) => {
    setRoles((roles) =>
      roles.map((r) => (r._id === roleId ? { ...r, name: value } : r))
    );
  };

  const handleRoleNameSave = async (roleId) => {
    const role = roles.find((r) => r._id === roleId);
    if (!role) return;
    setSaving(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/setup/roles/${roleId}`,
        { name: role.name },
        { withCredentials: true }
      );
      toast.success('Role name updated');
      setEditingRoleId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role name');
    } finally {
      setSaving(false);
    }
  };

  // Delete role
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    setSaving(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/setup/roles/${roleId}`,
        { withCredentials: true }
      );
      setRoles((roles) => roles.filter((r) => r._id !== roleId));
      toast.success('Role deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  // Add new role
  const handleAddNewRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    if (newRole.permissions.length === 0) {
      toast.error('At least one permission is required');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/setup/roles`,
        newRole,
        { withCredentials: true }
      );
      setRoles([...roles, res.data.role]);
      setNewRole({ name: '', permissions: [] });
      toast.success('Role created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  // Toggle permission for new role
  const handleToggleNewRolePermission = (permission) => {
    setNewRole((nr) => {
      const has = nr.permissions.includes(permission);
      return {
        ...nr,
        permissions: has
          ? nr.permissions.filter((p) => p !== permission)
          : [...nr.permissions, permission],
      };
    });
  };

  return (
    <div className='p-8 bg-gray-50 min-h-screen'>
      <h1 className='text-3xl font-bold text-gray-800 mb-8'>
        Roles & Permission Settings
      </h1>
      <div className='bg-white rounded-2xl p-8 border border-gray-100'>
        {loading ? (
          <div className='text-gray-500 text-center py-10'>Loading...</div>
        ) : error ? (
          <div className='text-red-500 text-center py-10'>{error}</div>
        ) : (
          <div className='overflow-x-auto rounded-lg'>
            <table className='min-w-full bg-white rounded-lg overflow-hidden border border-gray-200'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Roles
                  </th>
                  {PERMISSIONS.map((perm) => (
                    <th
                      key={perm}
                      className='px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b'
                    >
                      {perm}
                    </th>
                  ))}
                  <th className='px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Sort roles: fixed roles (canDelete: false) first, then custom roles */}
                {roles
                  .slice()
                  .sort((a, b) =>
                    a.canDelete === b.canDelete ? 0 : a.canDelete ? 1 : -1
                  )
                  .map((role) => (
                    <tr key={role._id}>
                      {/* Role Name */}
                      <td className='px-6 py-3 border-b text-sm text-gray-800 text-left font-medium'>
                        {editingRoleId === role._id ? (
                          <input
                            type='text'
                            value={role.name}
                            onChange={(e) =>
                              handleRoleNameChange(role._id, e.target.value)
                            }
                            onBlur={() => handleRoleNameSave(role._id)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleRoleNameSave(role._id)
                            }
                            className='border border-gray-300 rounded-lg px-2 py-1 w-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => handleEditRoleName(role._id)}
                            className='cursor-pointer hover:underline'
                          >
                            {role.name}
                          </span>
                        )}
                      </td>
                      {/* Permissions */}
                      {PERMISSIONS.map((perm) => (
                        <td
                          key={perm}
                          className='px-6 py-3 border-b text-center'
                        >
                          <button
                            disabled={saving}
                            onClick={() =>
                              handleTogglePermission(role._id, perm)
                            }
                            className={`w-10 h-6 rounded-full relative transition-colors duration-200 border border-gray-300 ${
                              role.permissions.includes(perm)
                                ? 'bg-indigo-500'
                                : 'bg-gray-200'
                            }`}
                            aria-label={`Toggle ${perm} for ${role.name}`}
                          >
                            <span
                              className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white border border-gray-300 transition-transform duration-200 ${
                                role.permissions.includes(perm)
                                  ? 'translate-x-4'
                                  : ''
                              }`}
                            ></span>
                          </button>
                        </td>
                      ))}
                      {/* Action */}
                      <td className='px-6 py-3 border-b text-right'>
                        {role.canDelete !== false ? (
                          <button
                            disabled={saving}
                            onClick={() => handleDeleteRole(role._id)}
                            className='px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition'
                            title='Delete Role'
                          >
                            Delete
                          </button>
                        ) : (
                          <span className='text-gray-400'>NA</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {/* Add New Row */}
                <tr className='bg-gray-50'>
                  <td className='px-6 py-3 border-b text-sm text-gray-800 text-left font-medium'>
                    <input
                      type='text'
                      value={newRole.name}
                      onChange={(e) =>
                        setNewRole((nr) => ({ ...nr, name: e.target.value }))
                      }
                      placeholder='Add New'
                      className='border border-gray-300 rounded-lg px-2 py-1 w-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                    />
                  </td>
                  {PERMISSIONS.map((perm) => (
                    <td key={perm} className='px-6 py-3 border-b text-center'>
                      <button
                        disabled={saving}
                        onClick={() => handleToggleNewRolePermission(perm)}
                        className={`w-10 h-6 rounded-full relative transition-colors duration-200 border border-gray-300 ${
                          newRole.permissions.includes(perm)
                            ? 'bg-indigo-500'
                            : 'bg-gray-200'
                        }`}
                        aria-label={`Toggle ${perm} for new role`}
                      >
                        <span
                          className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white border border-gray-300 transition-transform duration-200 ${
                            newRole.permissions.includes(perm)
                              ? 'translate-x-4'
                              : ''
                          }`}
                        ></span>
                      </button>
                    </td>
                  ))}
                  <td className='px-6 py-3 border-b text-right'>
                    <button
                      disabled={saving}
                      onClick={handleAddNewRole}
                      className='px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                      title='Add Role'
                    >
                      Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
