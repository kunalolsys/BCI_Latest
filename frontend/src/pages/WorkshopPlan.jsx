import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Eye,
  Settings,
  Trash2,
  StopCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function WorkshopPlan() {
  const [upcomingWorkshops, setUpcomingWorkshops] = useState([]);
  const [ongoingWorkshops, setOngoingWorkshops] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopTypes, setWorkshopTypes] = useState([]);

  // Fetch workshops and templates
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch upcoming workshops
      const upcomingRes = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/workshop?status=Draft&status=Upcoming`,
        { withCredentials: true }
      );
      setUpcomingWorkshops(upcomingRes.data.workshops || []);

      // Fetch ongoing workshops
      const ongoingRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/workshop?status=Ongoing`,
        { withCredentials: true }
      );
      setOngoingWorkshops(ongoingRes.data.workshops || []);

      // Fetch templates for dropdown
      const templatesRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/plan/templates`,
        { withCredentials: true }
      );
      setTemplates(templatesRes.data.templates || []);

      // Fetch workshop types
      const workshopTypesRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/templates/types`,
        { withCredentials: true }
      );
      setWorkshopTypes(workshopTypesRes.data.workshopTypes || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.config && err.config.url.includes('setup/template/types')) {
        toast.error(
          'Failed to load workshop names. Workshop type names may not display correctly.'
        );
        setWorkshopTypes([]);
      } else {
        setError('Failed to load workshops and templates');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Initiate workshop from selected template
  const handleInitiateWorkshop = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a workshop template');
      return;
    }

    setIsInitiating(true);

    try {
      // Navigate to the create workshop page with the template ID
      navigate(`/workshop/create?templateId=${selectedTemplate}`);
    } catch (err) {
      console.error('Error initiating workshop:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate workshop');
      setIsInitiating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/${selectedWorkshop._id}`,
        { withCredentials: true }
      );
      toast.success('Workshop deleted successfully');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting workshop:', err);
      toast.error(err.response?.data?.message || 'Failed to delete workshop');
    }
  };

  const handleStop = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/${
          selectedWorkshop._id
        }/stop`,
        {},
        { withCredentials: true }
      );
      toast.success('Workshop stopped successfully');
      setStopDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error stopping workshop:', err);
      toast.error(err.response?.data?.message || 'Failed to stop workshop');
    }
  };

  const handleComplete = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/${
          selectedWorkshop._id
        }/complete`,
        {},
        { withCredentials: true }
      );
      toast.success('Workshop marked as completed');
      setCompleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error completing workshop:', err);
      toast.error(err.response?.data?.message || 'Failed to complete workshop');
    }
  };

  // Workshop table component
  const WorkshopTable = ({ workshops }) => {
    // Helper function to get workshop type name from ID
    const getWorkshopTypeName = (workshopId) => {
      if (!workshopId || !workshopTypes || workshopTypes.length === 0)
        return '-';
      const abbreviation = workshopId.split('-')[0];
      const foundType = workshopTypes.find(
        (type) => type.abbreviation === abbreviation
      );
      return foundType ? foundType.name : abbreviation;
    };

    return (
      <table className='min-w-[900px] md:min-w-full rounded-2xl border-separate border-spacing-0'>
        <thead className='sticky top-0 z-10 bg-gray-100'>
          <tr>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Workshop ID
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Workshop Type
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Announcement Date
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Event Date
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Location
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Type
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Status
            </th>
            <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {workshops.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className='px-4 md:px-6 py-6 text-center text-gray-400'
              >
                No workshops found.
              </td>
            </tr>
          ) : (
            workshops.map((workshop) => (
              <tr key={workshop._id}>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200 font-medium'>
                  {workshop.workshopId}
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  {getWorkshopTypeName(workshop.workshopId)}
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  {formatDate(workshop.announcementDate)}
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  {formatDate(workshop.eventDate)}
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  {workshop.location ? workshop.location : '-'}
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  {workshop.type}
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workshop.status === 'Ongoing'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                    }`}
                  >
                    {workshop.status}
                  </span>
                </td>
                <td className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => navigate(`/workshop/${workshop._id}`)}
                      className='cursor-pointer bg-gray-200 hover:bg-gray-300'
                    >
                      View
                    </Button>

                    {workshop.status.toLowerCase() === 'upcoming' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-600 hover:text-red-700 cursor-pointer'
                        onClick={() => {
                          setSelectedWorkshop(workshop);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}

                    {workshop.status.toLowerCase() === 'ongoing' && (
                      <>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='cursor-pointer text-amber-600 hover:text-amber-700'
                          onClick={() => {
                            setSelectedWorkshop(workshop);
                            setStopDialogOpen(true);
                          }}
                        >
                          <StopCircle className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='cursor-pointer text-green-600 hover:text-green-700'
                          onClick={() => {
                            setSelectedWorkshop(workshop);
                            setCompleteDialogOpen(true);
                          }}
                        >
                          <CheckCircle className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className='flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50'>
      <div className='p-8 flex-none'>
        <h1 className='text-3xl font-bold text-gray-800 tracking-tight mb-0'>
          Plan & Launch Workshops
        </h1>
        {/* Initiate Workshop panel */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mt-6 mb-8'>
          <div className='flex flex-col md:flex-row items-start md:items-center gap-4'>
            <div className='w-full md:w-64'>
              <label className='block mb-3 text-sm font-semibold text-gray-700'>
                Template
              </label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                  <SelectValue placeholder='Select' />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='mt-7'>
              <button
                onClick={handleInitiateWorkshop}
                disabled={isInitiating || !selectedTemplate}
                className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50'
              >
                {isInitiating ? 'Initiating...' : 'Initiate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Upcoming and Ongoing workshops */}
      <div className='px-8 flex-grow overflow-hidden flex flex-col'>
        <Tabs defaultValue='upcoming' className='flex flex-col h-full'>
          <TabsList className='mb-6 flex-none bg-gray-100 rounded-lg border border-gray-200 p-6 gap-2'>
            <TabsTrigger
              value='upcoming'
              className='cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-5 py-2 font-semibold text-gray-700 transition'
            >
              Upcoming Workshops
            </TabsTrigger>
            <TabsTrigger
              value='ongoing'
              className='cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-5 py-2 font-semibold text-gray-700 transition'
            >
              Ongoing Workshops
            </TabsTrigger>
          </TabsList>

          <TabsContent value='upcoming' className='flex-grow overflow-hidden'>
            {loading ? (
              <div className='text-center py-10 text-gray-500'>
                Loading workshops...
              </div>
            ) : error ? (
              <div className='text-red-500 text-center py-10'>{error}</div>
            ) : (
              <div className='h-full pr-2 pb-6'>
                <div className='h-full bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                  <div className='h-full overflow-y-auto overflow-x-auto'>
                    <WorkshopTable workshops={upcomingWorkshops} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='ongoing' className='flex-grow overflow-hidden'>
            {loading ? (
              <div className='text-center py-10 text-gray-500'>
                Loading workshops...
              </div>
            ) : error ? (
              <div className='text-red-500 text-center py-10'>{error}</div>
            ) : (
              <div className='h-full pr-2 pb-6'>
                <div className='h-full bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                  <div className='h-full overflow-y-auto overflow-x-auto'>
                    <WorkshopTable workshops={ongoingWorkshops} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='max-w-md rounded-xl border border-gray-200'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-rose-600 text-xl font-bold'>
              <AlertTriangle className='h-5 w-5' />
              Delete Workshop
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workshop? This action cannot
              be undone and will delete all associated tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type='button'
              onClick={() => setDeleteDialogOpen(false)}
              className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
            >
              Cancel
            </button>
            <button
              type='button'
              className='cursor-pointer px-5 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition'
              onClick={handleDelete}
            >
              Delete Workshop
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Confirmation Dialog */}
      <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <DialogContent className='max-w-md rounded-xl border border-gray-200'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600 text-xl font-bold'>
              <AlertTriangle className='h-5 w-5' />
              Stop Workshop
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to stop this workshop? This will delete all
              pending tasks and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type='button'
              className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
              onClick={() => setStopDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type='button'
              className='cursor-pointer px-5 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition'
              onClick={handleStop}
            >
              Stop Workshop
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className='max-w-md rounded-xl border border-gray-200'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-green-600 text-xl font-bold'>
              <CheckCircle className='h-5 w-5' />
              Complete Workshop
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this workshop as completed? This can
              only be done if all tasks are completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type='button'
              className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
              onClick={() => setCompleteDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type='button'
              className='cursor-pointer px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition'
              onClick={handleComplete}
            >
              Complete Workshop
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
