import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, Pencil, Trash2, Plus, Search } from 'lucide-react';

import { Button } from '../components/ui/button';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/alert-dialog';

// Workshop Templates Page
export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch templates from backend
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/workshop/templates`, {
        withCredentials: true,
      })
      .then((res) => {
        setTemplates(res.data.templates || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch templates');
        setLoading(false);
      });
  }, [refresh]);

  // Table columns definition
  const columns = [
    {
      header: 'Template ID',
      accessorKey: 'templateId',
      cell: (info) => info.getValue(),
    },
    {
      header: 'Template Name',
      accessorKey: 'name',
      cell: (info) => info.getValue(),
    },
    {
      header: 'Workshop Name',
      accessorKey: 'workshopName',
      cell: (info) => {
        const wn = info.row.original.workshopName;
        return wn ? `${wn.name}` : '-';
      },
    },
    {
      header: 'Process Coordinator',
      accessorKey: 'processCoordinator',
      cell: (info) => info.row.original.processCoordinator?.name || '-',
    },
    {
      header: 'Executive Assistant',
      accessorKey: 'executiveAssistant',
      cell: (info) => info.row.original.executiveAssistant?.name || '-',
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (info) => (
        <div className='flex gap-2 justify-end'>
          <button
            onClick={() =>
              navigate(`/workshop/templates/${info.row.original._id}`)
            }
            className='cursor-pointer p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition'
            title='View'
          >
            <Eye className='w-4 h-4' />
          </button>
          <button
            onClick={() =>
              navigate(`/workshop/templates/${info.row.original._id}/edit`)
            }
            className='cursor-pointer p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition'
            title='Edit'
          >
            <Pencil className='w-4 h-4' />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition'
                title='Delete'
                onClick={() => setDeleteId(info.row.original._id)}
              >
                <Trash2 className='w-4 h-4' />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className='rounded-xl border border-gray-200'>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this template? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setDeleteId(null)}
                  className='px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      await axios.delete(
                        `${
                          import.meta.env.VITE_API_BASE_URL
                        }/workshop/templates/${info.row.original._id}`,
                        { withCredentials: true }
                      );
                      setDeleteId(null);
                      setRefresh((r) => !r);
                    } catch (err) {
                      alert('Failed to delete template');
                    }
                  }}
                  className='px-5 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition'
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    
    const searchLower = searchTerm.toLowerCase();
    return templates.filter(template => 
      template.name?.toLowerCase().includes(searchLower) ||
      template.templateId?.toLowerCase().includes(searchLower) ||
      template.workshopName?.name?.toLowerCase().includes(searchLower) ||
      template.processCoordinator?.name?.toLowerCase().includes(searchLower) ||
      template.executiveAssistant?.name?.toLowerCase().includes(searchLower)
    );
  }, [templates, searchTerm]);

  // TanStack Table instance
  const table = useReactTable({
    data: filteredTemplates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className='flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50'>
      <div className='p-4 md:p-8 flex-none'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight'>
            Workshop Templates
          </h1>
          <button
            type='button'
            onClick={() => navigate('/workshop/templates/new')}
            className='cursor-pointer inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors'
          >
            <Plus className='w-5 h-5' />
            Add Template
          </button>
        </div>
        
        {/* Search Bar */}
        <div className='mb-6'>
          <div className='relative max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Search templates by name, ID, workshop, or personnel...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
            />
          </div>
          {searchTerm && (
            <div className='mt-2 text-sm text-gray-600'>
              Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>
      
      {/* Table Container with Scroll */}
      <div className='px-4 md:px-8 flex-grow overflow-hidden'>
        {loading ? (
          <div className='text-center py-10 text-gray-500'>Loading...</div>
        ) : error ? (
          <div className='text-red-500 text-center py-10'>{error}</div>
        ) : (
          <div className='h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden'>
            <div className='h-full overflow-y-auto overflow-x-auto'>
              <table className='min-w-[900px] md:min-w-full rounded-2xl border-separate border-spacing-0'>
                <thead className='sticky top-0 z-10 bg-gray-100 dark:bg-gray-800'>
                  <tr>
                    <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800'>
                      Template ID
                    </th>
                    <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800'>
                      Template Name
                    </th>
                    <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800'>
                      Workshop Name
                    </th>
                    <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800'>
                      Process Coordinator
                    </th>
                    <th className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800'>
                      Executive Assistant
                    </th>
                    <th className='px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 w-[140px] bg-gray-100 dark:bg-gray-800'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='text-center py-10 text-gray-400'>
                        No templates found.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell, idx) => (
                          <td
                            key={cell.id}
                            className={
                              // Right-align the last cell (actions), left-align the rest
                              idx === row.getVisibleCells().length - 1
                                ? 'px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 text-right align-middle'
                                : 'px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 text-left align-middle'
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
