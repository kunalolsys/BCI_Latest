import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

// Department Table Component
export default function DepartmentSettings() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  // Fetch departments from backend
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/setup/departments`,
          {
            params: { page, limit },
            withCredentials: true,
          }
        );
        setDepartments(res.data.departments || []);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        setError('Failed to fetch departments');
        toast.error('Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, [page, limit]);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/setup/departments`,
          formData,
          { withCredentials: true }
        );
        toast.success('Department created successfully');
      } else {
        const res = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/setup/departments/${
            selectedDepartment._id
          }`,
          formData,
          { withCredentials: true }
        );
        toast.success('Department updated successfully');
      }
      setIsModalOpen(false);
      setFormData({ name: '' });
      // Refresh departments list
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/departments`,
        {
          params: { page, limit },
          withCredentials: true,
        }
      );
      setDepartments(res.data.departments || []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  // Handle department deletion
  const handleDelete = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/setup/departments/${departmentId}`,
        { withCredentials: true }
      );
      toast.success('Department deleted successfully');
      // Refresh departments list
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/departments`,
        {
          params: { page, limit },
          withCredentials: true,
        }
      );
      setDepartments(res.data.departments || []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to delete department';
      toast.error(errorMessage);
    }
  };

  // Open modal for creating or editing
  const openModal = (type, department = null) => {
    setModalType(type);
    setSelectedDepartment(department);
    setFormData(department ? { name: department.name } : { name: '' });
    setIsModalOpen(true);
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Department Name',
        cell: (info) => info.getValue(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <button
              onClick={() => openModal('edit', row.original)}
              className='cursor-pointer px-2 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600'
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(row.original._id)}
              className='cursor-pointer px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600'
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Set up the tanstack table
  const table = useReactTable({
    data: departments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  });

  return (
    // or your icon library

    <div className='p-4 md:p-8 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight'>
          Department Settings
        </h1>
        <button
          onClick={() => openModal('create')}
          className='w-full sm:w-auto cursor-pointer inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 4v16m8-8H4'
            />
          </svg>
          Add Department
        </button>
      </div>

      {/* Card */}
      <div className='bg-white rounded-2xl p-4 md:p-8 border border-gray-100'>
        {loading ? (
          <div className='text-gray-500 text-center py-10'>Loading...</div>
        ) : error ? (
          <div className='text-red-500 text-center py-10'>{error}</div>
        ) : (
          <>
            <div className='overflow-x-auto rounded-lg'>
              <table className='min-w-[400px] md:min-w-full bg-white rounded-lg overflow-hidden border border-gray-200 text-sm'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                      Department Name
                    </th>
                    <th className='px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <tr key={dept._id}>
                        <td className='px-4 md:px-6 py-3 border-b text-gray-800 text-left font-medium'>
                          {dept.name}
                        </td>
                        <td className='px-4 md:px-6 py-3 border-b text-gray-800 text-right'>
                          <div className='flex justify-end gap-2'>
                            <button
                              onClick={() => openModal('edit', dept)}
                              className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
                              title='Edit'
                            >
                              <Pencil className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDelete(dept._id)}
                              className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition'
                              title='Delete'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className='text-center text-gray-400 py-10'
                      >
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center transition overflow-auto'>
          <div className='bg-white rounded-xl p-4 md:p-8 w-full max-w-md mx-2 md:mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              {modalType === 'create'
                ? 'Add New Department'
                : 'Edit Department'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Department Name
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
              <div className='flex justify-end gap-3'>
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
    </div>
  );
}
