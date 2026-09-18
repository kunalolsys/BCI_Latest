import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { toast } from 'sonner';
import { Calendar, Star, List, ClipboardCheck, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Checklist dialog component
function ChecklistDialog({ task, open, onOpenChange }) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl font-bold text-gray-800'>
            <ClipboardCheck className='h-5 w-5 text-indigo-600' />
            Task Checklist
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            {task.narration || 'No description'}{' '}
            {task.taskId ? `(${task.taskId})` : ''}
          </DialogDescription>
        </DialogHeader>

        {!task.checklist || task.checklist.length === 0 ? (
          <div className='text-center py-6 text-gray-500'>
            No checklist items found for this task.
          </div>
        ) : (
          <div className='mt-2'>
            <ul className='space-y-2'>
              {task.checklist.map((item, index) => (
                <li
                  key={index}
                  className='flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50'
                >
                  <span className='h-5 w-5 flex items-center justify-center text-indigo-600 font-bold mt-0.5'>
                    •
                  </span>
                  <span className='text-sm text-gray-800'>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <button
            type='button'
            className='px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Status badge with appropriate color
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'upcoming':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'stopped':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'delayed':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'in progress':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <span
      className={`
    px-3 py-0.5
    rounded-full
    text-xs
    font-semibold
    border
    border-gray-200
    dark:border-gray-800
    ${getStatusColor(status)}
  `}
    >
      {status}
    </span>
  );
};

// State/location options for India
// const LOCATIONS = [
//   'Andhra Pradesh',
//   'Arunachal Pradesh',
//   'Assam',
//   'Bihar',
//   'Chhattisgarh',
//   'Goa',
//   'Gujarat',
//   'Haryana',
//   'Himachal Pradesh',
//   'Jharkhand',
//   'Karnataka',
//   'Kerala',
//   'Madhya Pradesh',
//   'Maharashtra',
//   'Manipur',
//   'Meghalaya',
//   'Mizoram',
//   'Nagaland',
//   'Odisha',
//   'Punjab',
//   'Rajasthan',
//   'Sikkim',
//   'Tamil Nadu',
//   'Telangana',
//   'Tripura',
//   'Uttar Pradesh',
//   'Uttarakhand',
//   'West Bengal',
//   'Andaman and Nicobar Islands',
//   'Chandigarh',
//   'Dadra and Nagar Haveli and Daman and Diu',
//   'Delhi',
//   'Jammu and Kashmir',
//   'Ladakh',
//   'Lakshadweep',
//   'Puducherry',
// ];

// Workshop type options
const WORKSHOP_TYPES = [
  { value: 'Online', label: 'Online' },
  { value: 'Offline', label: 'Offline' },
  { value: 'Hybrid', label: 'Hybrid' },
];

// Add ReplaceDoersDialog component
function ReplaceDoersDialog({
  open,
  onOpenChange,
  templateTasks,
  doers,
  taskDoers,
  setTaskDoers,
}) {
  const [currentDoer, setCurrentDoer] = useState('');
  const [newDoer, setNewDoer] = useState('');

  // Get unique doers with tasks in template
  const doersWithTasks = React.useMemo(() => {
    if (!templateTasks) return [];
    const uniqueDoers = [
      ...new Set(
        templateTasks
          .map((task) => taskDoers[task._id] || task.doer?._id)
          .filter(Boolean)
      ),
    ];
    return doers.filter((doer) => uniqueDoers.includes(doer._id));
  }, [templateTasks, doers, taskDoers]);

  // Get departments of current doer's tasks
  const currentDoerDepartments = React.useMemo(() => {
    if (!currentDoer || !templateTasks) return [];
    const tasks = templateTasks.filter(
      (task) => (taskDoers[task._id] || task.doer?._id) === currentDoer
    );
    return [
      ...new Set(tasks.map((task) => task.department?._id || task.department)),
    ];
  }, [currentDoer, templateTasks, taskDoers]);

  // Get available doers (excluding current doer, and only those in the same department(s))
  const availableDoers = React.useMemo(() => {
    return doers.filter(
      (doer) =>
        doer._id !== currentDoer &&
        doer.departments &&
        doer.departments.some((dep) =>
          currentDoerDepartments.includes(dep._id || dep)
        )
    );
  }, [doers, currentDoer, currentDoerDepartments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentDoer || !newDoer) {
      toast.error('Please select both current and new doer');
      return;
    }
    // Find all tasks assigned to the current doer
    const tasks = templateTasks.filter(
      (task) => (taskDoers[task._id] || task.doer?._id) === currentDoer
    );
    // Update taskDoers state with new doer for all these tasks
    const updatedTaskDoers = { ...taskDoers };
    tasks.forEach((task) => {
      updatedTaskDoers[task._id] = newDoer;
    });
    setTaskDoers(updatedTaskDoers);
    setCurrentDoer('');
    setNewDoer('');
    onOpenChange(false);
    toast.success(`Successfully replaced doer for ${tasks.length} tasks`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-800'>
            Replace Doers
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            Replace all tasks of a doer with another doer (from the same
            department)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>
              Current Doer
            </label>
            <Select value={currentDoer} onValueChange={setCurrentDoer}>
              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                <SelectValue placeholder='Select current doer' />
              </SelectTrigger>
              <SelectContent>
                {doersWithTasks.map((doer) => (
                  <SelectItem key={doer._id} value={doer._id}>
                    {doer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>
              New Doer
            </label>
            <Select value={newDoer} onValueChange={setNewDoer}>
              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                <SelectValue placeholder='Select new doer' />
              </SelectTrigger>
              <SelectContent>
                {availableDoers.map((doer) => (
                  <SelectItem key={doer._id} value={doer._id}>
                    {doer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-end gap-3'>
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              className='px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!currentDoer || !newDoer}
              className='px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50'
            >
              Replace Doers
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CreateWorkshop() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [templateTasks, setTemplateTasks] = useState([]);
  const [departmentalTasks, setDepartmentalTasks] = useState([]);
  const [activeTable, setActiveTable] = useState('individual');
  const [pcs, setPCs] = useState([]);
  const [eas, setEAs] = useState([]);
  const [doers, setDoers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Form state
  const [announcementDate, setAnnouncementDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [workshopType, setWorkshopType] = useState('Offline');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [code, setCode] = useState('');
  const [processCoordinator, setProcessCoordinator] = useState('');
  const [executiveAssistant, setExecutiveAssistant] = useState('');
  const [taskDoers, setTaskDoers] = useState({});

  // Update states for locations and venues
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Add state for replace doers dialog
  const [isReplaceDoersOpen, setIsReplaceDoersOpen] = useState(false);

  // Load template and employees
  useEffect(() => {
    const fetchData = async () => {
      if (!templateId) {
        setError('No template selected');
        setLoading(false);
        return;
      }

      try {
        const [templateRes, pcRes, eaRes, doerRes] = await Promise.all([
          axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/workshop/plan/templates/${templateId}`,
            { withCredentials: true }
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/setup/employees/by-role/PC`,
            { withCredentials: true }
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/setup/employees/by-role/EA`,
            { withCredentials: true }
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/setup/employees/by-role/Doer`,
            { withCredentials: true }
          ),
        ]);

        const template = templateRes.data.template;
        setTemplate(template);
        setTemplateTasks(template.tasks || []);
        setDepartmentalTasks(template.departmentalTasks || []);

        // Set default PCs and EAs from template
        setProcessCoordinator(template.processCoordinator?._id || '');
        setExecutiveAssistant(template.executiveAssistant?._id || '');

        // Set employee options for dropdowns
        setPCs(pcRes.data.employees || []);
        setEAs(eaRes.data.employees || []);
        setDoers(doerRes.data.employees || []);

        // Set default doers from template tasks
        const initialTaskDoers = {};
        template.tasks?.forEach((task) => {
          initialTaskDoers[task._id] = task.doer._id;
        });
        setTaskDoers(initialTaskDoers);

        setLoading(false);
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template details');
        setLoading(false);
      }
    };

    fetchData();
  }, [templateId]);

  // Fetch locations with their venues
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/master/locations`,
          { withCredentials: true }
        );
        setLocations(response.data.locations);
      } catch (err) {
        toast.error('Failed to fetch locations');
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Clear venue when location changes
  useEffect(() => {
    setVenue('');
  }, [location]);

  // Clear venue when workshop type changes to Online
  useEffect(() => {
    if (workshopType === 'Online') {
      setVenue('');
      setLocation('');
    }
  }, [workshopType]);

  // Helper function to get venues for selected location
  const getVenuesForLocation = () => {
    if (!location) return [];
    const selectedLocation = locations.find((loc) => loc.name === location);
    return selectedLocation?.venues || [];
  };

  const normalizeCode = (value = '') =>
    value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);

  // Update task doer
  const handleTaskDoerChange = (taskId, doerId) => {
    setTaskDoers((prev) => ({
      ...prev,
      [taskId]: doerId,
    }));
  };

  // Function to handle checklist view
  const handleViewChecklist = (task) => {
    setSelectedTask(task);
    setIsChecklistOpen(true);
  };

  // Helper to generate workshopId preview
  const getWorkshopIdPreview = () => {
    if (!template || !template.workshopName || !eventDate) return '-';
    const typeAbbr = template.workshopName.abbreviation;
    const locAbbr =
      workshopType === 'Online'
        ? 'ONL'
        : location
        ? location.slice(0, 3).toUpperCase()
        : '';
    const evt = new Date(eventDate);
    if (isNaN(evt.getTime())) return '-';
    const day = String(evt.getDate()).padStart(2, '0');
    const month = evt.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = evt.getFullYear();
    const normalizedCode = normalizeCode(code);
    const codeSegment = normalizedCode ? `-${normalizedCode}` : '';
    return `${typeAbbr}-${locAbbr}-${day}-${month}-${year}${codeSegment}`;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!announcementDate || !eventDate || !workshopType) {
      toast.error('Please fill all required fields');
      return;
    }
    if (
      (workshopType === 'Offline' || workshopType === 'Hybrid') &&
      !location
    ) {
      toast.error('Location is required for Offline and Hybrid workshops');
      return;
    }

    // Check if event date is after announcement date
    const prepDate = new Date(announcementDate);
    const evtDate = new Date(eventDate);

    if (evtDate <= prepDate) {
      toast.error('Event date must be after announcement date');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Format dates to YYYY-MM-DD without time component
      const formatDate = (date) => {
        return date.split('T')[0]; // Handle ISO format if present
      };

      // Prepare payload
      const normalizedCode = normalizeCode(code);
      const payload = {
        templateId,
        announcementDate: formatDate(announcementDate),
        eventDate: formatDate(eventDate),
        type: workshopType,
        location,
        venue: workshopType === 'Online' ? '' : venue, // Only include venue if not Online
        code: normalizedCode || undefined,
        processCoordinator,
        executiveAssistant,
        taskDoers,
      };

      console.log('Submitting workshop:', payload);

      // Submit workshop creation request
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/plan`,
        payload,
        { withCredentials: true }
      );

      toast.success('Workshop created successfully!');
      navigate(`/workshop/${response.data.workshop._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create workshop';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className='p-6 text-center'>Loading template details...</div>;
  }

  if (error && !template) {
    return <div className='p-6 text-center text-red-500'>{error}</div>;
  }

  return (
    <div className='p-4 md:p-8 max-w-full mx-auto bg-gray-50 min-h-screen'>
      <div className='flex flex-col sm:flex-row items-center gap-4 mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight'>
          Create Workshop: {template?.name}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* Workshop Details */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-800'>
            <h2 className='text-xl font-bold text-gray-800 mb-1'>
              Workshop Details
            </h2>
            <p className='text-gray-600 text-sm'>
              Set the basic information for your workshop
            </p>
          </div>
          <div className='p-6 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Workshop Name
                </label>
                <Input
                  value={template?.workshopName?.name}
                  readOnly
                  className='bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                />
              </div>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Workshop Type *
                </label>
                <Select
                  value={workshopType}
                  onValueChange={setWorkshopType}
                  required
                >
                  <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                    <SelectValue placeholder='Select' />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSHOP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Announcement Date *
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-2.5'>
                    <Calendar className='h-4 w-4 text-gray-400' />
                  </div>
                  <Input
                    type='date'
                    className='pl-10'
                    value={announcementDate}
                    onChange={(e) => setAnnouncementDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Event Date *
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-2.5'>
                    <Calendar className='h-4 w-4 text-gray-400' />
                  </div>
                  <Input
                    type='date'
                    className='pl-10'
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    min={
                      announcementDate || new Date().toISOString().split('T')[0]
                    }
                  />
                </div>
              </div>
              {(workshopType === 'Offline' || workshopType === 'Hybrid') && (
                <div>
                  <label className='block mb-1 text-sm font-semibold text-gray-700'>
                    Location *
                  </label>
                  <Select
                    value={location}
                    onValueChange={setLocation}
                    required
                    disabled={loadingLocations}
                  >
                    <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                      <SelectValue
                        placeholder={
                          loadingLocations ? 'Loading...' : 'Select location'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc._id} value={loc.name}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(workshopType === 'Offline' || workshopType === 'Hybrid') && (
                <div>
                  <label className='block mb-1 text-sm font-semibold text-gray-700'>
                    Venue
                  </label>
                  <Select
                    value={venue}
                    onValueChange={(value) =>
                      setVenue(value === 'none' ? '' : value)
                    }
                    disabled={!location}
                  >
                    <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                      <SelectValue placeholder='Select venue' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Clear Selection</SelectItem>
                      {getVenuesForLocation().map((ven) => (
                        <SelectItem key={ven._id} value={ven.name}>
                          {ven.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(normalizeCode(e.target.value))}
                  placeholder='Up to 5 letters/numbers'
                  inputMode='text'
                  pattern='[A-Za-z0-9]{0,5}'
                  maxLength={5}
                />
              </div>
            </div>
            <div>
              <label className='block mb-1 text-sm font-semibold text-gray-700'>
                Workshop ID (Preview)
              </label>
              <Input
                value={getWorkshopIdPreview()}
                readOnly
                className='bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
              />
            </div>
          </div>
        </div>

        {/* Team Assignment */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-800'>
            <h2 className='text-xl font-bold text-gray-800 mb-1'>
              Team Assignment
            </h2>
            <p className='text-gray-600 text-sm'>
              Assign people to workshop roles (optional)
            </p>
          </div>
          <div className='p-6 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Process Coordinator
                </label>
                <Select
                  value={processCoordinator}
                  onValueChange={setProcessCoordinator}
                >
                  <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                    <SelectValue
                      placeholder={`Default: ${template?.processCoordinator?.name}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {pcs.map((pc) => (
                      <SelectItem key={pc._id} value={pc._id}>
                        {pc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Executive Assistant
                </label>
                <Select
                  value={executiveAssistant}
                  onValueChange={setExecutiveAssistant}
                >
                  <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                    <SelectValue
                      placeholder={`Default: ${template?.executiveAssistant?.name}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {eas.map((ea) => (
                      <SelectItem key={ea._id} value={ea._id}>
                        {ea.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Task Assignments */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold text-gray-800 mb-1'>Task Assignments</h2>
              <p className='text-gray-600 text-sm'>
                {activeTable === 'individual'
                  ? 'Override doers for individual tasks if needed.'
                  : 'Departmental tasks are auto-assigned to all employees in the department.'}
              </p>
            </div>
            {activeTable === 'individual' && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsReplaceDoersOpen(true)}
                className='flex items-center gap-2'
              >
                <User className='h-4 w-4' />
                Replace Doers
              </Button>
            )}
          </div>
          <div className='p-6 space-y-4'>

            {/* Toggle */}
            <div className='flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit'>
              <button
                type='button'
                onClick={() => setActiveTable('individual')}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition ${
                  activeTable === 'individual'
                    ? 'bg-white text-indigo-700 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Individual Tasks
                {templateTasks.length > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTable === 'individual' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                    {templateTasks.length}
                  </span>
                )}
              </button>
              <button
                type='button'
                onClick={() => setActiveTable('departmental')}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition ${
                  activeTable === 'departmental'
                    ? 'bg-white text-amber-700 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Departmental Tasks
                {departmentalTasks.length > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTable === 'departmental' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                    {departmentalTasks.length}
                  </span>
                )}
              </button>
            </div>

            {/* Individual Tasks Table */}
            <div className={activeTable === 'individual' ? '' : 'hidden'}>
              <div className='relative flex flex-col w-full overflow-hidden'>
                <div className='max-h-[600px] overflow-y-auto overflow-x-auto'>
                  <table className='table-fixed w-full' style={{ tableLayout: 'fixed' }}>
                    <thead className='sticky top-0 z-10 shadow-sm bg-gray-100 dark:bg-gray-800'>
                      <tr>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[260px] text-left'>Task ID</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[400px] text-left'>Description</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[180px] text-left'>Department</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[180px] text-left'>Frequency</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[100px] text-left'>Critical</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[220px] text-left'>Doer</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[120px] text-center'>Checklist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templateTasks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className='text-center py-8 text-gray-400'>No individual tasks found.</td>
                        </tr>
                      ) : (
                        templateTasks.map((task) => (
                          <tr key={task._id}>
                            <td className='px-6 py-4 w-[260px]'>
                              <div className='break-words whitespace-normal flex items-center gap-1'>
                                {task.taskId || 'No ID'}
                                {task.isCritical && <Star className='h-4 w-4 text-amber-500' fill='currentColor' />}
                              </div>
                            </td>
                            <td className='px-6 py-4 font-medium w-[400px]'>
                              <div className='break-words whitespace-normal'>{task.narration || 'No description'}</div>
                            </td>
                            <td className='px-6 py-4 w-[180px]'>
                              <div className='break-words whitespace-normal'>{task.department?.name || 'Not assigned'}</div>
                            </td>
                            <td className='px-6 py-4 w-[180px]'>
                              <div className='break-words whitespace-normal'>{task.frequency || 'Not specified'}</div>
                            </td>
                            <td className='px-6 py-4 w-[100px]'>{task.isCritical ? 'Yes' : 'No'}</td>
                            <td className='px-6 py-4 w-[220px]'>
                              <Select
                                value={taskDoers[task._id] || task.doer?._id || ''}
                                onValueChange={(value) => handleTaskDoerChange(task._id, value)}
                              >
                                <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                                  <SelectValue placeholder={`Default: ${task.doer?.name || 'None'}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {doers
                                    .filter((doer) =>
                                      doer.departments &&
                                      doer.departments.some((dep) => dep._id === (task.department?._id || task.department))
                                    )
                                    .map((doer) => (
                                      <SelectItem key={doer._id} value={doer._id}>{doer.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className='px-6 py-4 text-center w-[120px]'>
                              {task.checklist && task.checklist.length > 0 ? (
                                <button
                                  type='button'
                                  className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewChecklist(task); }}
                                  title='View Checklist'
                                >
                                  <List className='h-4 w-4' />
                                </button>
                              ) : (
                                <span className='text-gray-400 text-sm'>—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Departmental Tasks Table */}
            <div className={activeTable === 'departmental' ? '' : 'hidden'}>
              <div className='mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800'>
                These tasks will be automatically assigned to every active employee in the department when the workshop is created.
              </div>
              <div className='relative flex flex-col w-full overflow-hidden'>
                <div className='max-h-[600px] overflow-y-auto overflow-x-auto'>
                  <table className='table-fixed w-full' style={{ tableLayout: 'fixed' }}>
                    <thead className='sticky top-0 z-10 shadow-sm bg-gray-100 dark:bg-gray-800'>
                      <tr>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[260px] text-left'>Task ID</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[500px] text-left'>Description</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[200px] text-left'>Department</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[180px] text-left'>Frequency</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[100px] text-left'>Critical</th>
                        <th className='px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[120px] text-center'>Checklist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentalTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className='text-center py-8 text-gray-400'>No departmental tasks in this template.</td>
                        </tr>
                      ) : (
                        departmentalTasks.map((task) => (
                          <tr key={task._id} className='hover:bg-amber-50 transition'>
                            <td className='px-6 py-4 w-[260px]'>
                              <div className='break-words whitespace-normal flex items-center gap-1'>
                                {task.taskId || 'No ID'}
                                {task.isCritical && <Star className='h-4 w-4 text-amber-500' fill='currentColor' />}
                              </div>
                            </td>
                            <td className='px-6 py-4 font-medium w-[500px]'>
                              <div className='break-words whitespace-normal'>{task.narration || 'No description'}</div>
                            </td>
                            <td className='px-6 py-4 w-[200px]'>
                              <div className='break-words whitespace-normal'>{task.department?.name || 'Not assigned'}</div>
                            </td>
                            <td className='px-6 py-4 w-[180px]'>
                              <div className='break-words whitespace-normal'>{task.frequency || 'Not specified'}</div>
                            </td>
                            <td className='px-6 py-4 w-[100px]'>{task.isCritical ? 'Yes' : 'No'}</td>
                            <td className='px-6 py-4 text-center w-[120px]'>
                              {task.checklist && task.checklist.length > 0 ? (
                                <button
                                  type='button'
                                  className='cursor-pointer p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition'
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewChecklist(task); }}
                                  title='View Checklist'
                                >
                                  <List className='h-4 w-4' />
                                </button>
                              ) : (
                                <span className='text-gray-400 text-sm'>—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>

        {error && <div className='text-red-500 text-center'>{error}</div>}

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/workshop/plan')}
            className='px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={submitting}
            className='px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50'
          >
            {submitting ? 'Creating...' : 'Create Workshop'}
          </Button>
        </div>
      </form>

      {/* Checklist Dialog */}
      <ChecklistDialog
        task={selectedTask}
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
      />

      {/* ReplaceDoersDialog */}
      <ReplaceDoersDialog
        open={isReplaceDoersOpen}
        onOpenChange={setIsReplaceDoersOpen}
        templateTasks={templateTasks}
        doers={doers}
        taskDoers={taskDoers}
        setTaskDoers={setTaskDoers}
      />
    </div>
  );
}
