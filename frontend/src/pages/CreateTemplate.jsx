import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import {
  AlertDialog as Dialog,
  AlertDialogContent as DialogContent,
  AlertDialogHeader as DialogHeader,
  AlertDialogTitle as DialogTitle,
} from '../components/ui/alert-dialog';

const FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: 'From Announcement Date', label: 'From Announcement Date' },
  { value: 'Event Date', label: 'Event Date' },
  { value: 'T+X', label: 'T+X' },
  { value: 'T-X', label: 'T-X' },
];

const emptyTask = () => ({
  id: Date.now() + Math.random(),
  narration: '',
  isCritical: false,
  checklist: [],
  department: '',
  doer: '',
  frequency: '',
  duration: '',
});

const emptyDeptTask = () => ({
  id: Date.now() + Math.random(),
  narration: '',
  isCritical: false,
  checklist: [],
  department: '',
  frequency: '',
  duration: '',
});

export default function CreateTemplate() {
  const [name, setName] = useState('');
  const [processCoordinator, setProcessCoordinator] = useState('');
  const [executiveAssistant, setExecutiveAssistant] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [tasks, setTasks] = useState([emptyTask()]);
  const [departmentalTasks, setDepartmentalTasks] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [pcs, setPCs] = useState([]);
  const [eas, setEAs] = useState([]);
  const [doers, setDoers] = useState([]);
  const [workshopTypes, setWorkshopTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [activeTable, setActiveTable] = useState('individual'); // 'individual' | 'departmental'

  // Checklist modal — shared between both tables
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [editChecklist, setEditChecklist] = useState([]);
  const [selectedChecklistTask, setSelectedChecklistTask] = useState(null);
  const [selectedChecklistTaskType, setSelectedChecklistTaskType] = useState('task'); // 'task' | 'departmental'

  // Bulk upload
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const base = import.meta.env.VITE_API_BASE_URL;
    Promise.all([
      axios.get(`${base}/setup/departments/all`, { withCredentials: true }),
      axios.get(`${base}/setup/employees/by-role/PC`, { withCredentials: true }),
      axios.get(`${base}/setup/employees/by-role/EA`, { withCredentials: true }),
      axios.get(`${base}/setup/employees/by-role/Doer`, { withCredentials: true }),
      axios.get(`${base}/setup/templates/types`, { withCredentials: true }),
    ])
      .then(([deptRes, pcRes, eaRes, doerRes, typeRes]) => {
        setDepartments(deptRes.data.departments || []);
        setPCs(pcRes.data.employees || []);
        setEAs(eaRes.data.employees || []);
        setDoers(doerRes.data.employees || []);
        setWorkshopTypes(typeRes.data.workshopTypes || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load departments, employees, or workshop types');
        setLoading(false);
      });
  }, []);

  // ── Individual tasks ──────────────────────────────────────────────────────
  const updateTask = (taskId, field, value) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        if (field === 'department') return { ...t, department: value, doer: '' };
        return { ...t, [field]: value };
      })
    );
  };
  const addTask = () => setTasks(prev => [...prev, emptyTask()]);
  const removeTask = (taskId) => setTasks(prev => prev.filter(t => t.id !== taskId));

  // ── Departmental tasks ────────────────────────────────────────────────────
  const updateDepartmentalTask = (taskId, field, value) => {
    setDepartmentalTasks(prev =>
      prev.map(t => (t.id !== taskId ? t : { ...t, [field]: value }))
    );
  };
  const addDepartmentalTask = () => setDepartmentalTasks(prev => [...prev, emptyDeptTask()]);
  const removeDepartmentalTask = (taskId) =>
    setDepartmentalTasks(prev => prev.filter(t => t.id !== taskId));

  // ── Checklist modal ───────────────────────────────────────────────────────
  const openChecklistModal = (taskId, type = 'task') => {
    const list = type === 'task' ? tasks : departmentalTasks;
    const task = list.find(t => t.id === taskId);
    if (task) {
      setSelectedChecklistTask(taskId);
      setSelectedChecklistTaskType(type);
      setEditChecklist([...task.checklist]);
      setIsChecklistModalOpen(true);
    }
  };

  const handleAddChecklistInput = () => setEditChecklist(prev => [...prev, '']);
  const handleEditChecklistChange = (idx, value) =>
    setEditChecklist(prev => prev.map((item, i) => (i === idx ? value : item)));
  const handleRemoveChecklistInput = (idx) =>
    setEditChecklist(prev => prev.filter((_, i) => i !== idx));

  const handleSaveChecklist = () => {
    const setter = selectedChecklistTaskType === 'task' ? setTasks : setDepartmentalTasks;
    setter(prev =>
      prev.map(t =>
        t.id === selectedChecklistTask
          ? { ...t, checklist: editChecklist.filter(item => item.trim() !== '') }
          : t
      )
    );
    setIsChecklistModalOpen(false);
  };

  const handleCancelChecklist = () => setIsChecklistModalOpen(false);

  // ── Bulk upload ───────────────────────────────────────────────────────────
  const handleBulkUploadFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setBulkUploadError('File size should be less than 5MB');
      return;
    }
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.type)) {
      setBulkUploadError('Invalid file type. Only XLS and XLSX files are allowed.');
      return;
    }
    setBulkUploadFile(file);
    setBulkUploadError(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      setBulkUploadError('Please select a file to upload');
      return;
    }
    setBulkUploadLoading(true);
    setBulkUploadError(null);
    try {
      const data = await readExcelFile(bulkUploadFile);
      const { tasks: newTasks, departmentalTasks: newDeptTasks } = processExcelData(data);

      setTasks(prevTasks => {
        const allEmpty = prevTasks.every(t => !t.narration || t.narration.trim() === '');
        return allEmpty ? newTasks : [...prevTasks, ...newTasks];
      });

      setDepartmentalTasks(prevTasks => {
        const allEmpty = prevTasks.every(t => !t.narration || t.narration.trim() === '');
        return allEmpty ? newDeptTasks : [...prevTasks, ...newDeptTasks];
      });

      setBulkUploadFile(null);
      setIsBulkUploadModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const total = newTasks.length + newDeptTasks.length;
      toast.success(
        `Uploaded ${newTasks.length} individual task(s) and ${newDeptTasks.length} departmental task(s).`
      );
    } catch (error) {
      setBulkUploadError(error.message || 'Failed to process Excel file');
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const readExcelFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(worksheet, { header: 1 }));
        } catch {
          reject(new Error('Failed to read Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });

  const downloadTemplate = () => {
    const dummyData = [
      {
        'Task Narration': 'Sample Individual Task',
        'Critical': 'Yes',
        'Checklist': 'Check item 1, Check item 2',
        'Department': 'Sample Department',
        'Doer': 'Sample Doer',
        'Frequency': 'Daily',
        'Duration': ''
      },
      {
        'Task Narration': 'Sample Departmental Task (leave Doer blank)',
        'Critical': 'No',
        'Checklist': 'Review document',
        'Department': 'Another Department',
        'Doer': '',
        'Frequency': 'From Announcement Date',
        'Duration': '5'
      },
    ];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dummyData);
    worksheet['!cols'] = [
      { wch: 40 }, { wch: 10 }, { wch: 30 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks Template');
    XLSX.writeFile(workbook, 'Workshop_Tasks_Template.xlsx');
  };

  const downloadFailedTasks = (failedTasks, errors) => {
    const failedData = failedTasks.map((task, index) => ({
      'Task Narration': task.narration || '',
      'Critical': task.isCritical ? 'Yes' : 'No',
      'Checklist': task.checklist?.join(', ') || '',
      'Department': task.departmentName || '',
      'Doer': task.doerName || '',
      'Frequency': task.frequency || '',
      'Duration': task.duration || '',
      'Error Details': errors[index] || 'Unknown error'
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(failedData);
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 10 }, { wch: 30 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Tasks');
    XLSX.writeFile(workbook, 'Wrong_Tasks.xlsx');
  };

  const processExcelData = (data) => {
    if (!data || data.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }

    const headers = data[0];
    const rows = data.slice(1);
    const processedTasks = [];
    const processedDeptTasks = [];
    const errors = [];
    const failedTasks = [];

    const expectedHeaders = ['Task Narration', 'Critical', 'Checklist', 'Department', 'Doer', 'Frequency', 'Duration'];
    const columnIndices = {};
    headers.forEach((header, index) => {
      const headerLower = header?.toString().toLowerCase().trim();
      expectedHeaders.forEach(expected => {
        if (headerLower === expected.toLowerCase()) columnIndices[expected] = index;
      });
    });

    // Doer is optional — omitting it from required
    const requiredColumns = ['Task Narration', 'Department', 'Frequency'];
    const missingColumns = requiredColumns.filter(col => columnIndices[col] === undefined);
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    rows.forEach((row, rowIndex) => {
      if (!row || row.every(cell => !cell)) return;

      const task = {
        id: Date.now() + Math.random() + rowIndex,
        narration: row[columnIndices['Task Narration']]?.toString().trim() || '',
        isCritical: row[columnIndices['Critical']]?.toString().toLowerCase().includes('yes') || false,
        checklist: [],
        department: '',
        doer: '',
        frequency: row[columnIndices['Frequency']]?.toString().trim() || '',
        duration: row[columnIndices['Duration']]?.toString().trim() || '',
        departmentName: row[columnIndices['Department']]?.toString().trim() || '',
        doerName: row[columnIndices['Doer']]?.toString().trim() || ''
      };

      // Checklist
      const checklistValue = row[columnIndices['Checklist']]?.toString().trim();
      if (checklistValue) {
        task.checklist = checklistValue.split(/[\n,;]/).map(i => i.trim()).filter(Boolean);
      }

      // Department
      const departmentName = row[columnIndices['Department']]?.toString().trim();
      if (!departmentName) {
        errors.push('No department name provided');
        failedTasks.push(task);
        return;
      }
      const department = departments.find(d => d.name.toLowerCase() === departmentName.toLowerCase());
      if (!department) {
        errors.push(`Department "${departmentName}" not found`);
        failedTasks.push(task);
        return;
      }
      task.department = department._id;

      // Frequency validation
      const validFrequencies = FREQUENCY_OPTIONS.map(o => o.value);
      if (!task.frequency || !validFrequencies.includes(task.frequency)) {
        errors.push(`Invalid frequency "${task.frequency}". Valid: ${validFrequencies.join(', ')}`);
        failedTasks.push(task);
        return;
      }

      // Duration validation
      if (['From Announcement Date', 'T+X', 'T-X'].includes(task.frequency)) {
        const duration = Number(task.duration);
        if (isNaN(duration) || duration <= 0) {
          errors.push(`Duration must be > 0 for frequency "${task.frequency}"`);
          failedTasks.push(task);
          return;
        }
        task.duration = duration.toString();
      } else {
        task.duration = '';
      }

      const doerName = row[columnIndices['Doer']]?.toString().trim();

      if (!doerName) {
        // No doer → departmental task
        if (!task.narration) {
          errors.push('Missing Task Narration');
          failedTasks.push(task);
          return;
        }
        const { doer: _d, doerName: _dn, ...deptTask } = task;
        processedDeptTasks.push(deptTask);
      } else {
        // Has doer → individual task
        const departmentDoers = doers.filter(
          d => d.departments && d.departments.some(dep => dep._id === task.department)
        );
        const doer = departmentDoers.find(d => d.name.toLowerCase() === doerName.toLowerCase());
        if (!doer) {
          errors.push(`Doer "${doerName}" not found in department "${departmentName}"`);
          failedTasks.push(task);
          return;
        }
        task.doer = doer._id;
        if (!task.narration) {
          errors.push('Missing Task Narration');
          failedTasks.push(task);
          return;
        }
        processedTasks.push(task);
      }
    });

    if (failedTasks.length > 0) {
      downloadFailedTasks(failedTasks, errors);
      toast.info(`Downloaded ${failedTasks.length} failed row(s) as "Wrong_Tasks.xlsx"`);
    }

    if (processedTasks.length === 0 && processedDeptTasks.length === 0) {
      throw new Error(errors.length > 0 ? `No valid tasks found.\n${errors.join('\n')}` : 'No valid tasks found in the Excel file');
    }

    return { tasks: processedTasks, departmentalTasks: processedDeptTasks };
  };

  const openBulkUploadModal = () => {
    setIsBulkUploadModalOpen(true);
    setBulkUploadFile(null);
    setBulkUploadError(null);
  };
  const closeBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
    setBulkUploadFile(null);
    setBulkUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!name || !workshopName || !processCoordinator || !executiveAssistant) {
      setError('All template fields are required');
      setSubmitting(false);
      return;
    }

    for (const t of tasks) {
      if (!t.narration || !t.department || !t.doer || !t.frequency) {
        setError('All individual task fields (including Doer) are required');
        setSubmitting(false);
        return;
      }
      if (
        ['From Announcement Date', 'T+X', 'T-X'].includes(t.frequency) &&
        (!t.duration || isNaN(Number(t.duration)) || Number(t.duration) <= 0)
      ) {
        setError('Duration must be greater than 0 for the selected frequency');
        setSubmitting(false);
        return;
      }
    }

    for (const t of departmentalTasks) {
      if (!t.narration || !t.department || !t.frequency) {
        setError('All departmental task fields are required');
        setSubmitting(false);
        return;
      }
      if (
        ['From Announcement Date', 'T+X', 'T-X'].includes(t.frequency) &&
        (!t.duration || isNaN(Number(t.duration)) || Number(t.duration) <= 0)
      ) {
        setError('Duration must be greater than 0 for the selected frequency (departmental task)');
        setSubmitting(false);
        return;
      }
    }

    const durationVal = (t) =>
      ['From Announcement Date', 'T+X', 'T-X'].includes(t.frequency)
        ? Number(t.duration)
        : undefined;

    const payload = {
      name,
      workshopName,
      processCoordinator,
      executiveAssistant,
      tasks: [
        ...tasks.map(t => ({
          narration: t.narration,
          isCritical: t.isCritical,
          checklist: t.checklist,
          department: t.department,
          doer: t.doer,
          frequency: t.frequency,
          duration: durationVal(t),
        })),
        ...departmentalTasks.map(t => ({
          narration: t.narration,
          isCritical: t.isCritical,
          checklist: t.checklist,
          department: t.department,
          frequency: t.frequency,
          duration: durationVal(t),
        })),
      ],
    };

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/templates`,
        payload,
        { withCredentials: true }
      );
      navigate('/workshop/templates');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared task row renderers ─────────────────────────────────────────────
  const renderDurationCell = (task, onUpdate) =>
    ['From Announcement Date', 'T+X', 'T-X'].includes(task.frequency) ? (
      <Input
        type='number'
        min='1'
        value={task.duration}
        onChange={(e) => onUpdate(task.id, 'duration', e.target.value)}
        required
        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
        placeholder='Enter duration > 0'
      />
    ) : (
      <span className='text-gray-400'>-</span>
    );

  return (
    <div className='p-8 bg-gray-50 min-h-screen'>
      <h1 className='text-3xl font-bold text-gray-800 mb-8'>Add New Workshop Template</h1>
      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* Header fields */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-end'>
          <div>
            <label className='block mb-1 font-semibold text-gray-700'>Template Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
            />
          </div>
          <div>
            <label className='block mb-1 font-semibold text-gray-700'>Workshop Type *</label>
            <Select value={workshopName} onValueChange={setWorkshopName} required>
              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                {workshopTypes.map((type) => (
                  <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className='block mb-1 font-semibold text-gray-700'>Process Coordinator *</label>
            <Select value={processCoordinator} onValueChange={setProcessCoordinator} required>
              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                {pcs.map((pc) => (
                  <SelectItem key={pc._id} value={pc._id}>{pc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className='block mb-1 font-semibold text-gray-700'>Executive Assistant *</label>
            <Select value={executiveAssistant} onValueChange={setExecutiveAssistant} required>
              <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                {eas.map((ea) => (
                  <SelectItem key={ea._id} value={ea._id}>{ea.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex justify-end gap-2'>
            <button
              type='button'
              onClick={openBulkUploadModal}
              className='px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
              </svg>
              Bulk Upload Excel
            </button>
            <button
              type='submit'
              disabled={submitting}
              className='px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Table Toggle ── */}
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
            {tasks.length > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTable === 'individual' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                {tasks.length}
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

        {/* ── Individual Tasks Table ── */}
        <div className={activeTable === 'individual' ? '' : 'hidden'}>
          <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
            <div className='max-h-[500px] overflow-y-auto overflow-x-auto'>
              <table className='min-w-full'>
                <thead className='bg-gray-100 sticky top-0 z-10 shadow-sm'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Task Narration</th>
                    <th className='px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Critical</th>
                    <th className='px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Checklist</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Department</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Doer</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Frequency</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Duration</th>
                    <th className='px-4 py-3 border-b'></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => (
                    <tr key={task.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'hover:bg-indigo-50 transition'}>
                      <td className='px-4 py-2 border-b'>
                        <Input
                          value={task.narration}
                          onChange={(e) => updateTask(task.id, 'narration', e.target.value)}
                          required
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                        />
                      </td>
                      <td className='px-4 py-2 border-b text-center'>
                        <Select
                          value={task.isCritical ? 'Yes' : 'No'}
                          onValueChange={(val) => updateTask(task.id, 'isCritical', val === 'Yes')}
                        >
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Yes'>Yes</SelectItem>
                            <SelectItem value='No'>No</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b text-center'>
                        <button
                          type='button'
                          onClick={() => openChecklistModal(task.id, 'task')}
                          className='px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition'
                        >
                          Add / Edit
                        </button>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        <Select value={task.department} onValueChange={(val) => updateTask(task.id, 'department', val)}>
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dep) => (
                              <SelectItem key={dep._id} value={dep._id}>{dep.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        <Select value={task.doer} onValueChange={(val) => updateTask(task.id, 'doer', val)}>
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            {doers
                              .filter(d => d.departments && d.departments.some(dep => dep._id === task.department))
                              .map((doer) => (
                                <SelectItem key={doer._id} value={doer._id}>{doer.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        <Select value={task.frequency} onValueChange={(val) => updateTask(task.id, 'frequency', val)}>
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        {renderDurationCell(task, updateTask)}
                      </td>
                      <td className='px-4 py-2 border-b text-right'>
                        {tasks.length > 1 && (
                          <button
                            type='button'
                            onClick={() => removeTask(task.id)}
                            className='px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition'
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={8} className='px-4 py-2 text-left'>
                      <button
                        type='button'
                        onClick={addTask}
                        className='px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition'
                      >
                        Add New
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Departmental Tasks Table ── */}
        <div className={activeTable === 'departmental' ? '' : 'hidden'}>
          <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
            <div className='max-h-[500px] overflow-y-auto overflow-x-auto'>
              <table className='min-w-full'>
                <thead className='bg-gray-100 sticky top-0 z-10 shadow-sm'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Task Narration</th>
                    <th className='px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Critical</th>
                    <th className='px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Checklist</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Department</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Frequency</th>
                    <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b'>Duration</th>
                    <th className='px-4 py-3 border-b'></th>
                  </tr>
                </thead>
                <tbody>
                  {departmentalTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className='px-4 py-4 text-center text-gray-400 text-sm'>
                        No departmental tasks added yet.
                      </td>
                    </tr>
                  )}
                  {departmentalTasks.map((task, idx) => (
                    <tr key={task.id} className={idx % 2 === 1 ? 'bg-gray-50' : 'hover:bg-amber-50 transition'}>
                      <td className='px-4 py-2 border-b'>
                        <Input
                          value={task.narration}
                          onChange={(e) => updateDepartmentalTask(task.id, 'narration', e.target.value)}
                          required
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition'
                        />
                      </td>
                      <td className='px-4 py-2 border-b text-center'>
                        <Select
                          value={task.isCritical ? 'Yes' : 'No'}
                          onValueChange={(val) => updateDepartmentalTask(task.id, 'isCritical', val === 'Yes')}
                        >
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Yes'>Yes</SelectItem>
                            <SelectItem value='No'>No</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b text-center'>
                        <button
                          type='button'
                          onClick={() => openChecklistModal(task.id, 'departmental')}
                          className='px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition'
                        >
                          Add / Edit
                        </button>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        <Select
                          value={task.department}
                          onValueChange={(val) => updateDepartmentalTask(task.id, 'department', val)}
                        >
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dep) => (
                              <SelectItem key={dep._id} value={dep._id}>{dep.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        <Select
                          value={task.frequency}
                          onValueChange={(val) => updateDepartmentalTask(task.id, 'frequency', val)}
                        >
                          <SelectTrigger className='w-full px-3 py-2 border border-gray-300 rounded-lg'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-4 py-2 border-b'>
                        {renderDurationCell(task, updateDepartmentalTask)}
                      </td>
                      <td className='px-4 py-2 border-b text-right'>
                        <button
                          type='button'
                          onClick={() => removeDepartmentalTask(task.id)}
                          className='px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition'
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={7} className='px-4 py-2 text-left'>
                      <button
                        type='button'
                        onClick={addDepartmentalTask}
                        className='px-4 py-2 bg-amber-50 text-amber-700 rounded-lg font-semibold hover:bg-amber-100 transition'
                      >
                        Add New
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {error && <div className='text-red-500 text-center'>{error}</div>}
      </form>

      {/* Checklist Modal */}
      <Dialog open={isChecklistModalOpen} onOpenChange={setIsChecklistModalOpen}>
        <DialogContent className='max-w-sm rounded-xl border border-gray-200'>
          <DialogHeader>
            <DialogTitle>Add Checklist</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {editChecklist.map((item, idx) => (
              <div key={idx} className='flex items-center gap-2 border border-gray-200 rounded-full px-3 py-2'>
                <Input
                  className='border-none focus:ring-0 flex-1 bg-transparent'
                  value={item}
                  onChange={(e) => handleEditChecklistChange(idx, e.target.value)}
                  placeholder='Checklist item'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveChecklistInput(idx)}
                  className='p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition'
                >
                  -
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={handleAddChecklistInput}
              className='w-full px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition'
            >
              + Add Checklist Item
            </button>
            <div className='flex justify-between mt-4'>
              <button
                type='button'
                className='rounded-full px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition'
                onClick={handleSaveChecklist}
              >
                Save
              </button>
              <button
                type='button'
                className='rounded-full px-6 py-2 border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                onClick={handleCancelChecklist}
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkUploadModalOpen} onOpenChange={setIsBulkUploadModalOpen}>
        <DialogContent className='max-w-md rounded-xl border border-gray-200'>
          <DialogHeader>
            <DialogTitle>Bulk Upload Tasks from Excel</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='text-sm text-gray-600'>
              <p className='mb-2'>Upload an Excel file with the following columns:</p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                <li><strong>Task Narration</strong> - Description of the task (required)</li>
                <li><strong>Critical</strong> - Yes/No (optional)</li>
                <li><strong>Checklist</strong> - Items separated by commas, semicolons, or newlines (optional)</li>
                <li><strong>Department</strong> - Department name (must match existing departments)</li>
                <li><strong>Doer</strong> - Doer name (optional — leave blank for a departmental task)</li>
                <li><strong>Frequency</strong> - Daily, From Announcement Date, Event Date, T+X, T-X</li>
                <li><strong>Duration</strong> - Number of days (required for From Announcement Date, T+X, T-X)</li>
              </ul>
              <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs'>
                <strong>Tip:</strong> Leave the <strong>Doer</strong> column blank to create a departmental task assigned to the whole department.
              </div>
            </div>

            <div className='flex justify-center mb-4'>
              <button
                type='button'
                onClick={downloadTemplate}
                className='px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition rounded-lg flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Download Template
              </button>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>Select Excel File (XLS/XLSX)</label>
              <Input
                type='file'
                accept='.xls,.xlsx'
                onChange={handleBulkUploadFileChange}
                ref={fileInputRef}
                className='w-full'
              />
              {bulkUploadFile && (
                <p className='text-sm text-green-600'>Selected: {bulkUploadFile.name}</p>
              )}
            </div>

            {bulkUploadError && (
              <div className='text-red-500 text-sm bg-red-50 p-3 rounded-lg'>{bulkUploadError}</div>
            )}

            <div className='flex justify-between mt-6'>
              <button
                type='button'
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 transition rounded-lg'
                onClick={closeBulkUploadModal}
              >
                Cancel
              </button>
              <button
                type='button'
                className='px-4 py-2 bg-green-600 text-white font-semibold hover:bg-green-700 transition rounded-lg disabled:opacity-50'
                onClick={handleBulkUpload}
                disabled={!bulkUploadFile || bulkUploadLoading}
              >
                {bulkUploadLoading ? 'Processing...' : 'Upload Tasks'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
