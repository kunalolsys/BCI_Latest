import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  AlertDialog as Dialog,
  AlertDialogContent as DialogContent,
  AlertDialogHeader as DialogHeader,
  AlertDialogTitle as DialogTitle,
} from '../components/ui/alert-dialog';
import { X, Download } from 'lucide-react';

export default function ViewTemplate() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState([]);
  const [activeTable, setActiveTable] = useState('individual');

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/workshop/templates/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setTemplate(res.data.template);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch template');
        setLoading(false);
      });
  }, [id]);

  const openChecklistModal = (checklist) => {
    setSelectedChecklist(checklist);
    setIsChecklistModalOpen(true);
  };

  // Function to download template details as Excel
  const downloadTemplateAsExcel = () => {
    if (!template) return;

    // Prepare data for Excel export
    const templateData = [
      // Template header information
      ['Template Details'],
      ['Template ID', template.templateId],
      ['Template Name', template.name],
      ['Workshop Name', template.workshopName ? template.workshopName.name : '-'],
      ['Process Coordinator', template.processCoordinator?.name || '-'],
      ['Executive Assistant', template.executiveAssistant?.name || '-'],
      [], // Empty row for spacing
      
      // Tasks header
      ['Tasks'],
      ['Task ID', 'Task Narration', 'Critical', 'Department', 'Doer', 'Frequency', 'Duration', 'Checklist Items'],
      
      // Individual task data
      ...template.tasks.map(task => [
        task.taskId,
        task.narration,
        task.isCritical ? 'Yes' : 'No',
        task.department?.name || '-',
        task.doer?.name || '-',
        task.frequency,
        task.duration || '-',
        task.checklist && task.checklist.length > 0 ? task.checklist.join('; ') : '-'
      ]),
      [],
      ['Departmental Tasks'],
      ['Task ID', 'Task Narration', 'Critical', 'Department', 'Frequency', 'Duration', 'Checklist Items'],
      ...(template.departmentalTasks || []).map(task => [
        task.taskId,
        task.narration,
        task.isCritical ? 'Yes' : 'No',
        task.department?.name || '-',
        task.frequency,
        task.duration || '-',
        task.checklist && task.checklist.length > 0 ? task.checklist.join('; ') : '-'
      ])
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Task ID
      { wch: 40 }, // Task Narration
      { wch: 10 }, // Critical
      { wch: 20 }, // Department
      { wch: 20 }, // Doer
      { wch: 15 }, // Frequency
      { wch: 15 }, // Duration
      { wch: 50 }, // Checklist Items
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Details');

    // Generate filename with template name and workshop name
    const templateName = template.name || 'Template';
    const workshopName = template.workshopName ? template.workshopName.name : 'Unknown';
    const filename = `${templateName}-${workshopName}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
  };

  if (loading) return <div className='p-6'>Loading...</div>;
  if (error) return <div className='p-6 text-red-500'>{error}</div>;
  if (!template) return <div className='p-6'>Template not found.</div>;

  return (
    <div className='p-8 max-w-full mx-auto bg-gray-50 min-h-screen'>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-gray-800 tracking-tight'>
          View Workshop Template
        </h1>
        <div className='flex items-center gap-3'>
          {/* Download Excel Button */}
          <button
            type='button'
            onClick={downloadTemplateAsExcel}
            className='cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2'
            title='Download Template as Excel'
          >
            <Download className='w-4 h-4' />
            Download Excel
          </button>
          {/* Back Button */}
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
          >
            Back
          </button>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-8'>
        <div>
          <label className='block mb-1 font-semibold text-gray-700'>
            Template ID
          </label>
          <div className='border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900'>
            {template.templateId}
          </div>
        </div>
        <div>
          <label className='block mb-1 font-semibold text-gray-700'>
            Template Name
          </label>
          <div className='border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900'>
            {template.name}
          </div>
        </div>
        <div>
          <label className='block mb-1 font-semibold text-gray-700'>
            Workshop Name
          </label>
          <div className='border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900'>
            {template.workshopName ? template.workshopName.name : '-'}
          </div>
        </div>
        <div>
          <label className='block mb-1 font-semibold text-gray-700'>
            Process Coordinator
          </label>
          <div className='border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900'>
            {template.processCoordinator?.name || '-'}
          </div>
        </div>
        <div>
          <label className='block mb-1 font-semibold text-gray-700'>
            Executive Assistant
          </label>
          <div className='border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900'>
            {template.executiveAssistant?.name || '-'}
          </div>
        </div>
      </div>
      <div className='space-y-4'>
        {/* Toggle */}
        <div className='flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit'>
          <button
            type='button'
            onClick={() => setActiveTable('individual')}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition ${activeTable === 'individual' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Individual Tasks
            {template.tasks.length > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTable === 'individual' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                {template.tasks.length}
              </span>
            )}
          </button>
          <button
            type='button'
            onClick={() => setActiveTable('departmental')}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition ${activeTable === 'departmental' ? 'bg-white text-amber-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Departmental Tasks
            {(template.departmentalTasks || []).length > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTable === 'departmental' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                {(template.departmentalTasks || []).length}
              </span>
            )}
          </button>
        </div>

        {/* Individual Tasks Table */}
        <div className={activeTable === 'individual' ? '' : 'hidden'}>
          <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 overflow-hidden'>
            <div className='max-h-[600px] overflow-y-auto overflow-x-auto'>
              <table className='min-w-full border-separate border-spacing-0'>
                <thead className='bg-gray-100 dark:bg-gray-800 sticky top-0 z-10 shadow-sm'>
                  <tr>
                    {['Task ID', 'Task Narration', 'Critical', 'Checklist', 'Department', 'Doer', 'Frequency', 'Duration'].map(h => (
                      <th key={h} className='px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {template.tasks.map((task, idx) => (
                    <tr key={idx}>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.taskId}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.narration}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-center'>{task.isCritical ? 'Yes' : 'No'}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-center'>
                        <button type='button' className='cursor-pointer px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition' onClick={() => openChecklistModal(task.checklist)}>View Checklist</button>
                      </td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.department?.name || '-'}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.doer?.name || '-'}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.frequency}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.duration || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Departmental Tasks Table */}
        <div className={activeTable === 'departmental' ? '' : 'hidden'}>
          <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 overflow-hidden'>
            <div className='max-h-[600px] overflow-y-auto overflow-x-auto'>
              <table className='min-w-full border-separate border-spacing-0'>
                <thead className='bg-gray-100 dark:bg-gray-800 sticky top-0 z-10 shadow-sm'>
                  <tr>
                    {['Task ID', 'Task Narration', 'Critical', 'Checklist', 'Department', 'Frequency', 'Duration'].map(h => (
                      <th key={h} className='px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(template.departmentalTasks || []).length === 0 && (
                    <tr><td colSpan={7} className='px-4 py-4 text-center text-gray-400 text-sm'>No departmental tasks.</td></tr>
                  )}
                  {(template.departmentalTasks || []).map((task, idx) => (
                    <tr key={idx}>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.taskId}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.narration}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-center'>{task.isCritical ? 'Yes' : 'No'}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-center'>
                        <button type='button' className='cursor-pointer px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition' onClick={() => openChecklistModal(task.checklist)}>View Checklist</button>
                      </td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.department?.name || '-'}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.frequency}</td>
                      <td className='px-4 py-2 border-b border-gray-200 dark:border-gray-800'>{task.duration || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={isChecklistModalOpen}
        onOpenChange={setIsChecklistModalOpen}
      >
        <DialogContent className='max-w-sm rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-2xl font-bold text-gray-800'>Checklist</h2>
            <button
              type='button'
              className='cursor-pointer p-2 rounded-full hover:bg-gray-100 transition'
              onClick={() => setIsChecklistModalOpen(false)}
              aria-label='Close'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
          <div className='space-y-4'>
            {selectedChecklist.length === 0 ? (
              <div className='text-gray-500'>No checklist items.</div>
            ) : (
              <div className='flex flex-col gap-3'>
                {selectedChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex items-center border border-gray-200 rounded-full px-4 py-2 bg-gray-50'
                  >
                    <span className='flex-1 text-gray-800'>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
