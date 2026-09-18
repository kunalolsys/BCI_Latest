import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Pencil, Trash2, KeyRound, Download } from 'lucide-react';
import { Plus } from 'lucide-react';

export default function EmployeeSettings() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departments: [],
    role: '',
    isActive: true,
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch employees, departments, and roles
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, depRes, roleRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/setup/employees`, {
            params: { 
              page, 
              limit,
              search: searchTerm,
              department: selectedDepartment,
              role: selectedRole,
              isActive: selectedStatus
            },
            withCredentials: true,
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/setup/departments`, {
            params: { page: 1, limit: 100 },
            withCredentials: true,
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/setup/roles`, {
            params: { page: 1, limit: 100 },
            withCredentials: true,
          }),
        ]);
        setEmployees(empRes.data.employees || []);
        setDepartments(depRes.data.departments || []);
        setRoles(roleRes.data.roles || []);
        setTotalPages(empRes.data.totalPages || 1);
      } catch (err) {
        setError('Failed to fetch data');
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [page, limit, searchTerm, selectedDepartment, selectedRole, selectedStatus]);

  // Open modal for create/edit
  const openModal = (type, employee = null) => {
    setModalType(type);
    setSelectedEmployee(employee);
    setFormData(
      employee
        ? {
            name: employee.name,
            email: employee.email,
            masterEmail: employee.masterEmail,
            phone: employee.phone || '',
            departments: employee.departments?.map((d) => d._id) || [],
            role: employee.role?._id || '',
            isActive: employee.isActive,
          }
        : {
            name: '',
            email: '',
            phone: '',
            departments: [],
            role: '',
            isActive: true,
          }
    );
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'isActive') {
        setFormData({ ...formData, [name]: checked });
      }
    } else if (name === 'phone') {
      // Only allow digits
      const digits = value.replace(/\D/g, '');
      setFormData({ ...formData, phone: digits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Add new function to handle department checkbox changes
  const handleDepartmentChange = (departmentId) => {
    setFormData((prev) => {
      const departments = prev.departments.includes(departmentId)
        ? prev.departments.filter((id) => id !== departmentId)
        : [...prev.departments, departmentId];
      return { ...prev, departments };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    try {
      if (modalType === 'create') {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/setup/employees`,
          formData,
          { withCredentials: true }
        );
        toast.success('Employee created successfully');
      } else {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/setup/employees/${
            selectedEmployee._id
          }`,
          formData,
          { withCredentials: true }
        );
        toast.success('Employee updated successfully');
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        masterEmail: '',
        phone: '',
        departments: [],
        role: '',
        isActive: true,
      });
      // Refresh employees
      const empRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees`,
        { 
          params: { 
            page, 
            limit,
            search: searchTerm,
            department: selectedDepartment,
            role: selectedRole,
            isActive: selectedStatus
          }, 
          withCredentials: true 
        }
      );
      setEmployees(empRes.data.employees || []);
      setTotalPages(empRes.data.totalPages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Handle employee deletion
  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?'))
      return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees/${employeeId}`,
        { withCredentials: true }
      );
      toast.success('Employee deleted successfully');
      // Refresh employees
      const empRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees`,
        { 
          params: { 
            page, 
            limit,
            search: searchTerm,
            department: selectedDepartment,
            role: selectedRole,
            isActive: selectedStatus
          }, 
          withCredentials: true 
        }
      );
      setEmployees(empRes.data.employees || []);
      setTotalPages(empRes.data.totalPages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  // Handle activate toggle
  const handleToggleActive = async (employee) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees/${employee._id}`,
        { isActive: !employee.isActive },
        { withCredentials: true }
      );
      setEmployees((employees) =>
        employees.map((e) =>
          e._id === employee._id ? { ...e, isActive: !e.isActive } : e
        )
      );
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Handle reset password
  const openResetModal = (employee) => {
    setSelectedEmployee(employee);
    setResetPassword('');
    setIsResetModalOpen(true);
  };
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    setResetLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees/${
          selectedEmployee._id
        }/reset-password`,
        { password: resetPassword },
        { withCredentials: true }
      );
      toast.success('Password reset successfully');
      setIsResetModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Build params for export
      const params = {
        page: 1,
        limit: 10000,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedDepartment && selectedDepartment !== 'all') params.department = selectedDepartment;
      if (selectedRole && selectedRole !== 'all') params.role = selectedRole;
      if (selectedStatus && selectedStatus !== 'all') params.isActive = selectedStatus;

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees`,
        {
          params,
          withCredentials: true,
        }
      );
      
      const employees = response.data.employees || [];
      
      // Create CSV content
      const headers = [
        'Sr. No.',
        'Name',
        'User ID',
        'Master Email',
        'Phone',
        'Departments',
        'Role',
        'Active Status',
        'Created At'
      ];
      
      const csvContent = [
        headers.join(','),
        ...employees.map((emp, index) => [
          index + 1,
          `"${emp.name || ''}"`,
          `"${emp.email || ''}"`,
          `"${emp.masterEmail || ''}"`,
          `"${emp.phone || ''}"`,
          `"${emp.departments?.map(d => d.name).join(', ') || ''}"`,
          `"${emp.role?.name || ''}"`,
          emp.isActive ? 'Active' : 'Inactive',
          `"${new Date(emp.createdAt).toLocaleDateString()}"`
        ].join(','))
      ].join('\n');
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className='p-8 bg-gray-50 min-h-screen'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-800 tracking-tight'>
          Employee Settings
        </h1>
        <div className='flex gap-3'>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className='inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer bg-black text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Download className='h-5 w-5'></Download>
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => openModal('create')}
            className='inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
          >
            <Plus className='h-5 w-5'></Plus>
            Add Employee
          </button>
        </div>
      </div>
      <div className='bg-white rounded-2xl p-8 border border-gray-100'>
        <div className='flex flex-col md:flex-row md:items-end gap-4 mb-6'>
          {/* Search Bar */}
          <div className='flex-1'>
            <label className='block text-xs font-semibold text-gray-600 mb-1'>Search</label>
            <input
              type='text'
              placeholder='Search by name, user ID, master email, or phone'
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm'
            />
          </div>
          {/* Department Filter */}
          <div>
            <label className='block text-xs font-semibold text-gray-600 mb-1'>Department</label>
            <select
              value={selectedDepartment}
              onChange={e => { setSelectedDepartment(e.target.value); setPage(1); }}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm'
            >
              <option value='all'>All</option>
              {departments.map(dep => (
                <option key={dep._id} value={dep._id}>{dep.name}</option>
              ))}
            </select>
          </div>
          {/* Role Filter */}
          <div>
            <label className='block text-xs font-semibold text-gray-600 mb-1'>Role</label>
            <select
              value={selectedRole}
              onChange={e => { setSelectedRole(e.target.value); setPage(1); }}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm'
            >
              <option value='all'>All</option>
              {roles.map(role => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label className='block text-xs font-semibold text-gray-600 mb-1'>Status</label>
            <select
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm'
            >
              <option value='all'>All</option>
              <option value='true'>Active</option>
              <option value='false'>Inactive</option>
            </select>
          </div>
          {/* Clear Filters Button */}
          <div className='flex items-end'>
            <button
              type='button'
              onClick={() => { setSearchTerm(''); setSelectedDepartment('all'); setSelectedRole('all'); setSelectedStatus('all'); setPage(1); }}
              className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition text-sm'
            >
              Clear Filters
            </button>
          </div>
        </div>
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
                    Sr. No.
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    User ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Master Email
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Phone
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Department
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Role
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Activate
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={emp._id}>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      {emp.name}
                    </td>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      {emp.email}
                    </td>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      {emp.masterEmail}
                    </td>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      {emp.phone || '-'}
                    </td>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      <div className='flex flex-wrap gap-1'>
                        {emp.departments?.map((d) => (
                          <span
                            key={d._id}
                            className='text-gray-800 rounded px-2 py-0.5 text-xs font-medium'
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className='px-6 py-3 border-b text-sm text-gray-800'>
                      {emp.role?.name}
                    </td>
                    <td className='px-6 py-3 border-b text-center'>
                      <button
                        onClick={() => handleToggleActive(emp)}
                        className={`w-10 h-6 cursor-pointer rounded-full relative transition-colors duration-200 border border-gray-300 ${
                          emp.isActive ? 'bg-indigo-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white border border-gray-300 transition-transform duration-200 ${
                            emp.isActive ? 'translate-x-4' : ''
                          }`}
                        ></span>
                      </button>
                    </td>
                    <td className='px-6 py-3 border-b text-right'>
                      <div className='flex justify-end gap-2'>
                        <button
                          onClick={() => openModal('edit', emp)}
                          className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
                          title='Edit'
                        >
                          <Pencil className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => openResetModal(emp)}
                          className='cursor-pointer p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition'
                          title='Reset Password'
                        >
                          <KeyRound className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => handleDelete(emp._id)}
                          className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition'
                          title='Delete Employee'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className='flex flex-col md:flex-row justify-between items-center mt-6 gap-4'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-600'>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className='border border-gray-300 rounded px-3 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500'
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition'
                >
                  Previous
                </button>
                <span className='text-sm text-gray-700 font-medium'>
                  Page <span className='font-bold'>{page}</span> of{' '}
                  <span className='font-bold'>{totalPages}</span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition'
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto'>
          <div className='rounded-xl p-8 w-full max-w-3xl mx-3 border border-gray-200 bg-white dark:bg-gray-900 max-h-[calc(100vh-60px)] overflow-y-auto flex flex-col'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              {modalType === 'create' ? 'Add New Employee' : 'Edit Employee'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Name
                    </label>
                    <input
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                      required
                    />
                  </div>
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      User ID
                    </label>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                      required
                      disabled={modalType === 'edit'}
                    />
                  </div>
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Master Email
                    </label>
                    <input
                      type='email'
                      name='masterEmail'
                      value={formData.masterEmail}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                      required
                      disabled={modalType === 'edit'}
                    />
                  </div>
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Phone
                    </label>
                    <input
                      type='text'
                      name='phone'
                      value={formData.phone}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                      required
                      maxLength={10}
                      inputMode='numeric'
                    />
                  </div>
                </div>
                <div>
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Departments
                    </label>
                    <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg'>
                      {departments.map((dep) => (
                        <div
                          key={dep._id}
                          className='flex items-center space-x-2'
                        >
                          <Checkbox
                            id={`dept-${dep._id}`}
                            checked={formData.departments.includes(dep._id)}
                            onCheckedChange={() =>
                              handleDepartmentChange(dep._id)
                            }
                          />
                          <label
                            htmlFor={`dept-${dep._id}`}
                            className='text-sm font-medium leading-none'
                          >
                            {dep.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Role
                    </label>
                    <select
                      name='role'
                      value={formData.role}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                      required
                    >
                      <option value=''>Select Role</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='mb-6 flex items-center justify-between'>
                    <label
                      htmlFor='isActive'
                      className='text-sm font-semibold text-gray-700'
                    >
                      Active Status
                    </label>
                    <Switch
                      id='isActive'
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className='flex justify-end gap-3 mt-6'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                >
                  {modalType === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal for Reset Password */}
      {isResetModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-8 w-full max-w-md mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              Reset Password
            </h2>
            <form onSubmit={handleResetPassword}>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  New Password
                </label>
                <input
                  type='password'
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  required
                  minLength={4}
                />
              </div>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setIsResetModalOpen(false)}
                  className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
