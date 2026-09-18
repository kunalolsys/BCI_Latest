import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date(),
  });

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/master/holidays`,
        {
          withCredentials: true,
        }
      );
      setHolidays(response.data.data.holidays);
      setError(null);
    } catch (err) {
      setError('Failed to fetch holidays');
      toast.error('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    // Convert the selected date to UTC
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    );

    setFormData((prev) => ({
      ...prev,
      date: utcDate,
    }));
  };

  // Handle add holiday
  const handleAddHoliday = async () => {
    try {
      const payload = {
        name: formData.name,
        date: formData.date.toISOString(), // This will be in UTC format
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/master/holiday`,
        payload,
        { withCredentials: true }
      );
      toast.success('Holiday added successfully');
      setIsAddDialogOpen(false);
      setFormData({ name: '', date: new Date() });
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  // Handle edit holiday
  const handleEditHoliday = async () => {
    try {
      const payload = {
        name: formData.name,
        date: formData.date.toISOString(), // This will be in UTC format
      };

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/master/holiday/${
          selectedHoliday._id
        }`,
        payload,
        { withCredentials: true }
      );
      toast.success('Holiday updated successfully');
      setIsEditDialogOpen(false);
      setSelectedHoliday(null);
      setFormData({ name: '', date: new Date() });
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update holiday');
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?'))
      return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/master/holiday/${id}`,
        { withCredentials: true }
      );
      toast.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  // Open edit dialog
  const openEditDialog = (holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: new Date(holiday.date), // The date from backend is already in UTC
    });
    setIsEditDialogOpen(true);
  };

  if (loading) return <div className='p-8'>Loading...</div>;
  if (error) return <div className='p-8 text-red-500'>{error}</div>;

  return (
    <div className='p-4 md:p-8 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight'>
          Holidays
        </h1>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className='cursor-pointer inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
        >
          <Plus className='h-4 w-4' />
          Add Holiday
        </button>
      </div>

      <div className='bg-white rounded-2xl p-4 md:p-8 border border-gray-100'>
        <div className='overflow-x-auto rounded-lg'>
          <table className='min-w-[400px] md:min-w-full bg-white rounded-lg overflow-hidden border border-gray-200'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                  Name
                </th>
                <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                  Date
                </th>
                <th className='px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b w-[120px]'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday, idx) => (
                <tr key={holiday._id}>
                  <td className='px-4 md:px-6 py-3 border-b text-sm text-gray-800'>
                    {holiday.name}
                  </td>
                  <td className='px-4 md:px-6 py-3 border-b text-sm text-gray-800'>
                    {format(parseISO(holiday.date), 'PPP')}
                  </td>
                  <td className='px-4 md:px-6 py-3 border-b text-right'>
                    <div className='flex justify-end gap-2'>
                      <button
                        type='button'
                        onClick={() => openEditDialog(holiday)}
                        className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
                        title='Edit'
                      >
                        <Pencil className='h-4 w-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDeleteHoliday(holiday._id)}
                        className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition'
                        title='Delete'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holiday Dialog */}
      {isAddDialogOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-4 md:p-8 w-full max-w-md mx-2 md:mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              Add Holiday
            </h2>
            <form onSubmit={handleAddHoliday}>
              <div className='mb-6'>
                <label
                  htmlFor='name'
                  className='block text-sm font-semibold text-gray-700 mb-2'
                >
                  Holiday Name
                </label>
                <input
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='Enter holiday name'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  required
                />
              </div>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Date
                </label>
                <div className='flex justify-center'>
                  <Calendar
                    mode='single'
                    selected={formData.date}
                    onSelect={handleDateSelect}
                    className='rounded-md border'
                  />
                </div>
              </div>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setIsAddDialogOpen(false)}
                  className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Holiday Dialog */}
      {isEditDialogOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-4 md:p-8 w-full max-w-md mx-2 md:mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              Edit Holiday
            </h2>
            <form onSubmit={handleEditHoliday}>
              <div className='mb-6'>
                <label
                  htmlFor='edit-name'
                  className='block text-sm font-semibold text-gray-700 mb-2'
                >
                  Holiday Name
                </label>
                <input
                  id='edit-name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='Enter holiday name'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  required
                />
              </div>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Date
                </label>
                <div className='flex justify-center'>
                  <Calendar
                    mode='single'
                    selected={formData.date}
                    onSelect={handleDateSelect}
                    className='rounded-md border'
                  />
                </div>
              </div>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setIsEditDialogOpen(false)}
                  className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
