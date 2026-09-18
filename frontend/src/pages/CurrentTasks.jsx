import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import {
  format,
  differenceInDays,
  startOfDay,
  endOfDay,
  isBefore,
} from 'date-fns';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Upload,
  Trash2,
  Download,
  FileText,
  MessageSquare,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Flag,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Filter,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ScrollArea } from '../components/ui/scroll-area';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../components/ui/popover';
import { useLocation } from 'react-router-dom';

function TasksTable({ columns, data, unreadNotifications, visibleColumns, toggleColumnVisibility }) {
  // Map taskId to highest priority notification type
  const notificationTypeMap = useMemo(() => {
    // Priority: escalation > document > comment
    const priority = { escalation: 3, document: 2, comment: 1 };
    const map = {};
    unreadNotifications?.forEach((n) => {
      const tid = n.taskId?.toString();
      if (!tid) return;
      const t = n.type;
      if (!map[tid] || priority[t] > priority[map[tid]]) {
        map[tid] = t;
      }
    });
    return map;
  }, [unreadNotifications]);

  // Helper to get row background color based on notification type
  const getRowBg = (taskId) => {
    const type = notificationTypeMap[taskId?.toString()];
    if (type === 'escalation') return 'bg-red-100';
    if (type === 'document') return 'bg-yellow-100';
    if (type === 'comment') return 'bg-blue-100';
    return '';
  };

  // Helper function to get header text from column definition
  const getHeaderText = (col) => {
    if (typeof col.header === 'string') {
      return col.header;
    }
    if (typeof col.header === 'function') {
      // Try to extract text from JSX by checking if it has children
      // For simple cases like <div>Text</div>, we'll use accessorKey as fallback
      // Or use a headerText property if available
      if (col.headerText) {
        return col.headerText;
      }
      // Format accessorKey as fallback (e.g., "checklist" -> "Checklist")
      if (col.accessorKey) {
        return col.accessorKey
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      }
      return 'Column';
    }
    return col.accessorKey || 'Column';
  };

  // Filter columns based on visibility
  const visibleColumnsData = columns.filter((col, index) => {
    const columnKey = col.accessorKey || `column-${index}`;
    return visibleColumns[columnKey] !== false;
  });

  const table = useReactTable({
    data,
    columns: visibleColumnsData,
    getCoreRowModel: getCoreRowModel(),
  });

  // Check if any columns are hidden
  const hiddenCardActive = Object.values(visibleColumns).some(visible => visible === false);

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      {/* Hidden Columns Controls */}
      {hiddenCardActive && (
        <div className='w-auto mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-none'>
          <div className='flex items-center gap-2 mb-2'>
            <Eye className='h-4 w-4 text-gray-600' />
            <span className='text-sm font-medium text-gray-700'>Hidden Columns:</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {columns.map((col, index) => {
              const columnKey = col.accessorKey || `column-${index}`;
              if (visibleColumns[columnKey] === false) {
                return (
                  <button
                    key={columnKey}
                    type='button'
                    onClick={() => toggleColumnVisibility(columnKey)}
                    className='cursor-pointer px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition'
                  >
                    {getHeaderText(col)}
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      <div className='flex-grow overflow-hidden'>
        <div className='h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden'>
          <div className='h-full overflow-y-auto overflow-x-auto'>
            <table className='w-full table-fixed rounded-2xl border-separate border-spacing-0' style={{ minWidth: 'max-content' }}>
              <thead className='sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const columnKey = header.column.columnDef.accessorKey || `column-${index}`;
                      return (
                        <th
                          key={header.id}
                          className='px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800'
                          style={{
                            minWidth: header.column.columnDef.meta?.minWidth || 120,
                            width: header.column.columnDef.meta?.width,
                          }}
                        >
                          <div className='flex items-center gap-2'>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <button
                              type="button"
                              onClick={() => toggleColumnVisibility(columnKey)}
                              className="cursor-pointer p-1 rounded hover:bg-gray-200 transition"
                              title={`Hide ${header.column.columnDef.header} column`}
                            >
                              <EyeOff className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, idx) => (
                  <tr key={row.id} className={getRowBg(row.original._id)}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className='px-6 py-3 text-sm text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800'
                        style={{
                          minWidth: cell.column.columnDef.meta?.minWidth || 120,
                          width: cell.column.columnDef.meta?.width,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistModal({
  open,
  onOpenChange,
  checklist,
  taskId,
  onChecklistUpdate,
}) {
  const [checkedState, setCheckedState] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize checked state when modal opens
  useEffect(() => {
    if (open && checklist) {
      setCheckedState(checklist.map((item) => item.checked || false));
    }
  }, [open, checklist]);

  const handleCheckChange = async (idx) => {
    try {
      // Update local state immediately for better UX
      const newCheckedState = [...checkedState];
      newCheckedState[idx] = !newCheckedState[idx];
      setCheckedState(newCheckedState);

      // Update the checklist in the database
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/${taskId}`,
        {
          checklist: newCheckedState.map((checked, index) => ({
            item: checklist[index].item,
            checked: checked,
          })),
        },
        { withCredentials: true }
      );

      // Update parent component with the response
      onChecklistUpdate(response.data.task.checklist);
      toast.success('Checklist updated successfully');
    } catch (error) {
      console.error('Checklist update error:', error);
      // Revert the change if the update fails
      setCheckedState([...checkedState]);
      toast.error('Failed to update checklist');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl font-bold text-gray-800'>
            <ClipboardList className='w-5 h-5 text-indigo-600' />
            Checklist
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          {checklist && checklist.length > 0 ? (
            <div className='space-y-3'>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className='flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 transition-colors'
                >
                  <Checkbox
                    checked={checkedState[idx]}
                    onCheckedChange={() => handleCheckChange(idx)}
                    disabled={loading}
                    className='mt-1'
                  />
                  <label
                    className={`flex-1 text-sm cursor-pointer ${checkedState[idx]
                      ? 'line-through text-gray-400'
                      : 'text-gray-800'
                      }`}
                  >
                    {item.item}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center text-gray-500 py-4'>
              No checklist items available.
            </div>
          )}
        </div>
        <DialogClose asChild>
          <button
            type='button'
            className='cursor-pointer w-full mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
          >
            Close
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function DocumentModal({
  open,
  onOpenChange,
  taskId,
  documents,
  onDocumentsChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          'Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX, XLS, and XLSX files are allowed.'
        );
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/documents/upload/task/${taskId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      onDocumentsChange([...documents, response.data.document]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedFile(null);
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Keep the file size less than 5MB'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL
        }/documents/upload/task/${taskId}/${documentId}`,
        { withCredentials: true }
      );
      onDocumentsChange(documents.filter((doc) => doc._id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting document');
    }
  };

  const handleDownload = async (doc) => {
    try {
      // Get the file as a blob
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL
        }/documents/upload/task/download/${encodeURIComponent(doc.path)}`,
        {
          responseType: 'blob',
          withCredentials: true,
          headers: {
            Accept: 'application/octet-stream',
          },
        }
      );

      // Check if the response is actually a blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      // Get the filename from the Content-Disposition header or use the original name
      const contentDisposition = response.headers['content-disposition'];
      let filename = doc.originalName;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a blob URL
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(
        error.response?.data?.message || 'Error downloading document'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-800'>
            Documents
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          {/* Upload Section */}
          <div className='flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50'>
            <Input
              type='file'
              onChange={handleFileChange}
              accept='.pdf,.doc,.docx,.xls,.xlsx,.jpeg,.jpg,.png'
              className='flex-1'
              ref={fileInputRef}
            />
            <button
              type='button'
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className='cursor-pointer flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50'
            >
              <Upload className='w-4 h-4' />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* Documents List */}
          <div className='space-y-2'>
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className='flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-900'
                >
                  <div className='flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-gray-500' />
                    <span className='text-sm text-gray-800'>
                      {doc.originalName}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => handleDownload(doc)}
                      className='cursor-pointer p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition'
                      title='Download'
                    >
                      <Download className='w-4 h-4' />
                    </button>
                    <button
                      type='button'
                      onClick={() => handleDelete(doc._id)}
                      className='cursor-pointer p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition'
                      title='Delete'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center text-gray-500 py-4'>
                No documents uploaded yet
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsModal({ open, onOpenChange, taskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollAreaRef = useRef(null);

  // Fetch comments when modal opens
  useEffect(() => {
    if (open && taskId) {
      fetchComments();
    }
  }, [open, taskId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/${taskId}/comments`,
        { withCredentials: true }
      );
      setComments(response.data.comments);
    } catch (error) {
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/${taskId}/comments`,
        { comment: newComment },
        { withCredentials: true }
      );
      setComments([response.data.comment, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [comments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl h-[600px] flex flex-col rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-800'>
            Comments
          </DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className='flex-1 pr-4'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <span className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-300 border-t-indigo-600' />
            </div>
          ) : comments.length > 0 ? (
            <div className='space-y-4'>
              {comments.map((comment) => (
                <div key={comment._id} className='flex flex-col space-y-1'>
                  <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-800'>
                    <p className='text-sm text-gray-800 dark:text-gray-100'>
                      {comment.comment}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-gray-500'>
                    <span className='font-medium'>
                      {comment.employeeId.name}
                    </span>
                    <span>•</span>
                    <span>
                      {format(
                        new Date(comment.createdAt),
                        'MMM d, yyyy h:mm a'
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center text-gray-500 py-8'>
              No comments yet. Be the first to comment!
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmitComment} className='mt-4 space-y-4'>
          <Textarea
            placeholder='Write a comment...'
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className='min-h-[100px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
          />
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={!newComment.trim() || submitting}
              className='cursor-pointer flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50'
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RaiseEscalationModal({
  open,
  onOpenChange,
  task,
  userRole,
  onEscalationRaised,
}) {
  const [comment, setComment] = useState('');
  const [mds, setMds] = useState([]);
  const [ea, setEa] = useState(null);
  const [selectedMd, setSelectedMd] = useState('');
  const [selectedEa, setSelectedEa] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && (userRole === 'PC' || userRole === 'EA')) {
      setLoading(true);
      axios
        .get(
          `${import.meta.env.VITE_API_BASE_URL}/escalations/task/${task._id
          }/contacts`,
          { withCredentials: true }
        )
        .then((res) => {
          setMds(res.data.data.mds || []);
          setEa(res.data.data.ea || null);
        })
        .catch(() => {
          setMds([]);
          setEa(null);
        })
        .finally(() => setLoading(false));
    }
    if (!open) {
      setComment('');
      setSelectedMd('');
      setSelectedEa('');
    }
  }, [open, task, userRole]);

  const isPCValid = userRole === 'PC' ? selectedMd || selectedEa : true;
  const isEAValid = userRole === 'EA' ? !!selectedMd : true;
  const canSubmit =
    comment.trim() && !submitting && !loading && isPCValid && isEAValid;

  // Helper to send escalation (POST or PUT)
  const sendEscalation = async (
    raisedTo,
    isFirst = false,
    multiChain = null
  ) => {
    let payload;
    if (isFirst && multiChain) {
      payload = {
        taskId: task._id,
        workshopId: task.workshop,
        escalationChain: multiChain,
      };
    } else {
      payload = {
        taskId: task._id,
        workshopId: task.workshop,
        raisedTo,
        comment,
      };
    }
    try {
      if (isFirst && multiChain) {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/escalations`,
          payload,
          { withCredentials: true }
        );
        toast.success('Escalation raised successfully');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/escalations`,
          payload,
          { withCredentials: true }
        );
        toast.success('Escalation raised successfully');
      }
    } catch (err) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.message === 'Task already has an escalation' &&
        task.escalationId
      ) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/escalations/${task.escalationId
          }`,
          { raisedTo, comment },
          { withCredentials: true }
        );
        toast.success('Escalation updated successfully');
      } else {
        throw err;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (userRole === 'PC') {
        // If both selected and no escalationId, send both in one POST
        if (!task.escalationId && (selectedMd || selectedEa)) {
          const multiChain = [
            selectedMd ? { raisedTo: selectedMd, comment } : null,
            selectedEa ? { raisedTo: selectedEa, comment } : null,
          ].filter(Boolean);
          await sendEscalation(null, true, multiChain);
        } else {
          // If only one or updating, use existing logic
          const promises = [];
          if (selectedMd) promises.push(sendEscalation(selectedMd));
          if (selectedEa) promises.push(sendEscalation(selectedEa));
          await Promise.all(promises);
        }
      } else if (userRole === 'EA') {
        await sendEscalation(selectedMd);
      } else if (userRole === 'MD') {
        await sendEscalation(task.doer?._id);
      }
      onEscalationRaised();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to raise escalation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-800'>
            Raise Escalation
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block mb-1 text-sm font-semibold text-gray-700'>
              Comment
            </label>
            <textarea
              className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
            />
          </div>
          {userRole === 'PC' && (
            <>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Select MD (optional)
                </label>
                <select
                  className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  value={selectedMd}
                  onChange={(e) => setSelectedMd(e.target.value)}
                >
                  <option value=''>Select MD</option>
                  {mds.map((md) => (
                    <option key={md._id} value={md._id}>
                      {md.name} ({md.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block mb-1 text-sm font-semibold text-gray-700'>
                  Select EA (optional)
                </label>
                <select
                  className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                  value={selectedEa}
                  onChange={(e) => setSelectedEa(e.target.value)}
                >
                  <option value=''>Select EA</option>
                  {ea && (
                    <option value={ea._id}>
                      {ea.name} ({ea.email})
                    </option>
                  )}
                </select>
              </div>
              <div className='text-xs text-gray-500'>
                Select at least one: MD or EA
              </div>
            </>
          )}
          {userRole === 'EA' && (
            <div>
              <label className='block mb-1 text-sm font-semibold text-gray-700'>
                Select MD
              </label>
              <select
                className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                value={selectedMd}
                onChange={(e) => setSelectedMd(e.target.value)}
                required
              >
                <option value=''>Select MD</option>
                {mds.map((md) => (
                  <option key={md._id} value={md._id}>
                    {md.name} ({md.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className='flex justify-end gap-3'>
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!canSubmit}
              className='cursor-pointer px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50'
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewEscalationModal({ open, onOpenChange, taskId }) {
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && taskId) {
      setLoading(true);
      setError(null);
      axios
        .get(
          `${import.meta.env.VITE_API_BASE_URL}/escalations/task/${taskId}`,
          { withCredentials: true }
        )
        .then((res) => {
          setEscalation(res.data.data);
        })
        .catch(() => {
          setError('Failed to fetch escalation');
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setEscalation(null);
      setError(null);
    }
  }, [open, taskId]);

  // Sort escalation chain by timestamp (latest first)
  const sortedChain = escalation?.escalationChain
    ? [...escalation.escalationChain].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg rounded-xl border border-gray-200 bg-white dark:bg-gray-900'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-800'>
            Escalation History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='text-center py-8 text-gray-500'>Loading...</div>
        ) : error ? (
          <div className='text-center text-red-600 py-8'>{error}</div>
        ) : escalation ? (
          <div className='space-y-4 max-h-[400px] overflow-y-auto'>
            {sortedChain.map((entry, idx) => (
              <div
                key={idx}
                className='border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800'
              >
                <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
                  <span>
                    Raised By: {entry.raisedBy?.name || 'Unknown'} (
                    {entry.raisedBy?.role || '-'})
                  </span>
                  <span>→</span>
                  <span>
                    To: {entry.raisedTo?.name || 'Unknown'} (
                    {entry.raisedTo?.role || '-'})
                  </span>
                  <span>•</span>
                  <span>
                    {entry.timestamp
                      ? format(new Date(entry.timestamp), 'PPP p')
                      : ''}
                  </span>
                </div>
                <div className='text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line'>
                  {entry.comment}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center text-gray-500 py-8'>
            No escalation data found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NAModal({ open, onOpenChange, task, onNAComplete }) {
  const [naRemark, setNaRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setNaRemark('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!naRemark.trim()) {
      toast.error('Please provide a reason for marking as NA');
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/workshop/${task._id}/status`,
        { status: 'Completed', NARemark: naRemark.trim() },
        { withCredentials: true }
      );
      onNAComplete(task._id);
      onOpenChange(false);
      toast.success('Task marked as NA and completed!');
    } catch (error) {
      toast.error('Failed to mark task as NA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-xl border border-gray-200'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl font-bold text-gray-800'>
            <XCircle className='h-5 w-5 text-orange-600' />
            Mark Task as NA
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block mb-1 text-sm font-semibold text-gray-700'>
              Reason for NA *
            </label>
            <Textarea
              className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition min-h-[100px]'
              value={naRemark}
              onChange={(e) => setNaRemark(e.target.value)}
              required
              placeholder='Enter the reason for marking this task as NA...'
              rows={4}
            />
          </div>
          <div className='flex justify-end gap-3'>
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!naRemark.trim() || submitting}
              className='cursor-pointer px-5 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50'
            >
              {submitting ? 'Submitting...' : 'Mark as NA'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CurrentTasks() {
  const location = useLocation();
  const [activeTasks, setActiveTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [tabLoading, setTabLoading] = useState({ active: false, overdue: false });
  const loadedTabsRef = useRef({ active: false, overdue: false });
  const [error, setError] = useState(null);
  const [checklistModal, setChecklistModal] = useState({
    open: false,
    checklist: [],
    taskId: null,
  });
  const [activeTab, setActiveTab] = useState(
    () => location.state?.activeTab || 'active'
  );
  const [workshopTypes, setWorkshopTypes] = useState([]);
  const userRole = JSON.parse(localStorage.getItem('role'));
  const [documentModal, setDocumentModal] = useState({
    open: false,
    taskId: null,
    documents: [],
  });
  const [commentsModal, setCommentsModal] = useState({
    open: false,
    taskId: null,
  });
  const [escalationModal, setEscalationModal] = useState({
    open: false,
    task: null,
  });
  const [viewEscalationModal, setViewEscalationModal] = useState({
    open: false,
    taskId: null,
  });
  const [naModal, setNaModal] = useState({
    open: false,
    task: null,
  });
  const [filters, setFilters] = useState(() => ({
    workshop: 'all',
    endDate: [null, null],
    critical: 'all',
    documents: 'all',
    escalation: 'all',
    department: 'all',
    comments: 'all',
    ...(location.state?.filters || {}),
  }));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState({
    active: 'asc',
    overdue: 'desc',
  });
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({
    workshopName: true,
    taskId: true,
    narration: false,
    // Role-based columns
    ...(userRole === 'PC' ? { doer: true } : {}),
    ...(userRole === 'EA' ? { pc: true, doer: true } : {}),
    ...(userRole === 'MD' ? { ea: true, pc: true, doer: true } : {}),
    checklist: true,
    document: true,
    comments: true,
    daysToClose: true,
    endDate: true,
    action: true,
    escalation: true,
  });

  // State to control filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Function to toggle column visibility
  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Helper for quick-selects
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfNextWeek = new Date(endOfWeek);
  startOfNextWeek.setDate(endOfWeek.getDate() + 1);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  // Helper function to get workshop type name from ID
  const getWorkshopTypeName = (taskId) => {
    if (!taskId || !workshopTypes || workshopTypes.length === 0) return '-';
    const abbreviation = taskId.split('-')[0];
    const foundType = workshopTypes.find(
      (type) => type.abbreviation === abbreviation
    );
    return foundType ? foundType.name : abbreviation;
  };

  // Calculate days between today and endDate
  const calculateDays = (endDate) => {
    if (!endDate) return null;
    const today = startOfDay(new Date());
    const taskEndDate = startOfDay(new Date(endDate));
    return differenceInDays(taskEndDate, today);
  };

  // Check if task is overdue
  const isOverdue = (endDate) => {
    if (!endDate) return false;
    const today = startOfDay(new Date());
    const taskEndDate = startOfDay(new Date(endDate));
    return isBefore(taskEndDate, today);
  };

  // Process tasks to add calculated days and categorize them
  const processTasks = (tasks) => {
    const active = [];
    const overdue = [];
    const today = startOfDay(new Date());

    tasks.forEach((task) => {
      // Use plannedDate if available, else fallback to endDate
      const plannedDate = task.endDate
        ? startOfDay(new Date(task.endDate))
        : startOfDay(new Date(task.endDate));
      const isDaily =
        task.frequency === 'Daily' ||
        (task.taskId && task.taskId.includes('/'));

      const processedTask = {
        ...task,
        daysToClose: calculateDays(plannedDate),
      };

      if (isDaily) {
        if (isBefore(plannedDate, today)) {
          // Overdue daily task
          overdue.push(processedTask);
        } else if (plannedDate.getTime() === today.getTime()) {
          // Only show today's daily task as active
          active.push(processedTask);
        }
        // Do not show future daily tasks in active
      } else {
        if (isOverdue(plannedDate)) {
          overdue.push(processedTask);
        } else {
          active.push(processedTask);
        }
      }
    });

    // Sort as before
    active.sort((a, b) => {
      if (a.daysToClose === null) return 1;
      if (b.daysToClose === null) return -1;
      return a.daysToClose - b.daysToClose;
    });
    overdue.sort((a, b) => {
      if (a.daysToClose === null) return 1;
      if (b.daysToClose === null) return -1;
      return Math.abs(b.daysToClose) - Math.abs(a.daysToClose);
    });
    return { active, overdue };
  };

  // Fetch tasks for a single tab ('active' | 'overdue') from the backend,
  // skipping the call entirely if that tab's data is already loaded.
  const fetchTasksForTab = (tab) => {
    if (loadedTabsRef.current[tab]) return;
    loadedTabsRef.current[tab] = true;
    setTabLoading((prev) => ({ ...prev, [tab]: true }));
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/tasks/current`, {
        params: { type: tab },
        withCredentials: true,
      })
      .then((res) => {
        if (tab === 'active') setActiveTasks(res.data.activeTasks || []);
        else setOverdueTasks(res.data.overdueTasks || []);
      })
      .catch(() => {
        loadedTabsRef.current[tab] = false; // allow retry
        setError('Failed to fetch tasks');
      })
      .finally(() => {
        setTabLoading((prev) => ({ ...prev, [tab]: false }));
      });
  };

  useEffect(() => {
    // Fetch workshop types
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/setup/templates/types`, {
        withCredentials: true,
      })
      .then((res) => {
        setWorkshopTypes(res.data.workshopTypes || []);
      })
      .catch((err) => {
        console.error('Error fetching workshop types:', err);
      });
    // Only fetch the tasks for the tab that's initially active
    fetchTasksForTab(activeTab);
    // eslint-disable-next-line
  }, []);

  // If navigation state changes (e.g. user comes from Dashboard), update tab/filters
  useEffect(() => {
    if (location.state) {
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
        fetchTasksForTab(location.state.activeTab);
      }
      if (location.state.filters)
        setFilters((f) => ({ ...f, ...location.state.filters }));
    }
    // eslint-disable-next-line
  }, [location.state]);

  // Fetch unread notifications on mount
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/tasks/unread-notifications`,
          { withCredentials: true }
        );
        setUnreadNotifications(res.data.notifications || []);
      } catch (err) {
        toast.error('Failed to fetch unread notifications');
        setUnreadNotifications([]);
      }
    };
    fetchUnreadNotifications();
  }, []);

  // Handler to open checklist modal
  const handleOpenChecklist = (task) => {
    setChecklistModal({
      open: true,
      checklist: task.checklist || [],
      taskId: task._id,
    });
  };

  const handleChecklistUpdate = (updatedChecklist) => {
    // Update the task in the active/overdue tasks list
    setActiveTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === checklistModal.taskId
          ? { ...task, checklist: updatedChecklist }
          : task
      )
    );
    setOverdueTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === checklistModal.taskId
          ? { ...task, checklist: updatedChecklist }
          : task
      )
    );
  };

  // Handler for NA completion - removes task from active/overdue lists
  const handleNAComplete = (taskId) => {
    setActiveTasks((prev) => prev.filter((t) => t._id !== taskId));
    setOverdueTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  // Update the handleOpenDocumentModal function
  const handleOpenDocumentModal = async (taskId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/documents/upload/task/${taskId}`,
        { withCredentials: true }
      );
      setDocumentModal({
        open: true,
        taskId,
        documents: response.data || [], // Ensure we always have an array
      });
    } catch (error) {
      // If there's an error, still open the modal with empty documents array
      setDocumentModal({
        open: true,
        taskId,
        documents: [],
      });
      // Only show error toast if it's not a 404 (no documents) error
      if (error.response?.status !== 404) {
        toast.error('Error fetching documents');
      }
    }
  };

  // Helper: get unique values from filtered data
  const getUnique = (arr, fn) =>
    Array.from(new Set(arr.map(fn).filter(Boolean)));

  // Compute filtered tasks
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      if (
        filters.workshop !== 'all' &&
        task.workshop?.workshopId !== filters.workshop
      )
        return false;
      if (
        filters.endDate[0] &&
        new Date(task.endDate) < startOfDay(filters.endDate[0])
      )
        return false;
      if (
        filters.endDate[1] &&
        new Date(task.endDate) > endOfDay(filters.endDate[1])
      )
        return false;
      if (
        filters.critical !== 'all' &&
        filters.critical === 'Critical' &&
        !task.isCritical
      )
        return false;
      if (
        filters.critical !== 'all' &&
        filters.critical === 'Non-critical' &&
        task.isCritical
      )
        return false;
      if (
        filters.documents !== 'all' &&
        filters.documents === 'Yes' &&
        (!task.documents || task.documents.length === 0)
      )
        return false;
      if (
        filters.documents !== 'all' &&
        filters.documents === 'No' &&
        task.documents &&
        task.documents.length > 0
      )
        return false;
      if (
        filters.escalation !== 'all' &&
        filters.escalation === 'Yes' &&
        !task.escalationId
      )
        return false;
      if (
        filters.escalation !== 'all' &&
        filters.escalation === 'No' &&
        task.escalationId
      )
        return false;
      if (
        filters.department !== 'all' &&
        task.department !== filters.department
      )
        return false;
      if (filters.comments !== 'all') {
        if (filters.comments === 'Yes' && !task.comments) return false;
        if (filters.comments === 'No' && task.comments) return false;
      }
      if (
        filters.doer &&
        filters.doer !== 'all' &&
        task.doer?.name !== filters.doer
      )
        return false;
      if (filters.pc && filters.pc !== 'all' && task.pc?.name !== filters.pc)
        return false;
      if (filters.ea && filters.ea !== 'all' && task.ea?.name !== filters.ea)
        return false;
      return true;
    });
  }, [activeTasks, filters]);

  // Compute filtered overdue tasks
  const filteredOverdueTasks = useMemo(() => {
    return overdueTasks.filter((task) => {
      if (
        filters.workshop !== 'all' &&
        task.workshop?.workshopId !== filters.workshop
      )
        return false;
      if (
        filters.endDate[0] &&
        new Date(task.endDate) < startOfDay(filters.endDate[0])
      )
        return false;
      if (
        filters.endDate[1] &&
        new Date(task.endDate) > endOfDay(filters.endDate[1])
      )
        return false;
      if (
        filters.critical !== 'all' &&
        filters.critical === 'Critical' &&
        !task.isCritical
      )
        return false;
      if (
        filters.critical !== 'all' &&
        filters.critical === 'Non-critical' &&
        task.isCritical
      )
        return false;
      if (
        filters.documents !== 'all' &&
        filters.documents === 'Yes' &&
        (!task.documents || task.documents.length === 0)
      )
        return false;
      if (
        filters.documents !== 'all' &&
        filters.documents === 'No' &&
        task.documents &&
        task.documents.length > 0
      )
        return false;
      if (
        filters.escalation !== 'all' &&
        filters.escalation === 'Yes' &&
        !task.escalationId
      )
        return false;
      if (
        filters.escalation !== 'all' &&
        filters.escalation === 'No' &&
        task.escalationId
      )
        return false;
      if (
        filters.department !== 'all' &&
        task.department !== filters.department
      )
        return false;
      if (filters.comments !== 'all') {
        if (filters.comments === 'Yes' && !task.comments) return false;
        if (filters.comments === 'No' && task.comments) return false;
      }
      if (
        filters.doer &&
        filters.doer !== 'all' &&
        task.doer?.name !== filters.doer
      )
        return false;
      if (filters.pc && filters.pc !== 'all' && task.pc?.name !== filters.pc)
        return false;
      if (filters.ea && filters.ea !== 'all' && task.ea?.name !== filters.ea)
        return false;
      return true;
    });
  }, [overdueTasks, filters]);

  // Compute dynamic filter options from all tasks (active + overdue)
  const allTasks = [...activeTasks, ...overdueTasks];
  const availableWorkshops = getUnique(allTasks, (t) => t.workshop?.workshopId);
  const availableCritical = ['Critical', 'Non-critical'];
  const availableDocuments = ['Yes', 'No'];
  const availableEscalation = ['Yes', 'No'];
  const availableDepartments = getUnique(allTasks, (t) => t.department);

  // Filter bar UI
  const FilterBar = (
    <div className='flex flex-wrap gap-4 mb-4 items-end max-h-[400px] overflow-y-auto pr-2'>
      {/* Workshop Name */}
      <div>
        <label className='block text-xs font-medium mb-1'>Workshop ID</label>
        <Select
          value={filters.workshop}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, workshop: value }))
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {availableWorkshops.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* End Date Range */}
      <div>
        <label className='block text-xs font-medium mb-1'>Planned Date</label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className='cursor-pointer max-w-[380px] min-w-[220px] h-10 justify-start text-left'
            >
              {filters.endDate[0] && filters.endDate[1]
                ? `${format(filters.endDate[0], 'PPP')} - ${format(
                  filters.endDate[1],
                  'PPP'
                )}`
                : 'Select range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-0'>
            <div className='flex gap-2 p-2 border-b'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() =>
                  setFilters((f) => ({ ...f, endDate: [today, today] }))
                }
                className='cursor-pointer'
              >
                Today
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    endDate: [startOfWeek, endOfWeek],
                  }))
                }
                className='cursor-pointer '
              >
                This Week
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    endDate: [startOfNextWeek, endOfNextWeek],
                  }))
                }
                className='cursor-pointer '
              >
                Next Week
              </Button>
            </div>
            <Calendar
              mode='range'
              selected={{ from: filters.endDate[0], to: filters.endDate[1] }}
              onSelect={(range) =>
                setFilters((f) => ({
                  ...f,
                  endDate: [range?.from || null, range?.to || null],
                }))
              }
              initialFocus
            />
            <div className='flex justify-end p-2'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() =>
                  setFilters((f) => ({ ...f, endDate: [null, null] }))
                }
                className='cursor-pointer '
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Critical (only for PC, EA, MD) */}
      {(userRole === 'PC' || userRole === 'EA' || userRole === 'MD') && (
        <div>
          <label className='block text-xs font-medium mb-1'>Critical</label>
          <Select
            value={filters.critical}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, critical: value }))
            }
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='All' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {availableCritical.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Documents Uploaded */}
      <div>
        <label className='block text-xs font-medium mb-1'>
          Documents Uploaded
        </label>
        <Select
          value={filters.documents}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, documents: value }))
          }
        >
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {availableDocuments.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Escalation */}
      <div>
        <label className='block text-xs font-medium mb-1'>Escalation</label>
        <Select
          value={filters.escalation}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, escalation: value }))
          }
        >
          <SelectTrigger className='w-[120px]'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {availableEscalation.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Department */}
      <div>
        <label className='block text-xs font-medium mb-1'>Department</label>
        <Select
          value={filters.department}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, department: value }))
          }
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {availableDepartments.map((dep) => (
              <SelectItem key={dep} value={dep}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Comments */}
      <div>
        <label className='block text-xs font-medium mb-1'>Comments</label>
        <Select
          value={filters.comments}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, comments: value }))
          }
        >
          <SelectTrigger className='w-[120px]'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='Yes'>Yes</SelectItem>
            <SelectItem value='No'>No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(userRole === 'PC' || userRole === 'EA' || userRole === 'MD') && (
        <div>
          <label className='block text-xs font-medium mb-1'>Doer</label>
          <Select
            value={filters.doer}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, doer: value }))
            }
          >
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {getUnique(
                [...activeTasks, ...overdueTasks],
                (t) => t.doer?.name
              ).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {(userRole === 'EA' || userRole === 'MD') && (
        <div>
          <label className='block text-xs font-medium mb-1'>
            Process Coordinator
          </label>
          <Select
            value={filters.pc}
            onValueChange={(value) => setFilters((f) => ({ ...f, pc: value }))}
          >
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {getUnique(
                [...activeTasks, ...overdueTasks],
                (t) => t.pc?.name
              ).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {userRole === 'MD' && (
        <div>
          <label className='block text-xs font-medium mb-1'>
            Executive Assistant
          </label>
          <Select
            value={filters.ea}
            onValueChange={(value) => setFilters((f) => ({ ...f, ea: value }))}
          >
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              {getUnique(
                [...activeTasks, ...overdueTasks],
                (t) => t.ea?.name
              ).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  // Sorting logic for daysToClose/daysDelayed
  const sortTasks = (tasks, tab) => {
    return [...tasks].sort((a, b) => {
      const aVal =
        tab === 'active'
          ? Math.abs(a.daysToClose ?? 0)
          : Math.abs(a.daysDelayed ?? 0);
      const bVal =
        tab === 'active'
          ? Math.abs(b.daysToClose ?? 0)
          : Math.abs(b.daysDelayed ?? 0);
      if (sortOrder[tab] === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
  };

  const sortedActiveTasks = useMemo(
    () => sortTasks(filteredTasks, 'active'),
    [filteredTasks, sortOrder.active]
  );
  const sortedOverdueTasks = useMemo(
    () => sortTasks(filteredOverdueTasks, 'overdue'),
    [filteredOverdueTasks, sortOrder.overdue]
  );

  // When switching tabs, if the sortOrder for that tab is undefined, set it to the default
  useEffect(() => {
    setSortOrder((order) => {
      if (activeTab === 'active' && order.active === undefined) {
        return { ...order, active: 'asc' };
      }
      if (activeTab === 'overdue' && order.overdue === undefined) {
        return { ...order, overdue: 'desc' };
      }
      return order;
    });
  }, [activeTab]);

  const columns = [
    {
      header: 'Workshop Name',
      accessorKey: 'workshopName',
      cell: (info) => getWorkshopTypeName(info.row.original.taskId) || '-',
      meta: { minWidth: 250, width: 250 },
    },
    {
      header: 'Task ID',
      accessorKey: 'taskId',
      cell: (info) => info.getValue() || '-',
      meta: { minWidth: 200, width: 200 },
    },
    {
      header: 'Task Narration',
      accessorKey: 'narration',
      cell: (info) => info.getValue() || '-',
      meta: { minWidth: 500, width: 500 },
    },
    // Role-based columns
    ...(userRole === 'PC' ? [{
      header: 'Doer',
      accessorKey: 'doer',
      cell: (info) => info.row.original.doer?.name || '-',
      meta: { minWidth: 200, width: 200 },
    }] : []),
    ...(userRole === 'EA' ? [
      {
        header: 'Process Coordinator',
        accessorKey: 'pc',
        cell: (info) => info.row.original.pc?.name || '-',
        meta: { minWidth: 200, width: 200 },
      },
      {
        header: 'Doer',
        accessorKey: 'doer',
        cell: (info) => info.row.original.doer?.name || '-',
        meta: { minWidth: 200, width: 200 },
      }
    ] : []),
    ...(userRole === 'MD' ? [
      {
        header: 'Executive Assistant',
        accessorKey: 'ea',
        cell: (info) => info.row.original.ea?.name || '-',
        meta: { minWidth: 200, width: 200 },
      },
      {
        header: 'Process Coordinator',
        accessorKey: 'pc',
        cell: (info) => info.row.original.pc?.name || '-',
        meta: { minWidth: 200, width: 200 },
      },
      {
        header: 'Doer',
        accessorKey: 'doer',
        cell: (info) => info.row.original.doer?.name || '-',
        meta: { minWidth: 200, width: 200 },
      }
    ] : []),
    {
      header: () => <div className='text-center'>Checklist</div>,
      headerText: 'Checklist',
      accessorKey: 'checklist',
      cell: (info) => {
        const checklist = info.row.original.checklist || [];
        const checkedCount = checklist.filter((item) => item.checked).length;
        const totalCount = checklist.length;
        const isComplete = totalCount === 0 || checkedCount === totalCount;

        return (
          <div className='flex justify-center'>
            <button
              type='button'
              onClick={() => handleOpenChecklist(info.row.original)}
              className={`cursor-pointer flex items-center gap-1 px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 ${isComplete
                ? 'bg-green-50 hover:bg-green-100 focus:ring-green-400'
                : 'bg-red-50 hover:bg-red-100 focus:ring-red-400'
                }`}
              title={`${checkedCount}/${totalCount} items completed`}
            >
              <ClipboardList className={`w-4 h-4 ${isComplete ? 'text-green-600' : 'text-red-600'
                }`} />
              <span className={`ml-1 text-xs font-semibold ${isComplete ? 'text-green-700' : 'text-red-700'
                }`}>
                {checkedCount}/{totalCount}
              </span>
            </button>
          </div>
        );
      },
      meta: { minWidth: 140, width: 140 },
    },
    {
      header: () => <div className='text-center'>Document</div>,
      headerText: 'Document',
      accessorKey: 'document',
      cell: (info) => (
        <div className='flex justify-center'>
          <Button
            variant='ghost'
            size='icon'
            onClick={async () => {
              await markNotificationAsRead(info.row.original._id, 'document');
              handleOpenDocumentModal(info.row.original._id);
            }}
            className='hover:bg-gray-100 cursor-pointer '
          >
            <Upload className='w-4 h-4' />
          </Button>
        </div>
      ),
      meta: { minWidth: 150, width: 150 },
    },
    {
      header: () => <div className='text-center'>Comments</div>,
      headerText: 'Comments',
      accessorKey: 'comments',
      cell: (info) => (
        <div className='flex justify-center'>
          <Button
            variant='ghost'
            size='icon'
            onClick={async () => {
              await markNotificationAsRead(info.row.original._id, 'comment');
              setCommentsModal({ open: true, taskId: info.row.original._id });
            }}
            className='hover:bg-gray-100 cursor-pointer '
          >
            <MessageSquare className='w-4 h-4' />
          </Button>
        </div>
      ),
      meta: { minWidth: 150, width: 150 },
    },
    {
      header: () => (
        <span
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() =>
            setSortOrder((order) => ({
              ...order,
              [activeTab]: order[activeTab] === 'asc' ? 'desc' : 'asc',
            }))
          }
        >
          {activeTab === 'active' ? 'Days to Close' : 'Days Overdue'}
          {sortOrder[activeTab] === 'asc' ? (
            <ChevronUp
              className='w-4 h-4 ml-1'
              style={{ width: 16, height: 16 }}
            />
          ) : (
            <ChevronDown
              className='w-4 h-4 ml-1'
              style={{ width: 16, height: 16 }}
            />
          )}
        </span>
      ),
      headerText: 'Days to Close / Days Overdue',
      accessorKey: activeTab === 'active' ? 'daysToClose' : 'daysDelayed',
      cell: (info) => {
        const value =
          activeTab === 'active'
            ? info.row.original.daysToClose
            : info.row.original.daysDelayed;
        if (value === null || value === undefined) return '-';
        return Math.abs(value);
      },
      meta: { minWidth: 200, width: 200 },
    },
    {
      header: 'Planned Date',
      accessorKey: 'endDate',
      cell: (info) => {
        const date = info.getValue();
        return date ? format(new Date(date), 'PPP') : '-';
      },
      meta: { minWidth: 180, width: 180 },
    },
    {
      header: () => <div className='text-center'>Action</div>,
      headerText: 'Action',
      accessorKey: 'action',
      cell: (info) => {
        const task = info.row.original;
        const checklist = task.checklist || [];
        const allChecked =
          checklist.length > 0 && checklist.every((item) => item.checked);
        const isCompleted = task.status === 'Completed';
        // Enable if no checklist or all checked
        const canMarkComplete = checklist.length === 0 || allChecked;
        return (
          <div className='flex justify-center gap-2'>
            <button
              type='button'
              title={
                isCompleted
                  ? 'Task Completed'
                  : canMarkComplete
                    ? 'Mark as Completed'
                    : 'Complete all checklist items first'
              }
              disabled={!canMarkComplete || isCompleted}
              onClick={async () => {
                try {
                  await axios.put(
                    `${import.meta.env.VITE_API_BASE_URL}/workshop/${task._id
                    }/status`,
                    { status: 'Completed' },
                    { withCredentials: true }
                  );
                  setActiveTasks((prev) =>
                    prev.filter((t) => t._id !== task._id)
                  );
                  setOverdueTasks((prev) =>
                    prev.filter((t) => t._id !== task._id)
                  );
                  toast.success('Task marked as completed!');
                } catch (error) {
                  toast.error('Failed to mark as completed');
                }
              }}
              className={`
    flex items-center justify-center cursor-pointer  p-2 rounded-lg
    ${isCompleted ? 'bg-green-50' : canMarkComplete ? 'bg-green-50' : 'bg-gray-50'}
    hover:bg-green-100
    transition
    focus:outline-none focus:ring-2 focus:ring-green-400
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
            >
              <CheckCircle
                className={`w-5 h-5 ${isCompleted ? 'text-green-500' : canMarkComplete ? 'text-green-500' : 'text-gray-400'
                  }`}
              />
            </button>
            <button
              type='button'
              title={isCompleted ? 'Task Completed' : 'Mark as NA'}
              disabled={isCompleted}
              onClick={() => setNaModal({ open: true, task })}
              className={`
    flex items-center justify-center cursor-pointer p-2 rounded-lg
    ${isCompleted ? 'bg-gray-50' : 'bg-orange-50'}
    hover:bg-orange-100
    transition
    focus:outline-none focus:ring-2 focus:ring-orange-400
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
            >
              <XCircle
                className={`w-5 h-5 ${isCompleted ? 'text-gray-400' : 'text-orange-500'
                  }`}
              />
            </button>
          </div>
        );
      },
      meta: { minWidth: 150, width: 150 },
    },
    // Only show escalation column for overdue tasks
    ...(activeTab === 'overdue'
      ? [
        {
          header: () => <div className='text-center'>Escalation</div>,
          headerText: 'Escalation',
          accessorKey: 'escalationId',
          cell: (info) => {
            const task = info.row.original;
            const hasEscalation =
              task.escalationId !== null && task.escalationId !== undefined;
            // For Doer role
            if (userRole === 'Doer') {
              return (
                <div className='flex justify-center'>
                  {hasEscalation ? (
                    <AlertTriangle
                      className='w-5 h-5 text-yellow-500 cursor-pointer'
                      title='View Escalation'
                      onClick={async () => {
                        await markNotificationAsRead(task._id, 'escalation');
                        setViewEscalationModal({ open: true, taskId: task._id });
                      }}
                    />
                  ) : (
                    '-'
                  )}
                </div>
              );
            }
            // For PC, EA, and MD roles
            if (userRole === 'PC' || userRole === 'EA' || userRole === 'MD') {
              return (
                <div className='flex justify-center'>
                  <div className='flex items-center gap-2'>
                    {hasEscalation && (
                      <button
                        type='button'
                        title='View Escalation'
                        className='cursor-pointer p-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        onClick={async () => {
                          await markNotificationAsRead(task._id, 'escalation');
                          setViewEscalationModal({
                            open: true,
                            taskId: task._id,
                          });
                        }}
                      >
                        <AlertTriangle className='w-5 h-5 text-yellow-600' />
                      </button>
                    )}
                    <button
                      type='button'
                      title='Raise Escalation'
                      className='cursor-pointer p-2 rounded-lg bg-red-50 hover:bg-red-100 transition focus:outline-none focus:ring-2 focus:ring-red-400'
                      onClick={() => setEscalationModal({ open: true, task })}
                    >
                      <Flag className='w-4 h-4 text-red-500' />
                    </button>
                  </div>
                </div>
              );
            } else {
              // Default case
              return (
                <div className='flex justify-center'>
                  {hasEscalation ? (
                    <AlertTriangle className='w-5 h-5 text-yellow-500' />
                  ) : (
                    '-'
                  )}
                </div>
              );
            }
          },
          meta: { minWidth: 180, width: 180 },
        },
      ]
      : []),
  ];

  // Helper to mark a notification as read by type and taskId (now inside component)
  async function markNotificationAsRead(taskId, type) {
    const notif = unreadNotifications.find(
      (n) => n.taskId?.toString() === taskId?.toString() && n.type === type
    );
    if (!notif) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/notification/${notif._id
        }/read`,
        {},
        { withCredentials: true }
      );
      setUnreadNotifications((prev) => prev.filter((n) => n._id !== notif._id));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  }

  return (
    <div className='flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50'>
      <div className='p-8 flex-none'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold text-gray-800 tracking-tight'>
            Current Tasks
          </h1>
          <button
            type='button'
            onClick={() => setShowFilters(!showFilters)}
            className='cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition shadow-sm'
            title={showFilters ? 'Hide Filters' : 'Show Filters'}
          >
            {showFilters ? (
              <>
                <X className='h-4 w-4' />
                Hide Filters
              </>
            ) : (
              <>
                <Filter className='h-4 w-4' />
                Show Filters
              </>
            )}
          </button>
        </div>

        {showFilters && FilterBar}
      </div>

      <div className='px-8 flex-grow overflow-hidden flex flex-col'>
        <div className='rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 h-full flex flex-col'>
          <div className='p-6 flex-grow overflow-hidden flex flex-col'>
            <Tabs
              value={activeTab}
              className='w-full h-full flex flex-col'
              onValueChange={(value) => {
                setActiveTab(value);
                fetchTasksForTab(value);
              }}
            >
              <TabsList className='mb-2 flex-none bg-gray-100 rounded-lg border border-gray-200 p-1 gap-2'>
                <TabsTrigger
                  value='active'
                  className='data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-5 py-2 font-semibold text-gray-700 transition cursor-pointer '
                >
                  Active Tasks
                </TabsTrigger>
                <TabsTrigger
                  value='overdue'
                  className='data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-5 py-2 font-semibold text-gray-700 transition cursor-pointer '
                >
                  Overdue Tasks
                </TabsTrigger>
              </TabsList>
              <TabsContent value='active' className='flex-grow overflow-hidden'>
                {tabLoading.active ? (
                  <div className='text-center py-10 text-gray-500'>
                    Loading...
                  </div>
                ) : error ? (
                  <div className='text-red-500 text-center py-10'>{error}</div>
                ) : (
                  <div className='h-full'>
                    <TasksTable
                      columns={columns}
                      data={sortedActiveTasks}
                      unreadNotifications={unreadNotifications}
                      visibleColumns={visibleColumns}
                      toggleColumnVisibility={toggleColumnVisibility}
                    />
                  </div>
                )}
              </TabsContent>
              <TabsContent value='overdue' className='flex-grow overflow-hidden'>
                {tabLoading.overdue ? (
                  <div className='text-center py-10 text-gray-500'>
                    Loading...
                  </div>
                ) : error ? (
                  <div className='text-red-500 text-center py-10'>{error}</div>
                ) : (
                  <div className='h-full'>
                    <TasksTable
                      columns={columns}
                      data={sortedOverdueTasks}
                      unreadNotifications={unreadNotifications}
                      visibleColumns={visibleColumns}
                      toggleColumnVisibility={toggleColumnVisibility}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ChecklistModal
        open={checklistModal.open}
        onOpenChange={(open) =>
          setChecklistModal((prev) => ({ ...prev, open }))
        }
        checklist={checklistModal.checklist}
        taskId={checklistModal.taskId}
        onChecklistUpdate={handleChecklistUpdate}
      />
      <DocumentModal
        open={documentModal.open}
        onOpenChange={(open) => setDocumentModal((prev) => ({ ...prev, open }))}
        taskId={documentModal.taskId}
        documents={documentModal.documents}
        onDocumentsChange={(documents) =>
          setDocumentModal((prev) => ({ ...prev, documents }))
        }
      />
      <CommentsModal
        open={commentsModal.open}
        onOpenChange={(open) => setCommentsModal((prev) => ({ ...prev, open }))}
        taskId={commentsModal.taskId}
      />
      <RaiseEscalationModal
        open={escalationModal.open}
        onOpenChange={(open) =>
          setEscalationModal((prev) => ({ ...prev, open }))
        }
        task={escalationModal.task}
        userRole={userRole}
        onEscalationRaised={() => {
          // Optionally refresh tasks or update UI
        }}
      />
      <ViewEscalationModal
        open={viewEscalationModal.open}
        onOpenChange={(open) =>
          setViewEscalationModal((prev) => ({ ...prev, open }))
        }
        taskId={viewEscalationModal.taskId}
      />
      <NAModal
        open={naModal.open}
        onOpenChange={(open) => setNaModal((prev) => ({ ...prev, open }))}
        task={naModal.task}
        onNAComplete={handleNAComplete}
      />
    </div>
  );
}
