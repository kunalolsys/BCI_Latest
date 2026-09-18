import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';

// Page to list, create, update, and delete workshop types
// Uses TanStack Table for table rendering and shadcn UI for dialogs/inputs
function WorkshopType() {
  const [workshopTypes, setWorkshopTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all workshop types from API
  const fetchWorkshopTypes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/master/workshop-types`,
        { withCredentials: true }
      );
      // Default to empty array if undefined
      setWorkshopTypes(data?.workshopTypes || []);
    } catch (err) {
      console.error('Failed to load workshop types', err);
      setError('Unable to load workshop types. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkshopTypes();
  }, [fetchWorkshopTypes]);

  // Prepare columns for TanStack Table
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'abbreviation',
        header: 'Abbreviation',
        cell: ({ row }) => <span className='uppercase'>{row.original.abbreviation}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const type = row.original;
          return (
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  // Set editing state and prefill form
                  setEditingType(type);
                  setName(type.name);
                  setAbbreviation(type.abbreviation);
                  setDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={() => {
                  setDeleteTarget(type);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // Table instance with sorting and filtering
  const table = useReactTable({
    data: workshopTypes,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Reset form fields
  const resetForm = () => {
    setName('');
    setAbbreviation('');
    setEditingType(null);
  };

  // Handle create or update submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!name.trim() || !abbreviation.trim()) {
        toast.error('Name and abbreviation are required.');
        setSubmitting(false);
        return;
      }

      const payload = {
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
      };

      if (editingType) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/master/workshop-type/${editingType._id}`,
          payload,
          { withCredentials: true }
        );
        toast.success('Workshop type updated.');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/master/workshop-type`,
          payload,
          { withCredentials: true }
        );
        toast.success('Workshop type created.');
      }

      setDialogOpen(false);
      resetForm();
      fetchWorkshopTypes();
    } catch (err) {
      console.error('Submit failed', err);
      const message =
        err?.response?.data?.message ||
        'Unable to save workshop type. Please try again.';
      toast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget?._id) return;
    setDeleting(true);

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/master/workshop-type/${deleteTarget._id}`,
        { withCredentials: true }
      );
      toast.success('Workshop type deleted.');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchWorkshopTypes();
    } catch (err) {
      console.error('Delete failed', err);
      const message =
        err?.response?.data?.message ||
        'Unable to delete workshop type. Please try again.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='p-6 space-y-6'>
      {/* Header and actions */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Workshop Types</h1>
          <p className='text-sm text-gray-500'>
            Manage the list of workshop types used across templates and workshops.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Add Workshop Type
        </Button>
      </div>

      {/* Search and feedback */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <Input
          placeholder='Search by name or abbreviation...'
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='md:w-80'
        />
        {loading && <span className='text-sm text-gray-500'>Loading...</span>}
        {error && <span className='text-sm text-red-500'>{error}</span>}
      </div>

      {/* Data table */}
      <div className='overflow-x-auto border rounded-lg bg-white shadow-sm'>
        <div className='max-h-[600px] overflow-y-auto relative'>
          <table className='min-w-full divide-y divide-gray-200 table-auto border-separate border-spacing-0'>
            <thead className='bg-gray-50 sticky top-0 z-20 shadow-sm'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
            <tbody className='bg-white divide-y divide-gray-100'>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className='hover:bg-gray-50'>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-4 py-3 text-sm text-gray-700'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && table.getRowModel().rows.length === 0 && (
                <tr>
                  <td className='px-4 py-6 text-center text-sm text-gray-500' colSpan={columns.length}>
                    No workshop types found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Workshop Type' : 'Add Workshop Type'}</DialogTitle>
            <DialogDescription>
              Provide a unique name and abbreviation for the workshop type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g., Goal Setting Workshop'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='abbreviation'>Abbreviation</Label>
              <Input
                id='abbreviation'
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder='e.g., GSW'
                required
                className='uppercase'
              />
            </div>
            {error && <p className='text-sm text-red-500'>{error}</p>}
            <DialogFooter className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Saving...' : editingType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Workshop Type</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected workshop type will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className='py-2'>
            <p className='text-sm text-gray-700'>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deleteTarget?.name}</span>?
            </p>
          </div>
          <DialogFooter className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkshopType;

