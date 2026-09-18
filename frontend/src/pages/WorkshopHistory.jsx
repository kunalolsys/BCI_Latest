import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Eye, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function WorkshopHistory() {
  const [workshops, setWorkshops] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workshopTypes, setWorkshopTypes] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  const navigate = useNavigate();

  // Handle deleting a workshop (only allowed for upcoming or stopped on backend;
  // on this page we only expose delete for stopped workshops to avoid errors)
  const handleDeleteWorkshop = async () => {
    if (!selectedWorkshop) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/${selectedWorkshop._id}`,
        { withCredentials: true }
      );

      toast.success('Workshop deleted successfully');
      setDeleteDialogOpen(false);
      
      // Remove deleted workshop from local state so UI stays in sync
      setWorkshops((prev) => prev.filter((w) => w._id !== selectedWorkshop._id));
      setSelectedWorkshop(null);
    } catch (err) {
      console.error('Error deleting workshop:', err);
      toast.error(err.response?.data?.message || 'Failed to delete workshop');
    }
  };

  // Fetch workshops that are either completed or stopped
  useEffect(() => {
    const fetchWorkshops = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/workshop/workshop-history`,
          {
            params: {
              status: ['Completed', 'Stopped'],
            },
            withCredentials: true,
          }
        );
        console.log('API Response:', response.data);
        setWorkshops(response.data.workshops);
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

    fetchWorkshops();
  }, []);

  const getWorkshopTypeName = (workshopId) => {
    if (!workshopId || !workshopTypes || workshopTypes.length === 0) return '-';
    const abbreviation = workshopId.split('-')[0];
    const foundType = workshopTypes.find(
      (type) => type.abbreviation === abbreviation
    );
    return foundType ? foundType.name : abbreviation;
  };

  const columns = [
    {
      accessorKey: 'workshopId',
      header: 'Workshop ID',
      cell: ({ row }) => (
        <div className='font-medium'>{row.original.workshopId}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Workshop Type',
      cell: ({ row }) => (
        <div>{getWorkshopTypeName(row.original.workshopId)}</div>
      ),
    },
    {
      accessorKey: 'announcementDate',
      header: 'Announcement Date',
      cell: ({ row }) => (
        <div>
          {format(new Date(row.original.announcementDate), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => (
        <div>
          {row.original.endDate
            ? format(new Date(row.original.endDate), 'dd/MM/yyyy')
            : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() =>
              navigate(`/workshop/workshop-history/${row.original._id}`)
            }
          >
            <Eye className='h-4 w-4' />
          </Button>

          {row.original.status === 'Stopped' && (
            <Button
              variant='ghost'
              size='icon'
              className='text-red-600 hover:text-red-700 hover:bg-red-50'
              onClick={() => {
                setSelectedWorkshop(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: workshops,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  // Ensure workshops is an array before filtering
  const workshopsArray = Array.isArray(workshops) ? workshops : [];
  const completedWorkshops = workshopsArray.filter(
    (w) => w.status === 'Completed'
  );
  const stoppedWorkshops = workshopsArray.filter((w) => w.status === 'Stopped');

  return (
    <div className='flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50'>
      <div className='p-4 md:p-8 flex-none'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 tracking-tight mb-0'>
          Workshop History
        </h1>
      </div>

      {/* Tabs for Completed and Stopped workshops */}
      <div className='px-4 md:px-8 flex-grow overflow-hidden flex flex-col'>
        <Tabs defaultValue='completed' className='flex flex-col h-full'>
          <TabsList className='mb-6 flex-none bg-gray-100 rounded-lg border border-gray-200 p-2 md:p-6 gap-2'>
            <TabsTrigger
              value='completed'
              className='cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 md:px-5 py-2 font-semibold text-gray-700 transition'
            >
              Completed Workshops
            </TabsTrigger>
            <TabsTrigger
              value='stopped'
              className='cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-4 md:px-5 py-2 font-semibold text-gray-700 transition'
            >
              Stopped Workshops
            </TabsTrigger>
          </TabsList>

          <TabsContent value='completed' className='flex-grow overflow-hidden'>
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
                    <table className='min-w-[900px] md:min-w-full rounded-2xl border-separate border-spacing-0'>
                      <thead className='sticky top-0 z-10 bg-gray-100'>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {completedWorkshops.length ? (
                        completedWorkshops.map((row, idx) => {
                          const rowObj = table
                            .getRowModel()
                            .rows.find((r) => r.original._id === row._id);
                          return rowObj ? (
                            <tr
                              key={rowObj.id}
                              className={idx % 2 === 1 ? 'bg-gray-50' : ''}
                            >
                              {rowObj.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          ) : null;
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className='h-24 text-center text-gray-400'
                          >
                            No workshops found.
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='stopped' className='flex-grow overflow-hidden'>
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
                    <table className='min-w-[900px] md:min-w-full rounded-2xl border-separate border-spacing-0'>
                      <thead className='sticky top-0 z-10 bg-gray-100'>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className='px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-100'
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {stoppedWorkshops.length ? (
                        stoppedWorkshops.map((row, idx) => {
                          const rowObj = table
                            .getRowModel()
                            .rows.find((r) => r.original._id === row._id);
                          return rowObj ? (
                            <tr
                              key={rowObj.id}
                              className={idx % 2 === 1 ? 'bg-gray-50' : ''}
                            >
                              {rowObj.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className='px-4 md:px-6 py-4 text-sm text-gray-800 border-b border-gray-200'
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          ) : null;
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className='h-24 text-center text-gray-400'
                          >
                            No workshops found.
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
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
              be undone and will delete all associated details.
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
              onClick={handleDeleteWorkshop}
            >
              Delete Workshop
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
