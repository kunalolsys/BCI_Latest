import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
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
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Building,
  ArrowLeft,
  Tag,
  CheckCircle,
  AlertCircle,
  Star,
  List,
  ClipboardCheck,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';

// Format date for display - moved outside components to be shared
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
  console.log('ChecklistDialog received task:', task);
  console.log('ChecklistDialog task checklist:', task?.checklist);
  console.log('ChecklistDialog checklist type:', typeof task?.checklist);
  console.log('ChecklistDialog checklist is array:', Array.isArray(task?.checklist));
  if (task?.checklist && Array.isArray(task.checklist)) {
    console.log('First checklist item:', task.checklist[0]);
    console.log('First checklist item type:', typeof task.checklist[0]);
  }
  console.log('ChecklistDialog open state:', open);
  
  if (!task) {
    console.log('ChecklistDialog: No task provided');
    return null;
  }

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
              {task.checklist.map((item, index) => {
                // Handle both string items and object items
                const itemText = typeof item === 'string' ? item : item.item || item.text || 'Unknown item';
                const isChecked = typeof item === 'object' ? item.checked : false;
                const itemId = typeof item === 'object' ? item._id : index;
                
                return (
                  <li
                    key={itemId || index}
                    className='flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50'
                  >
                    <CheckCircle 
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        isChecked ? 'text-green-600' : 'text-indigo-600'
                      }`} 
                    />
                    <span className='text-sm text-gray-800'>{itemText}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter>
          <button
            type='button'
            className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </DialogFooter>
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
        // Ensure checklist is preserved from the first task
        checklist: Array.isArray(task.checklist) ? task.checklist : [],
      });
    } else {
      const existingTask = groupedTasks.get(key);
      existingTask.dailyEntries.push(task);
      // If the existing task doesn't have a checklist but the new task does, use the new one
      if ((!existingTask.checklist || existingTask.checklist.length === 0) && 
          task.checklist && Array.isArray(task.checklist) && task.checklist.length > 0) {
        existingTask.checklist = task.checklist;
      }
    }
  });

  return Array.from(groupedTasks.values());
};

// Departmental tasks contain -D-{number} in their ID
const isDepartmentalTask = (taskId) => {
  if (!taskId) return false;
  return /-D-\d+/.test(taskId);
};

// Base departmental ID = part before -D-N (and before /day suffix)
const getBaseDeptTaskId = (taskId) => {
  if (!taskId) return '';
  return taskId.split('/')[0].replace(/-D-\d+$/, '');
};

// Group departmental tasks by base ID — all -D-1, -D-2 etc. collapse into one row
const groupDepartmentalTasks = (tasks) => {
  const grouped = new Map();

  tasks.forEach((task) => {
    const baseId = getBaseDeptTaskId(task.taskId);
    if (!grouped.has(baseId)) {
      grouped.set(baseId, {
        ...task,
        taskId: baseId,
        isDailyTask: isDailyTask(task.taskId),
        checklist: Array.isArray(task.checklist) ? task.checklist : [],
        assignees: task.doer ? [task.doer] : [],
        allTasks: [task],
        pendingCount: task.status?.toLowerCase() === 'pending' ? 1 : 0,
        completedCount: task.status?.toLowerCase() === 'completed' ? 1 : 0,
      });
    } else {
      const existing = grouped.get(baseId);
      existing.allTasks.push(task);
      if (task.doer && !existing.assignees.some(a => a?._id === task.doer?._id)) {
        existing.assignees.push(task.doer);
      }
      if (!existing.checklist?.length && task.checklist?.length) {
        existing.checklist = task.checklist;
      }
      if (task.status?.toLowerCase() === 'pending') existing.pendingCount++;
      else if (task.status?.toLowerCase() === 'completed') existing.completedCount++;
    }
  });

  return Array.from(grouped.values());
};

// Departmental tasks table — groups -D-1, -D-2 etc. into one row per base task
function DepartmentalTasksTable({ tasks, onViewChecklist, visibleColumns, toggleColumnVisibility }) {
  const overallStatus = (group) => {
    // If any task is not completed, then status is Pending. Otherwise Completed.
    const hasPending = group.allTasks.some(t => t.status?.toLowerCase() !== 'completed');
    return hasPending ? 'Pending' : 'Completed';
  };

  const grouped = groupDepartmentalTasks(tasks);

  const columns = [
    { key: 'taskId', label: 'Task ID', width: 'w-[240px]', align: 'text-left' },
    { key: 'description', label: 'Description', width: 'w-[380px]', align: 'text-left' },
    { key: 'department', label: 'Department', width: 'w-[180px]', align: 'text-left' },
    { key: 'frequency', label: 'Frequency', width: 'w-[160px]', align: 'text-left' },
    { key: 'dueDate', label: 'Due Date', width: 'w-[140px]', align: 'text-left' },
    { key: 'status', label: 'Status', width: 'w-[130px]', align: 'text-left' },
    { key: 'checklist', label: 'Checklist', width: 'w-[120px]', align: 'text-left' },
  ];

  const visibleColumnCount = columns.filter(col => visibleColumns[col.key]).length;
  const hiddenCardActive = columns.some(col => !visibleColumns[col.key]);
  const cardRef = React.useRef(null);

  return (
    <>
      {/* Hidden Columns Controls - always visible above the table */}
      {hiddenCardActive && (
        <div ref={cardRef} className='w-auto mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200'>
          <div className='flex items-center gap-2 mb-2'>
            <Eye className='h-4 w-4 text-gray-600' />
            <span className='text-sm font-medium text-gray-700'>Hidden Columns:</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {columns.map(col =>
              !visibleColumns[col.key] && (
                <button
                  key={col.key}
                  type='button'
                  onClick={() => toggleColumnVisibility(col.key)}
                  className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                >
                  {col.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
      <div className='relative flex flex-col w-full overflow-hidden' style={{ height: hiddenCardActive ? 'calc(100% - 80px)' : 'inherit' }}>
        <div className='max-h-[600px] overflow-y-auto overflow-x-auto'>
          <table className='table-fixed w-full' style={{ tableLayout: 'fixed' }}>
            <thead className='sticky top-0 z-10 shadow-sm bg-gray-100 dark:bg-gray-800'>
              <tr>
                {columns.map(col => (
                  visibleColumns[col.key] && (
                    <th
                      key={col.key}
                      className={`px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 ${col.width} ${col.align}`}
                    >
                      <div className={`flex items-center gap-2 ${col.align === 'text-right' ? 'justify-end' : ''}`}>
                        {col.label}
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility(col.key)}
                          className='cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition'
                          title={`Hide ${col.label} column`}
                        >
                          <EyeOff className='h-3 w-3 text-gray-500' />
                        </button>
                      </div>
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className='text-center py-8 text-gray-400'>No departmental tasks.</td>
                </tr>
              ) : (
                grouped.map((group) => (
                  <tr key={group.taskId} className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition'>
                    {visibleColumns.taskId && (
                      <td className='px-6 py-4 w-[240px]'>
                        <div className='flex items-center gap-1 break-words whitespace-normal'>
                          {group.taskId}
                          {group.isCritical && <Star className='h-4 w-4 text-amber-500 flex-shrink-0' fill='currentColor' />}
                        </div>
                        {group.isDailyTask && (
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            {(() => {
                              const instanceGroups = {};
                              group.allTasks.forEach(t => {
                                const instanceId = t.taskId?.split('/')[0] || 'default';
                                if (!instanceGroups[instanceId]) {
                                  instanceGroups[instanceId] = 0;
                                }
                                instanceGroups[instanceId]++;
                              });
                              const counts = Object.values(instanceGroups);
                              return counts.length > 0 ? Math.max(...counts) : 0;
                            })()} daily entries
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className='px-6 py-4 font-medium w-[380px]'>
                        <div className='break-words whitespace-normal'>{group.narration || 'No description'}</div>
                      </td>
                    )}
                    {visibleColumns.department && (
                      <td className='px-6 py-4 w-[180px]'>
                        <div className='break-words whitespace-normal'>{group.department?.name || '—'}</div>
                      </td>
                    )}
                    {visibleColumns.frequency && (
                      <td className='px-6 py-4 w-[160px]'>
                        <div className='break-words whitespace-normal'>{group.frequency || '—'}</div>
                      </td>
                    )}
                    {visibleColumns.dueDate && (
                      <td className='px-6 py-4 w-[140px]'>
                        <div className='break-words whitespace-normal'>{formatDate(group.endDate)}</div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className='px-6 py-4 w-[130px]'>
                        <StatusBadge status={overallStatus(group)} />
                      </td>
                    )}
                    {visibleColumns.checklist && (
                      <td className='px-6 py-4 w-[120px]'>
                        <div className='break-words whitespace-normal flex items-center'>
                          {group.checklist?.length > 0 ? (
                            <button
                              type='button'
                              className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
                              onClick={() => onViewChecklist(group)}
                              title='View Checklist'
                            >
                              <List className='h-4 w-4' />
                            </button>
                          ) : (
                            <button
                              type='button'
                              className='cursor-pointer p-2 rounded-lg bg-gray-100 text-gray-400 opacity-50'
                              disabled
                              title='No checklist available'
                            >
                              <List className='h-4 w-4' />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function ViewWorkshop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  
  // Debug checklist state changes
  useEffect(() => {
    console.log('Checklist state changed:', { selectedTask, isChecklistOpen });
  }, [selectedTask, isChecklistOpen]);
  
  const [showHeaderDetails, setShowHeaderDetails] = useState(false);
  const [activeTaskTable, setActiveTaskTable] = useState('individual');
  const [visibleColumns, setVisibleColumns] = useState({
    taskId: true,
    description: true,
    department: true,
    doer: true,
    frequency: true,
    dueDate: true,
    status: true,
    checklist: true,
  });

  useEffect(() => {
    const fetchWorkshopDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/workshop/workshop-history/${id}`,
          { withCredentials: true }
        );

        console.log('Workshop data from API:', response.data.workshop);

        // Ensure tasks is an array even if it's missing
        const workshopData = {
          ...response.data.workshop,
          tasks: response.data.workshop.tasks || [],
        };

        setWorkshop(workshopData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching workshop details:', err);
        setError(
          err.response?.data?.message || 'Failed to load workshop details'
        );
        setLoading(false);

        // Show error toast
        toast.error(
          err.response?.data?.message || 'Failed to load workshop details'
        );
      }
    };

    fetchWorkshopDetails();
  }, [id]);

  // Function to handle checklist view
  const handleViewChecklist = (task) => {
    console.log('Opening checklist for task:', task);
    console.log('Task checklist:', task.checklist);
    setSelectedTask(task);
    setIsChecklistOpen(true);
  };

  // Function to toggle column visibility
  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  if (loading) {
    return (
      <div className='flex flex-col h-[calc(100vh-80px)] items-center justify-center'>
        <div className='text-lg'>Loading workshop details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col h-[calc(100vh-80px)] items-center justify-center'>
        <div className='text-red-500 text-lg mb-4'>{error}</div>
        <Button onClick={() => navigate('/workshop/history')}>
          Go Back to Workshops
        </Button>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className='flex flex-col h-[calc(100vh-80px)] items-center justify-center'>
        <div className='text-lg mb-4'>Workshop not found</div>
        <Button onClick={() => navigate('/workshop/history')}>
          Go Back to Workshops
        </Button>
      </div>
    );
  }

  // Task table component
  const TasksTable = ({ tasks }) => {
    const groupedTasks = groupTasks(tasks);
    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;
    const columns = [
      { key: 'taskId', label: 'Task ID', width: 'w-[260px]', align: 'text-left' },
      { key: 'description', label: 'Description', width: 'w-[500px]', align: 'text-left' },
      { key: 'department', label: 'Department', width: 'w-[200px]', align: 'text-left' },
      { key: 'doer', label: 'Doer', width: 'w-[200px]', align: 'text-left' },
      { key: 'frequency', label: 'Frequency', width: 'w-[200px]', align: 'text-left' },
      { key: 'dueDate', label: 'Due Date', width: 'w-[150px]', align: 'text-left' },
      { key: 'status', label: 'Status', width: 'w-[150px]', align: 'text-left' },
      { key: 'checklist', label: 'Checklist', width: 'w-[150px]', align: 'text-left' },
    ];
    const hiddenCardActive = Object.values(visibleColumns).some(visible => !visible);
    const cardRef = React.useRef(null);

    return (
      <div className="relative flex flex-col w-full">
        {/* Hidden Columns Controls - always visible above the table */}
        {hiddenCardActive && (
          <div ref={cardRef} className='w-auto mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='flex items-center gap-2 mb-2'>
              <Eye className='h-4 w-4 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>Hidden Columns:</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {columns.map(col =>
                !visibleColumns[col.key] && (
                  <button
                    key={col.key}
                    type='button'
                    onClick={() => toggleColumnVisibility(col.key)}
                    className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                  >
                    {col.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}
        {/* Normal table, no sticky, no scrolls */}
        <table className="table-fixed w-full" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {columns.map(col => (
                visibleColumns[col.key] && (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 ${col.width} ${col.align}`}
                  >
                    <div className={`flex items-center gap-2 ${col.align === 'text-right' ? 'justify-end' : ''}`}>
                      {col.label}
                      <button
                        type="button"
                        onClick={() => toggleColumnVisibility(col.key)}
                        className="cursor-pointer p-1 rounded hover:bg-gray-200 transition"
                        title={`Hide ${col.label} column`}
                      >
                        <EyeOff className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedTasks.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} className="text-center py-8 text-gray-400">
                  No tasks found.
                </td>
              </tr>
            ) : (
              groupedTasks.map((task, idx) => (
                <tr key={task._id}>
                  {visibleColumns.taskId && (
                    <td className="px-6 py-4 w-[260px]">
                      <div className="break-words whitespace-normal flex items-center gap-1">
                        {task.isDailyTask ? (
                          <div className="flex flex-col">
                            <span>{getBaseTaskId(task.taskId)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.dailyEntries.length} daily entries
                            </span>
                          </div>
                        ) : (
                          task.taskId || 'No ID'
                        )}
                        {task.isCritical && (
                          <Star
                            className="h-4 w-4 text-amber-500"
                            fill="currentColor"
                          />
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.description && (
                    <td className="px-6 py-4 font-medium w-[500px]">
                      <div className="break-words whitespace-normal">
                        {task.narration || 'No description'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.department && (
                    <td className="px-6 py-4 w-[200px]">
                      <div className="break-words whitespace-normal">
                        {task.department?.name || 'Not assigned'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.doer && (
                    <td className="px-6 py-4 w-[200px]">
                      <div className="break-words whitespace-normal">
                        {task.doer?.name || 'Not assigned'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.frequency && (
                    <td className="px-6 py-4 w-[200px]">
                      <div className="break-words whitespace-normal">
                        {task.frequency || 'Not specified'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.dueDate && (
                    <td className="px-6 py-4 w-[150px]">
                      <div className="break-words whitespace-normal">
                        {formatDate(task.endDate)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-6 py-4 w-[150px]">
                      <div className="break-words whitespace-normal">
                        <StatusBadge status={task.status || 'Unknown'} />
                      </div>
                    </td>
                  )}
                  {visibleColumns.checklist && (
                    <td className="px-6 py-4 w-[150px]">
                      <div className="break-words whitespace-normal flex items-center">
                        {task.checklist && task.checklist.length > 0 ? (
                          <button
                            type="button"
                            className="cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700"
                            onClick={() => handleViewChecklist(task)}
                            title="View Checklist"
                          >
                            <List className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="cursor-pointer p-2 rounded-lg bg-gray-100 text-gray-400 opacity-50"
                            disabled
                            title="No checklist available"
                          >
                            <List className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className='flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50'>
      <div className='p-4 md:p-8 pb-4 flex-none'>
        <div className='flex flex-col sm:flex-row items-center gap-4 mb-8'>
          <button
            type='button'
            onClick={() => navigate('/workshop/history')}
            className='cursor-pointer flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </button>
          <h1 className='text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight'>
            Workshop Details
          </h1>
        </div>

        {/* Workshop Header Card */}
        <div className='mb-0 rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
          <div className='p-3 border-b border-gray-100 dark:border-gray-800'>
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
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setShowHeaderDetails(!showHeaderDetails)}
                  className='cursor-pointer flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium text-sm transition'
                  title={showHeaderDetails ? 'Hide Details' : 'Show Details'}
                >
                  {showHeaderDetails ? (
                    <>
                      <ChevronUp className='h-4 w-4' />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className='h-4 w-4' />
                      Show Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {showHeaderDetails && (
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
                {(workshop.type === 'Offline' || workshop.type === 'Hybrid') &&
                  workshop.venue && (
                    <div className='flex items-start gap-2'>
                      <Building className='h-5 w-5 text-gray-400 mt-0.5' />
                      <div>
                        <div className='text-sm font-medium text-gray-700'>
                          Venue
                        </div>
                        <div className='text-gray-800'>{workshop.venue}</div>
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
                <div className='flex items-start gap-2'>
                  <User className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <div className='text-sm font-medium text-gray-700'>
                      Process Coordinator
                    </div>
                    <div className='text-gray-800'>
                      {workshop.processCoordinator?.name || 'Not assigned'}
                    </div>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <User className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <div className='text-sm font-medium text-gray-700'>
                      Executive Assistant
                    </div>
                    <div className='text-gray-800'>
                      {workshop.executiveAssistant?.name || 'Not assigned'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Table - Only show for completed workshops */}
      {workshop.status?.toLowerCase() === 'completed' && (
        <div className='px-4 md:px-8 flex-grow overflow-hidden flex flex-col'>
          <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
            <div className='p-3 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <h2 className='text-xl font-bold text-gray-800 mb-1'>
                  Workshop Tasks
                </h2>
              </div>
              
              {/* Individual / Departmental toggle */}
              {(() => {
                const indivCount = workshop.tasks.filter(t => !isDepartmentalTask(t.taskId)).length;
                const deptCount = workshop.tasks.filter(t => isDepartmentalTask(t.taskId)).length;
                return (
                  <div className='flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit flex-none'>
                    <button
                      type='button'
                      onClick={() => setActiveTaskTable('individual')}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${activeTaskTable === 'individual' ? 'bg-white dark:bg-gray-900 text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                      Individual Tasks
                      {indivCount > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTaskTable === 'individual' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          {indivCount}
                        </span>
                      )}
                    </button>
                    <button
                      type='button'
                      onClick={() => setActiveTaskTable('departmental')}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${activeTaskTable === 'departmental' ? 'bg-white dark:bg-gray-900 text-amber-700 shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                      Departmental Tasks
                      {deptCount > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTaskTable === 'departmental' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          {groupDepartmentalTasks(workshop.tasks.filter(t => isDepartmentalTask(t.taskId))).length}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
            <div className='p-6 overflow-y-auto h-full pr-2 pb-6'>
              {/* Individual Tasks Table */}
              <div className={activeTaskTable === 'individual' ? '' : 'hidden'}>
                {/* Hidden Columns Controls */}
                {activeTaskTable === 'individual' && Object.values(visibleColumns).some(visible => !visible) && (
                  <div className='mb-1 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Eye className='h-4 w-4 text-gray-600' />
                      <span className='text-sm font-medium text-gray-700'>Hidden Columns:</span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {!visibleColumns.taskId && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('taskId')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Task ID
                        </button>
                      )}
                      {!visibleColumns.description && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('description')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Description
                        </button>
                      )}
                      {!visibleColumns.department && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('department')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Department
                        </button>
                      )}
                      {!visibleColumns.doer && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('doer')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Doer
                        </button>
                      )}
                      {!visibleColumns.frequency && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('frequency')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Frequency
                        </button>
                      )}
                      {!visibleColumns.dueDate && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('dueDate')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Due Date
                        </button>
                      )}
                      {!visibleColumns.status && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('status')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Status
                        </button>
                      )}
                      {!visibleColumns.checklist && (
                        <button
                          type='button'
                          onClick={() => toggleColumnVisibility('checklist')}
                          className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                        >
                          Checklist
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className='overflow-x-auto'>
                  <TasksTable
                    tasks={workshop.tasks.filter(t => !isDepartmentalTask(t.taskId))}
                    tableClassName='min-w-[900px] md:min-w-full'
                    rowClassName={({ idx }) =>
                      idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800' : ''
                    }
                    cellClassName='px-4 md:px-6 py-4 text-sm text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800'
                    // Pass cursor-pointer to all buttons inside TasksTable as well
                    buttonClassName='cursor-pointer'
                  />
                </div>
              </div>

              {/* Departmental Tasks Table */}
              <div className={activeTaskTable === 'departmental' ? '' : 'hidden'}>
                <div className='overflow-x-auto'>
                  <DepartmentalTasksTable
                    tasks={workshop.tasks.filter(t => isDepartmentalTask(t.taskId))}
                    visibleColumns={visibleColumns}
                    toggleColumnVisibility={toggleColumnVisibility}
                    onViewChecklist={handleViewChecklist}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Dialog */}
      <ChecklistDialog
        task={selectedTask}
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
      />
    </div>
  );
}
