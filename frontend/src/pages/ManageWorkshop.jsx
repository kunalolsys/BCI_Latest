import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Tag,
  Star,
  Save,
  List,
  ClipboardCheck,
  AlertTriangle,
  Building,
  CaseUpper,
} from 'lucide-react';

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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

// Doer Task Count Confirmation Dialog
function DoerTaskCountDialog({
  open,
  onOpenChange,
  doer,
  taskCount,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl font-bold text-amber-600'>
            <AlertTriangle className='h-5 w-5' />
            Confirm Doer Assignment
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            {doer?.name} currently has {taskCount} pending task
            {taskCount !== 1 ? 's' : ''}. Are you sure you want to assign this
            task to them?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type='button'
            className='px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type='button'
            className='px-5 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition'
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Confirm Assignment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add ReplaceDoersDialog component after DoerTaskCountDialog
function ReplaceDoersDialog({
  open,
  onOpenChange,
  workshop,
  doers,
  taskDoers,
  setTaskDoers,
}) {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [currentDoer, setCurrentDoer] = useState('');
  const [newDoer, setNewDoer] = useState('');

  // Get departments that have pending tasks with doers assigned
  const departmentsWithPendingTasks = React.useMemo(() => {
    if (!workshop?.tasks) return [];
    const pendingTasks = workshop.tasks.filter(
      (task) => task.status?.toLowerCase() === 'pending' && task.doer && task.department
    );
    const deptMap = new Map();
    pendingTasks.forEach((task) => {
      const deptId = task.department?._id || task.department;
      const deptName = task.department?.name || 'Unknown';
      if (deptId && !deptMap.has(deptId)) {
        deptMap.set(deptId, { _id: deptId, name: deptName });
      }
    });
    return Array.from(deptMap.values());
  }, [workshop?.tasks]);

  // Get current doers from selected department (doers assigned to pending tasks in that department)
  const currentDoersInDepartment = React.useMemo(() => {
    if (!selectedDepartment || !workshop?.tasks) return [];
    
    // Get pending tasks in the selected department that have doers assigned
    const pendingTasksInDept = workshop.tasks.filter(
      (task) =>
        task.status?.toLowerCase() === 'pending' &&
        (task.department?._id === selectedDepartment || task.department === selectedDepartment) &&
        task.doer
    );
    
    // Get unique doer IDs from these tasks
    const uniqueDoerIds = [
      ...new Set(pendingTasksInDept.map((task) => task.doer?._id).filter((id) => id)),
    ];
    
    // Return doers that are in the selected department and assigned to tasks
    return doers.filter(
      (doer) =>
        uniqueDoerIds.includes(doer._id) &&
        doer.departments &&
        doer.departments.some((dep) => dep._id === selectedDepartment || dep === selectedDepartment)
    );
  }, [selectedDepartment, workshop?.tasks, doers]);

  // Get available new doers from selected department (excluding current doer)
  const availableDoers = React.useMemo(() => {
    if (!selectedDepartment || !currentDoer) return [];
    return doers.filter(
      (doer) =>
        doer._id !== currentDoer &&
        doer.departments &&
        doer.departments.some((dep) => dep._id === selectedDepartment || dep === selectedDepartment)
    );
  }, [doers, selectedDepartment, currentDoer]);

  // Reset doers when department changes
  React.useEffect(() => {
    setCurrentDoer('');
    setNewDoer('');
  }, [selectedDepartment]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedDepartment('');
      setCurrentDoer('');
      setNewDoer('');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDepartment || !currentDoer || !newDoer) {
      toast.error('Please select department, current doer, and new doer');
      return;
    }

    // Find all pending tasks in the selected department assigned to the current doer
    const pendingTasks = workshop.tasks.filter(
      (task) =>
        task.status?.toLowerCase() === 'pending' &&
        (task.department?._id === selectedDepartment || task.department === selectedDepartment) &&
        task.doer?._id === currentDoer
    );

    if (pendingTasks.length === 0) {
      toast.error('No pending tasks found for the selected doer in this department');
      return;
    }

    // Update taskDoers state with new doer for all pending tasks in the selected department
    const updatedTaskDoers = { ...taskDoers };
    pendingTasks.forEach((task) => {
      updatedTaskDoers[task._id] = newDoer;
    });
    setTaskDoers(updatedTaskDoers);

    // Reset form and close dialog
    setSelectedDepartment('');
    setCurrentDoer('');
    setNewDoer('');
    onOpenChange(false);
    toast.success(
      `Successfully replaced doer for ${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} in this department. Please save your changes.`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl font-bold text-gray-800'>
            <User className='h-5 w-5 text-indigo-600' />
            Replace Doers
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            Select a department, then replace all pending tasks of a doer with another doer from the same department
          </DialogDescription>
        </DialogHeader>

        <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800'>
          Please save your changes after replacing doers for them to take effect.
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>
              Department *
            </label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                <SelectValue placeholder='Select department' />
              </SelectTrigger>
              <SelectContent>
                {departmentsWithPendingTasks.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDepartment && (
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                Current Doer *
              </label>
              <Select value={currentDoer} onValueChange={setCurrentDoer}>
                <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                  <SelectValue placeholder='Select current doer' />
                </SelectTrigger>
                <SelectContent>
                  {currentDoersInDepartment.length === 0 ? (
                    <SelectItem value='' disabled>
                      No doers found in this department
                    </SelectItem>
                  ) : (
                    currentDoersInDepartment.map((doer) => (
                      <SelectItem key={doer._id} value={doer._id}>
                        {doer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDepartment && currentDoer && availableDoers.length > 0 && (
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                New Doer *
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
          )}
          
          {selectedDepartment && currentDoer && availableDoers.length === 0 && (
            <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800'>
              No doer available to replace in this department.
            </div>
          )}

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
              disabled={!selectedDepartment || !currentDoer || !newDoer}
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

// Helper function to get base task ID (removes the /XX part)
const getBaseTaskId = (taskId) => {
  if (!taskId) return '';
  return taskId.split('/')[0];
};

// Helper function to check if task is a daily task
const isDailyTask = (taskId) => {
  if (!taskId) return false;
  return taskId.includes('/');
};

const isDepartmentalTask = (taskId) => {
  if (!taskId) return false;
  return /-D-\d+/.test(taskId);
};

// Helper function to group tasks by base ID and doer
const groupTasks = (tasks) => {
  const groupedTasks = new Map();

  tasks.forEach((task) => {
    const baseId = getBaseTaskId(task.taskId);
    const key = `${baseId}-${task.doer?._id || 'unassigned'}`;

    if (!groupedTasks.has(key)) {
      groupedTasks.set(key, {
        ...task,
        dailyEntries: [task],
        isDailyTask: isDailyTask(task.taskId),
      });
    } else {
      const existingTask = groupedTasks.get(key);
      existingTask.dailyEntries.push(task);
    }
  });

  return Array.from(groupedTasks.values());
};

export default function ManageWorkshop() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data states
  const [workshop, setWorkshop] = useState(null);
  const [pcs, setPCs] = useState([]);
  const [eas, setEAs] = useState([]);
  const [doers, setDoers] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Form states
  const [processCoordinator, setProcessCoordinator] = useState('');
  const [executiveAssistant, setExecutiveAssistant] = useState('');
  const [taskDoers, setTaskDoers] = useState({});
  const [selectedDoer, setSelectedDoer] = useState(null);
  const [isTaskCountOpen, setIsTaskCountOpen] = useState(false);
  const [doerTaskCount, setDoerTaskCount] = useState(0);
  const [pendingDoerChange, setPendingDoerChange] = useState(null);

  // Add new state for venues
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [venue, setVenue] = useState('');

  // Add new state for replace doers dialog
  const [isReplaceDoersOpen, setIsReplaceDoersOpen] = useState(false);
  const [activeTaskTable, setActiveTaskTable] = useState('individual');

  // Load workshop and employee data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch workshop details and employees in parallel
        const [workshopRes, pcRes, eaRes, doerRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/workshop/${id}`, {
            withCredentials: true,
          }),
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

        const workshopData = {
          ...workshopRes.data.workshop,
          tasks: workshopRes.data.workshop.tasks || [],
        };

        setWorkshop(workshopData);
        setVenue(workshopData.venue || '');

        // Set employee options for dropdowns
        setPCs(pcRes.data.employees || []);
        setEAs(eaRes.data.employees || []);
        setDoers(doerRes.data.employees || []);

        // Initialize form values from current workshop data
        setProcessCoordinator(workshopData.processCoordinator?._id || '');
        setExecutiveAssistant(workshopData.executiveAssistant?._id || '');

        // Initialize task doers map
        const initialTaskDoers = {};
        workshopData.tasks.forEach((task) => {
          initialTaskDoers[task._id] = task.doer?._id || '';
        });
        setTaskDoers(initialTaskDoers);

        setLoading(false);
      } catch (err) {
        console.error('Error loading workshop details:', err);
        setError(
          err.response?.data?.message || 'Failed to load workshop details'
        );
        setLoading(false);
        toast.error(
          err.response?.data?.message || 'Failed to load workshop details'
        );
      }
    };

    fetchData();
  }, [id]);

  // Fetch venues when workshop loads
  useEffect(() => {
    const fetchVenues = async () => {
      if (!workshop?.location) return;

      setLoadingVenues(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/master/locations/${
            workshop.location
          }/venues`,
          { withCredentials: true }
        );
        setVenues(response.data.venues);
      } catch (err) {
        toast.error('Failed to fetch venues');
      } finally {
        setLoadingVenues(false);
      }
    };

    fetchVenues();
  }, [workshop?.location]);

  // Function to fetch doer's task count
  const fetchDoerTaskCount = async (doerId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/tasks/count/${doerId}`,
        { withCredentials: true }
      );
      return response.data.count;
    } catch (err) {
      console.error('Error fetching doer task count:', err);
      return 0;
    }
  };

  // Modified task doer change handler
  const handleTaskDoerChange = async (taskId, doerId) => {
    const isOngoing =
      workshop.status && workshop.status.toLowerCase() === 'ongoing';
    const task = workshop.tasks.find((t) => t._id === taskId);
    const isPendingTask =
      task && task.status && task.status.toLowerCase() === 'pending';

    // For upcoming workshops, update directly
    if (workshop.status.toLowerCase() === 'upcoming') {
      // If it's a daily task, update all related daily tasks
      if (isDailyTask(task.taskId)) {
        const baseId = getBaseTaskId(task.taskId);
        const relatedTasks = workshop.tasks.filter(
          (t) =>
            getBaseTaskId(t.taskId) === baseId && t.doer?._id === task.doer?._id
        );

        const updatedTaskDoers = { ...taskDoers };
        relatedTasks.forEach((t) => {
          updatedTaskDoers[t._id] = doerId;
        });
        setTaskDoers(updatedTaskDoers);
      } else {
        setTaskDoers((prev) => ({
          ...prev,
          [taskId]: doerId,
        }));
      }
      return;
    }

    if (isOngoing && isPendingTask) {
      // For ongoing workshops with pending tasks, show confirmation
      const count = await fetchDoerTaskCount(doerId);
      const doer = doers.find((d) => d._id === doerId);

      setSelectedDoer(doer);
      setDoerTaskCount(count);
      setPendingDoerChange({
        taskId,
        doerId,
        isDailyTask: isDailyTask(task.taskId),
      });
      setIsTaskCountOpen(true);
    } else {
      // For other cases, update directly
      if (isDailyTask(task.taskId)) {
        const baseId = getBaseTaskId(task.taskId);
        const relatedTasks = workshop.tasks.filter(
          (t) =>
            getBaseTaskId(t.taskId) === baseId && t.doer?._id === task.doer?._id
        );

        const updatedTaskDoers = { ...taskDoers };
        relatedTasks.forEach((t) => {
          updatedTaskDoers[t._id] = doerId;
        });
        setTaskDoers(updatedTaskDoers);
      } else {
        setTaskDoers((prev) => ({
          ...prev,
          [taskId]: doerId,
        }));
      }
    }
  };

  // Function to handle confirmed doer change
  const handleConfirmedDoerChange = () => {
    if (pendingDoerChange) {
      if (pendingDoerChange.isDailyTask) {
        const task = workshop.tasks.find(
          (t) => t._id === pendingDoerChange.taskId
        );
        const baseId = getBaseTaskId(task.taskId);
        const relatedTasks = workshop.tasks.filter(
          (t) =>
            getBaseTaskId(t.taskId) === baseId && t.doer?._id === task.doer?._id
        );

        const updatedTaskDoers = { ...taskDoers };
        relatedTasks.forEach((t) => {
          updatedTaskDoers[t._id] = pendingDoerChange.doerId;
        });
        setTaskDoers(updatedTaskDoers);
      } else {
        setTaskDoers((prev) => ({
          ...prev,
          [pendingDoerChange.taskId]: pendingDoerChange.doerId,
        }));
      }
      setPendingDoerChange(null);
    }
  };

  // Function to handle checklist view
  const handleViewChecklist = (task) => {
    setSelectedTask(task);
    setIsChecklistOpen(true);
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      let filteredTaskDoers = { ...taskDoers };

      // For ongoing workshops, only allow updating pending tasks
      if (workshop.status && workshop.status.toLowerCase() === 'ongoing') {
        const pendingTaskIds = workshop.tasks
          .filter(
            (task) => task.status && task.status.toLowerCase() === 'pending'
          )
          .map((task) => task._id);

        // Filter taskDoers to only include pending tasks
        filteredTaskDoers = {};
        pendingTaskIds.forEach((taskId) => {
          if (taskDoers[taskId]) {
            filteredTaskDoers[taskId] = taskDoers[taskId];
          }
        });
      }

      // Prepare payload with only editable fields
      const payload = {
        processCoordinator,
        executiveAssistant,
        taskDoers: filteredTaskDoers,
        venue: workshop.type === 'Online' ? '' : venue, // Only include venue if not Online
      };

      // Submit workshop update request
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/${id}`,
        payload,
        { withCredentials: true }
      );

      toast.success('Workshop assignments updated successfully!');
      navigate(`/workshop/${id}`);
    } catch (err) {
      console.error('Error updating workshop:', err);
      setError(err.response?.data?.message || 'Failed to update workshop');
      toast.error(err.response?.data?.message || 'Failed to update workshop');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className='p-6 text-center'>Loading workshop details...</div>;
  }

  if (error && !workshop) {
    return (
      <div className='flex flex-col h-[calc(100vh-80px)] items-center justify-center bg-gray-50'>
        <div className='text-lg text-red-600 font-semibold mb-6'>{error}</div>
        <button
          type='button'
          onClick={() => navigate('/workshop/plan')}
          className='px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition'
        >
          Go Back to Workshops
        </button>
      </div>
    );
  }

  // Determine which tasks can be edited based on workshop status
  const isOngoing =
    workshop.status && workshop.status.toLowerCase() === 'ongoing';
  const editableTasks = isOngoing
    ? workshop.tasks.filter(
        (task) => task.status && task.status.toLowerCase() === 'pending'
      )
    : workshop.tasks;

  const editableIndividual = editableTasks.filter(t => !isDepartmentalTask(t.taskId));
  const editableDepartmental = editableTasks.filter(t => isDepartmentalTask(t.taskId));

  return (
    <div className='p-4 md:p-8 max-w-full mx-auto bg-gray-50 min-h-screen'>
      <div className='flex flex-col sm:flex-row items-center gap-4 mb-8'>
        <button
          type='button'
          onClick={() => navigate(`/workshop/${id}`)}
          className='cursor-pointer flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </button>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight'>
          Edit Workshop
        </h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* Workshop Header Card */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 mb-8'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-800'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='text-2xl font-bold text-gray-800'>
                    {workshop.workshopId}
                  </span>
                  <StatusBadge status={workshop.status} />
                </div>
                <div className='mt-1 text-gray-600 text-sm'>
                  Template:{' '}
                  {workshop.workshopTemplate?.workshopName
                    ? `${workshop.workshopTemplate.workshopName.name} (${workshop.workshopTemplate.workshopName.abbreviation})`
                    : workshop.workshopTemplate?.name || '-'}
                </div>
              </div>
            </div>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='flex items-start gap-2'>
                <Calendar className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <div className='text-sm font-medium text-gray-700'>
                    Announcement Date
                  </div>
                  <div className='text-gray-800'>
                    {formatDate(workshop.announcementDate)}
                  </div>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Clock className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <div className='text-sm font-medium text-gray-700'>
                    Event Date
                  </div>
                  <div className='text-gray-800'>
                    {formatDate(workshop.eventDate)}
                  </div>
                </div>
              </div>
              {(workshop.type === 'Offline' || workshop.type === 'Hybrid') &&
                workshop.location && (
                  <div className='flex items-start gap-2'>
                    <MapPin className='h-5 w-5 text-gray-400 mt-0.5' />
                    <div>
                      <div className='text-sm font-medium text-gray-700'>
                        Location
                      </div>
                      <div className='text-gray-800'>{workshop.location}</div>
                    </div>
                  </div>
                )}
              {(workshop.type === 'Offline' || workshop.type === 'Hybrid') && (
                <div className='flex items-start gap-2'>
                  <Building className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <div className='text-sm font-medium text-gray-700 mb-2'>
                      Venue
                    </div>
                    <Select
                      value={venue}
                      onValueChange={(value) =>
                        setVenue(value === 'none' ? '' : value)
                      }
                      disabled={loadingVenues}
                    >
                      <SelectTrigger className='w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                        <SelectValue
                          placeholder={
                            loadingVenues ? 'Loading...' : 'Select venue'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>Clear Selection</SelectItem>
                        {venues.map((ven) => (
                          <SelectItem key={ven._id} value={ven.name}>
                            {ven.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className='flex items-start gap-2'>
                <Tag className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <div className='text-sm font-medium text-gray-700'>Type</div>
                  <div className='text-gray-800'>{workshop.type}</div>
                </div>
              </div>
              {workshop.code && (
              <div className='flex items-start gap-2'>
                <CaseUpper className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <div className='text-sm font-medium text-gray-700'>Code</div>
                    <div className='text-gray-800'>{workshop.code}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Assignment Card */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-800'>
            <h2 className='text-xl font-bold text-gray-800 mb-1'>
              Team Assignment
            </h2>
            <p className='text-gray-600 text-sm'>
              Update workshop coordinators
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
                    <SelectValue placeholder='Select Process Coordinator' />
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
                    <SelectValue placeholder='Select Executive Assistant' />
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

        {/* Task Assignments Card */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-bold text-gray-800 mb-1'>Task Assignments</h2>
              <p className='text-gray-600 text-sm'>
                {isOngoing ? 'Assign doers to pending tasks (ongoing workshop)' : 'Assign doers to workshop tasks'}
              </p>
            </div>
            {activeTaskTable === 'individual' && (
              <button
                type='button'
                onClick={() => setIsReplaceDoersOpen(true)}
                className='cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
              >
                <User className='h-4 w-4' />
                Replace Doers
              </button>
            )}
          </div>
          <div className='p-6 space-y-4'>
            {/* Toggle */}
            <div className='flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit'>
              <button
                type='button'
                onClick={() => setActiveTaskTable('individual')}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition ${activeTaskTable === 'individual' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Individual Tasks
                {editableIndividual.length > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTaskTable === 'individual' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                    {groupTasks(editableIndividual).length}
                  </span>
                )}
              </button>
              <button
                type='button'
                onClick={() => setActiveTaskTable('departmental')}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition ${activeTaskTable === 'departmental' ? 'bg-white text-amber-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Departmental Tasks
                {editableDepartmental.length > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTaskTable === 'departmental' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                    {editableDepartmental.length}
                  </span>
                )}
              </button>
            </div>

            {/* Individual tasks table */}
            <div className={activeTaskTable === 'individual' ? '' : 'hidden'}>
              <div className='relative flex flex-col w-full overflow-y-auto'>
                <table className='table-fixed w-full' style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[260px] text-left'>Task ID</th>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[400px] text-left'>Description</th>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[180px] text-left'>Department</th>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[140px] text-left'>Due Date</th>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[130px] text-left'>Status</th>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[200px] text-left'>Doer</th>
                      <th className='px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-[120px] text-center'>Checklist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableIndividual.length === 0 ? (
                      <tr><td colSpan={7} className='text-center py-8 text-gray-400'>{isOngoing ? 'No pending individual tasks.' : 'No individual tasks.'}</td></tr>
                    ) : (
                      groupTasks(editableIndividual).map((task, idx) => (
                        <tr key={task._id} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                          <td className='px-6 py-4 w-[260px]'>
                            <div className='break-words whitespace-normal flex items-center gap-1'>
                              {task.isDailyTask ? (
                                <div className='flex flex-col'>
                                  <span>{getBaseTaskId(task.taskId)}</span>
                                  <span className='text-xs text-gray-500'>{task.dailyEntries.length} daily entries</span>
                                </div>
                              ) : (task.taskId || 'No ID')}
                              {task.isCritical && <Star className='h-4 w-4 text-amber-500' fill='currentColor' />}
                            </div>
                          </td>
                          <td className='px-6 py-4 font-medium w-[400px]'><div className='break-words whitespace-normal'>{task.narration || 'No description'}</div></td>
                          <td className='px-6 py-4 w-[180px]'><div className='break-words whitespace-normal'>{task.department?.name || '—'}</div></td>
                          <td className='px-6 py-4 w-[140px]'><div className='break-words whitespace-normal'>{formatDate(task.endDate)}</div></td>
                          <td className='px-6 py-4 w-[130px]'><StatusBadge status={task.status || 'Unknown'} /></td>
                          <td className='px-6 py-4 w-[200px]'>
                            <Select value={taskDoers[task._id] || ''} onValueChange={(value) => handleTaskDoerChange(task._id, value)}>
                              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                                <SelectValue placeholder='Select doer' />
                              </SelectTrigger>
                              <SelectContent>
                                {doers.filter(d => d.departments && d.departments.some(dep => dep._id === (task.department?._id || task.department))).map(d => (
                                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className='px-6 py-4 text-center w-[120px]'>
                            {task.checklist && task.checklist.length > 0 ? (
                              <button type='button' className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition' onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewChecklist(task); }}>
                                <List className='h-4 w-4' />
                              </button>
                            ) : <span className='text-gray-400 text-sm'>—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Departmental tasks table — one row per employee assignment */}
            <div className={activeTaskTable === 'departmental' ? '' : 'hidden'}>
              <div className='relative flex flex-col w-full overflow-y-auto'>
                <table className='table-fixed w-full' style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[260px] text-left'>Task ID</th>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[400px] text-left'>Description</th>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[180px] text-left'>Department</th>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[140px] text-left'>Due Date</th>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[130px] text-left'>Status</th>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[200px] text-left'>Assignee</th>
                      <th className='px-6 py-3 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 bg-amber-50 w-[120px] text-center'>Checklist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableDepartmental.length === 0 ? (
                      <tr><td colSpan={7} className='text-center py-8 text-gray-400'>{isOngoing ? 'No pending departmental tasks.' : 'No departmental tasks.'}</td></tr>
                    ) : (
                      editableDepartmental.map((task, idx) => (
                        <tr key={task._id} className={idx % 2 === 1 ? 'bg-amber-50/40' : 'hover:bg-amber-50 transition'}>
                          <td className='px-6 py-4 w-[260px]'>
                            <div className='break-words whitespace-normal flex items-center gap-1'>
                              {task.taskId || 'No ID'}
                              {task.isCritical && <Star className='h-4 w-4 text-amber-500' fill='currentColor' />}
                            </div>
                          </td>
                          <td className='px-6 py-4 font-medium w-[400px]'><div className='break-words whitespace-normal'>{task.narration || 'No description'}</div></td>
                          <td className='px-6 py-4 w-[180px]'><div className='break-words whitespace-normal'>{task.department?.name || '—'}</div></td>
                          <td className='px-6 py-4 w-[140px]'><div className='break-words whitespace-normal'>{formatDate(task.endDate)}</div></td>
                          <td className='px-6 py-4 w-[130px]'><StatusBadge status={task.status || 'Unknown'} /></td>
                          <td className='px-6 py-4 w-[200px]'>
                            <Select value={taskDoers[task._id] || ''} onValueChange={(value) => handleTaskDoerChange(task._id, value)}>
                              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition'>
                                <SelectValue placeholder={task.doer?.name || 'Select assignee'} />
                              </SelectTrigger>
                              <SelectContent>
                                {doers.filter(d => d.departments && d.departments.some(dep => dep._id === (task.department?._id || task.department))).map(d => (
                                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className='px-6 py-4 text-center w-[120px]'>
                            {task.checklist && task.checklist.length > 0 ? (
                              <button type='button' className='cursor-pointer p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition' onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewChecklist(task); }}>
                                <List className='h-4 w-4' />
                              </button>
                            ) : <span className='text-gray-400 text-sm'>—</span>}
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

        {error && <div className='text-red-500 text-center'>{error}</div>}

        <div className='flex flex-col sm:flex-row justify-end gap-4'>
          <button
            type='button'
            onClick={() => navigate(`/workshop/${id}`)}
            className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={submitting}
            className='cursor-pointer flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
          >
            {submitting ? 'Saving...' : 'Save Changes'}
            {!submitting && <Save className='h-4 w-4' />}
          </button>
        </div>
      </form>

      {/* Checklist Dialog */}
      <ChecklistDialog
        task={selectedTask}
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
      />

      {/* Doer Task Count Dialog */}
      <DoerTaskCountDialog
        open={isTaskCountOpen}
        onOpenChange={setIsTaskCountOpen}
        doer={selectedDoer}
        taskCount={doerTaskCount}
        onConfirm={handleConfirmedDoerChange}
      />

      {/* Replace Doers Dialog */}
      <ReplaceDoersDialog
        open={isReplaceDoersOpen}
        onOpenChange={setIsReplaceDoersOpen}
        workshop={workshop}
        doers={doers}
        taskDoers={taskDoers}
        setTaskDoers={setTaskDoers}
      />
    </div>
  );
}
