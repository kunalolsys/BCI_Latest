import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  // Form states
  const [newLocationName, setNewLocationName] = useState('');
  const [editLocationName, setEditLocationName] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [venues, setVenues] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch locations with their venues
  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/master/locations`,
        {
          withCredentials: true,
        }
      );
      setLocations(response.data.locations);
    } catch (error) {
      toast.error('Failed to fetch locations');
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle location deletion
  const handleDelete = async () => {
    if (!locationToDelete) return;

    setLoadingAction(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/master/location/${
          locationToDelete.name
        }`,
        { withCredentials: true }
      );
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    } finally {
      setShowDeleteDialog(false);
      setLocationToDelete(null);
      setLoadingAction(false);
    }
  };

  // Handle add location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) {
      toast.error('Location name is required');
      return;
    }

    setLoadingAction(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/master/location`,
        { name: newLocationName.trim() },
        { withCredentials: true }
      );
      toast.success('Location added successfully');
      setShowAddModal(false);
      setNewLocationName('');
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add location');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle edit location
  const handleEditLocation = async (e) => {
    e.preventDefault();
    if (!editLocationName.trim()) {
      toast.error('Location name is required');
      return;
    }

    setLoadingAction(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/master/location/${
          selectedLocation.name
        }`,
        { newName: editLocationName.trim() },
        { withCredentials: true }
      );
      toast.success('Location updated successfully');
      setShowEditModal(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle add venue
  const handleAddVenue = async () => {
    if (!newVenue.trim()) {
      toast.error('Venue name is required');
      return;
    }

    setLoadingAction(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/master/venue`,
        {
          name: newVenue.trim(),
          locationName: editLocationName,
        },
        { withCredentials: true }
      );
      setVenues([...venues, response.data.venue]);
      setNewVenue('');
      toast.success('Venue added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add venue');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle delete venue
  const handleDeleteVenue = async (venueId) => {
    setLoadingAction(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/master/venue/${venueId}`,
        { withCredentials: true }
      );
      setVenues(venues.filter((venue) => venue._id !== venueId));
      toast.success('Venue deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete venue');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle edit click
  const handleEditClick = (location) => {
    setSelectedLocation(location);
    setEditLocationName(location.name);
    setVenues(location.venues || []);
    setShowEditModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (location) => {
    setLocationToDelete(location);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return <div className='p-4'>Loading...</div>;
  }

  return (
    <div className='p-4 md:p-8 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight'>
          Locations
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className='cursor-pointer w-full sm:w-auto inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
        >
          <Plus className='w-4 h-4' />
          Add Location
        </button>
      </div>

      {/* Table Card */}
      <div className='bg-white rounded-2xl p-4 md:p-8 border border-gray-100'>
        <div className='overflow-x-auto rounded-lg'>
          <table className='min-w-[400px] md:min-w-full bg-white rounded-lg overflow-hidden border border-gray-200 text-sm'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                  Location Name
                </th>
                <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>
                  Venues
                </th>
                <th className='px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b w-[120px]'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, idx) => (
                <tr key={location._id}>
                  <td className='px-4 md:px-6 py-3 border-b text-sm text-gray-800 font-medium'>
                    {location.name}
                  </td>
                  <td className='px-4 md:px-6 py-3 border-b text-sm text-gray-800'>
                    {location.venues.length > 0 ? (
                      <ul className='list-disc list-inside space-y-1'>
                        {location.venues.map((venue) => (
                          <li key={venue._id}>{venue.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className='text-gray-400'>No venues</span>
                    )}
                  </td>
                  <td className='px-4 md:px-6 py-3 border-b text-right'>
                    <div className='flex justify-end gap-2'>
                      <button
                        onClick={() => handleEditClick(location)}
                        className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
                        title='Edit'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(location)}
                        className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition'
                        title='Delete'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto'>
          <div className='bg-white rounded-xl p-4 md:p-8 w-full max-w-md mx-2 md:mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              Add New Location
            </h2>
            <form onSubmit={handleAddLocation}>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Location Name
                </label>
                <input
                  id='name'
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder='Enter location name'
                  autoComplete='off'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  required
                />
              </div>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setShowAddModal(false)}
                  className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                  disabled={loadingAction}
                >
                  {loadingAction ? 'Adding...' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto'>
          <div className='bg-white rounded-xl p-4 md:p-8 w-full max-w-2xl mx-2 md:mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              Edit Location
            </h2>
            <form onSubmit={handleEditLocation}>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Location Name
                </label>
                <input
                  id='name'
                  value={editLocationName}
                  onChange={(e) => setEditLocationName(e.target.value)}
                  placeholder='Enter location name'
                  autoComplete='off'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  required
                />
              </div>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Venues
                </label>
                <div className='flex flex-col sm:flex-row gap-2'>
                  <input
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder='Enter venue name'
                    autoComplete='off'
                    className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  />
                  <button
                    type='button'
                    onClick={handleAddVenue}
                    disabled={!newVenue.trim() || loadingAction}
                    className='cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                  >
                    <Plus className='w-4 h-4' />
                    Add Venue
                  </button>
                </div>
              </div>
              {venues.length > 0 && (
                <div className='border border-gray-200 rounded-lg p-4 mb-6'>
                  <h4 className='font-medium mb-2'>Current Venues</h4>
                  <div className='space-y-2'>
                    {venues.map((venue) => (
                      <div
                        key={venue._id}
                        className='flex items-center justify-between p-2 bg-gray-50 rounded'
                      >
                        <span>{venue.name}</span>
                        <button
                          type='button'
                          onClick={() => handleDeleteVenue(venue._id)}
                          disabled={loadingAction}
                          className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition'
                          title='Delete Venue'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setShowEditModal(false)}
                  className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
                  disabled={loadingAction}
                >
                  {loadingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto'>
          <div className='bg-white rounded-xl p-4 md:p-8 w-full max-w-md mx-2 md:mx-4 border border-gray-200'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>
              Are you sure?
            </h2>
            <p className='mb-6 text-gray-700'>
              This action will permanently delete the location "
              <span className='font-semibold'>{locationToDelete?.name}</span>"
              and all its associated venues.
              <br />
              This action cannot be undone.
            </p>
            <div className='flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setShowDeleteDialog(false)}
                className='px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                disabled={loadingAction}
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleDelete}
                className='px-5 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition'
                disabled={loadingAction}
              >
                {loadingAction ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
