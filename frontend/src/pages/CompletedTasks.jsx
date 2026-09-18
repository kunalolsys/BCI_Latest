import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  format,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Upload,
  Trash2,
  Download,
  FileText,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Checkbox } from "../components/ui/checkbox";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { useLocation } from "react-router-dom";

function TasksTable({
  columns,
  data = [],
  visibleColumns = {},
  toggleColumnVisibility,
  pagination = { page: 1, limit: 20, totalTasks: 0, totalPages: 1 },
  onPageChange,
  loading = false,
}) {
  // Safe extraction of column headers
  const getHeaderText = (col) => {
    if (typeof col.header === "string") return col.header;
    if (col.headerText) return col.headerText;
    if (col.accessorKey) {
      return col.accessorKey
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }
    return col.id || "Column";
  };

  // Filter visible columns
  const visibleColumnsData = React.useMemo(() => {
    return columns.filter((col, index) => {
      const columnKey = col.accessorKey || col.id || `column-${index}`;
      return visibleColumns[columnKey] !== false;
    });
  }, [columns, visibleColumns]);

  const table = useReactTable({
    data,
    columns: visibleColumnsData,
    getCoreRowModel: getCoreRowModel(),
  });

  const hiddenCardActive = Object.values(visibleColumns).some(
    (visible) => visible === false,
  );

  const { page, limit, totalTasks, totalPages } = pagination;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hidden Columns Ribbon */}
      {hiddenCardActive && (
        <div className="w-auto mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-none">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Hidden Columns:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {columns.map((col, index) => {
              const columnKey = col.accessorKey || col.id || `column-${index}`;
              if (visibleColumns[columnKey] === false) {
                return (
                  <button
                    key={columnKey}
                    type="button"
                    onClick={() => toggleColumnVisibility(columnKey)}
                    className="cursor-pointer px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    + {getHeaderText(col)}
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="flex-grow overflow-hidden">
        <div className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="flex-grow overflow-y-auto overflow-x-auto">
            <table
              className="w-full table-fixed rounded-2xl border-separate border-spacing-0"
              style={{ minWidth: "max-content" }}
            >
              <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const columnKey =
                        header.column.columnDef.accessorKey ||
                        header.column.columnDef.id ||
                        `column-${index}`;

                      const headerText = getHeaderText(header.column.columnDef);

                      return (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800"
                          style={{
                            minWidth:
                              header.column.columnDef.meta?.minWidth || 120,
                            width: header.column.columnDef.meta?.width,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleColumnVisibility(columnKey)}
                              className="cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              title={`Hide ${headerText} column`}
                            >
                              <EyeOff className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnsData.length || 1}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Loading completed tasks...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="even:bg-gray-50 dark:even:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-3 text-sm text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800"
                          style={{
                            minWidth:
                              cell.column.columnDef.meta?.minWidth || 120,
                            width: cell.column.columnDef.meta?.width,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={visibleColumnsData.length || 1}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No completed tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🚀 Pagination Controls Footer */}
          <div className="px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {totalTasks === 0 ? 0 : (page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {Math.min(page * limit, totalTasks)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {totalTasks}
              </span>{" "}
              tasks
            </div>

            <div className="flex items-center gap-4">
              {/* Items Per Page Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Rows per page:
                </span>
                <select
                  value={limit}
                  onChange={(e) =>
                    onPageChange({ page: 1, limit: Number(e.target.value) })
                  }
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => onPageChange({ page: page - 1, limit })}
                  className="p-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Page {page} of {totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => onPageChange({ page: page + 1, limit })}
                  className="p-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistModal({ open, onOpenChange, checklist }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Checklist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {checklist && checklist.length > 0 ? (
            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <Checkbox checked={item.checked} disabled className="mt-1" />
                  <label
                    className={`flex-1 text-sm ${
                      item.checked ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.item}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No checklist items available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentModal({ open, onOpenChange, documents }) {
  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/documents/upload/task/download/${encodeURIComponent(doc.path)}`,
        {
          responseType: "blob",
          withCredentials: true,
          headers: {
            Accept: "application/octet-stream",
          },
        },
      );
      if (!(response.data instanceof Blob)) {
        throw new Error("Invalid response format");
      }
      const contentDisposition = response.headers["content-disposition"];
      let filename = doc.originalName;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error downloading document",
      );
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {documents && documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{doc.originalName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(doc)}
                  className="hover:bg-gray-100 p-2"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No documents uploaded yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsModal({ open, onOpenChange, taskId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open && taskId) {
      fetchComments();
    }
    // eslint-disable-next-line
  }, [open, taskId]);
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/${taskId}/comments`,
        { withCredentials: true },
      );
      setComments(response.data.comments);
    } catch (error) {
      toast.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex flex-col space-y-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{comment.employeeId.name}</span>
                    <span>•</span>
                    <span>
                      {format(
                        new Date(comment.createdAt),
                        "MMM d, yyyy h:mm a",
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No comments yet.
            </div>
          )}
        </ScrollArea>
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
          { withCredentials: true },
        )
        .then((res) => {
          setEscalation(res.data.data);
        })
        .catch(() => {
          setError("Failed to fetch escalation");
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
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Escalation History</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : escalation ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {sortedChain.map((entry, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>
                    Raised By: {entry.raisedBy?.name || "Unknown"} (
                    {entry.raisedBy?.email || "-"})
                  </span>
                  <span>→</span>
                  <span>
                    To: {entry.raisedTo?.name || "Unknown"} (
                    {entry.raisedTo?.email || "-"})
                  </span>
                  <span>•</span>
                  <span>
                    {entry.timestamp
                      ? format(new Date(entry.timestamp), "PPP p")
                      : ""}
                  </span>
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-line">
                  {entry.comment}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No escalation data found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CompletedTasks() {
  const location = useLocation();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workshopTypes, setWorkshopTypes] = useState([]);
  const [documentModal, setDocumentModal] = useState({
    open: false,
    taskId: null,
    documents: [],
  });
  const [checklistModal, setChecklistModal] = useState({
    open: false,
    checklist: [],
  });
  const [commentsModal, setCommentsModal] = useState({
    open: false,
    taskId: null,
  });
  const [viewEscalationModal, setViewEscalationModal] = useState({
    open: false,
    taskId: null,
  });
  const userRole = JSON.parse(localStorage.getItem("role"));

  // State to control column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    workshopName: true,
    taskId: true,
    narration: false,
    // Role-based columns
    ...(userRole === "PC" ? { doer: true } : {}),
    ...(userRole === "EA" ? { pc: true, doer: true } : {}),
    ...(userRole === "MD" ? { ea: true, pc: true, doer: true } : {}),
    checklist: true,
    document: true,
    comments: true,
    endDate: true,
    daysDelayed: true,
    escalation: true,
    naRemark: true,
  });

  // State to control filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Function to toggle column visibility
  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Filter state
  const [filters, setFilters] = useState(() => ({
    workshop: "all",
    endDate: [null, null],
    critical: "all",
    documents: "all",
    escalation: "all",
    department: "all",
    comments: "all",
    naRemark: "all",
    ...(location.state?.filters || {}),
  }));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [doers, setDoers] = useState([]);
  const [pcs, setPcs] = useState([]);
  const [eas, setEas] = useState([]);
  const getUnique = (arr, fn) =>
    Array.from(new Set(arr.map(fn).filter(Boolean)));
  useEffect(() => {
    if (["PC", "EA", "MD"].includes(userRole)) {
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL}/setup/employees/doers`, {
          withCredentials: true,
        })
        .then((res) => {
          setDoers(res.data.doers || []);
          setPcs(res.data.pcs || []);
          setEas(res.data.eas || []);
        })
        .catch((err) =>
          console.error("Error fetching dropdown employees:", err),
        );
    }
  }, [userRole]);
  useEffect(() => {
    // Fetch all departments for filter dropdown
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/setup/departments/all`, {
        withCredentials: true,
      })
      .then((res) => {
        setDepartmentsList(res.data.departments || []);
      })
      .catch((err) => {
        console.error("Error fetching departments list:", err);
      });
  }, []);
  // Compute filtered completed tasks
  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter((task) => {
      if (
        filters.workshop !== "all" &&
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
        filters.critical !== "all" &&
        filters.critical === "Critical" &&
        !task.isCritical
      )
        return false;
      if (
        filters.critical !== "all" &&
        filters.critical === "Non-critical" &&
        task.isCritical
      )
        return false;
      if (
        filters.documents !== "all" &&
        filters.documents === "Yes" &&
        (!task.documents || task.documents.length === 0)
      )
        return false;
      if (
        filters.documents !== "all" &&
        filters.documents === "No" &&
        task.documents &&
        task.documents.length > 0
      )
        return false;
      if (
        filters.escalation !== "all" &&
        filters.escalation === "Yes" &&
        !task.escalationId
      )
        return false;
      if (
        filters.escalation !== "all" &&
        filters.escalation === "No" &&
        task.escalationId
      )
        return false;
      if (
        filters.department !== "all" &&
        task.department !== filters.department
      )
        return false;
      if (filters.comments !== "all") {
        if (filters.comments === "Yes" && !task.comments) return false;
        if (filters.comments === "No" && task.comments) return false;
      }
      if (
        filters.doer &&
        filters.doer !== "all" &&
        task.doer?.name !== filters.doer
      )
        return false;
      if (filters.pc && filters.pc !== "all" && task.pc?.name !== filters.pc)
        return false;
      if (filters.ea && filters.ea !== "all" && task.ea?.name !== filters.ea)
        return false;
      if (filters.naRemark !== "all") {
        const hasNARemark = task.NARemark && task.NARemark.trim();
        if (filters.naRemark === "Yes" && !hasNARemark) return false;
        if (filters.naRemark === "No" && hasNARemark) return false;
      }
      return true;
    });
  }, [completedTasks, filters]);

  // Compute dynamic filter options from filtered data
  const availableWorkshops = getUnique(
    filteredCompletedTasks.length ? filteredCompletedTasks : completedTasks,
    (t) => t.workshop?.workshopId,
  );
  const availableCritical = ["Critical", "Non-critical"];
  const availableDocuments = ["Yes", "No"];
  const availableEscalation = ["Yes", "No"];

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
  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filter bar UI
  const FilterBar = (
    <div className="flex flex-wrap gap-4 mb-4 items-end">
      {/* Workshop Name */}
      <div>
        <label className="block text-xs font-medium mb-1">Workshop ID</label>
        <Select
          value={filters.workshop}
          onValueChange={(val) => updateFilter("workshop", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
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
        <label className="block text-xs font-medium mb-1">Planned Date</label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[220px] max-w-[380px] justify-start text-left"
            >
              {filters.endDate[0] && filters.endDate[1]
                ? `${format(filters.endDate[0], "PPP")} - ${format(
                    filters.endDate[1],
                    "PPP",
                  )}`
                : "Select range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <div className="flex gap-2 p-2 border-b">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateFilter("endDate", [today, today])}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateFilter("endDate", [startOfWeek, endOfWeek])
                }
              >
                This Week
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateFilter("endDate", [startOfNextWeek, endOfNextWeek])
                }
              >
                Next Week
              </Button>
            </div>
            <Calendar
              mode="range"
              selected={{ from: filters.endDate[0], to: filters.endDate[1] }}
              onSelect={(range) =>
                updateFilter("endDate", [
                  range?.from || null,
                  range?.to || null,
                ])
              }
              initialFocus
            />
            <div className="flex justify-end p-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateFilter("endDate", [null, null])}
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Critical */}
      {(userRole === "PC" || userRole === "EA" || userRole === "MD") && (
        <div>
          <label className="block text-xs font-medium mb-1">Critical</label>
          <Select
            value={filters.critical}
            onValueChange={(val) => updateFilter("critical", val)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
        <label className="block text-xs font-medium mb-1">
          Documents Uploaded
        </label>
        <Select
          value={filters.documents}
          onValueChange={(val) => updateFilter("documents", val)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
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
        <label className="block text-xs font-medium mb-1">Escalation</label>
        <Select
          value={filters.escalation}
          onValueChange={(val) => updateFilter("escalation", val)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {availableEscalation.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department Filter */}
      <div>
        <label className="block text-xs font-medium mb-1">Department</label>
        <Select
          value={filters.department}
          onValueChange={(val) => updateFilter("department", val)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {departmentsList.map((dep) => (
              <SelectItem key={dep._id} value={dep._id}>
                {dep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comments */}
      <div>
        <label className="block text-xs font-medium mb-1">Comments</label>
        <Select
          value={filters.comments}
          onValueChange={(val) => updateFilter("comments", val)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NA Remark */}
      <div>
        <label className="block text-xs font-medium mb-1">NA Remark</label>
        <Select
          value={filters.naRemark}
          onValueChange={(val) => updateFilter("naRemark", val)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Doer */}
      {(userRole === "PC" || userRole === "EA" || userRole === "MD") && (
        <div>
          <label className="block text-xs font-medium mb-1">Doer</label>
          <Select
            value={filters.doer}
            onValueChange={(val) => updateFilter("doer", val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {doers.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Process Coordinator */}
      {(userRole === "EA" || userRole === "MD") && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Process Coordinator
          </label>
          <Select
            value={filters.pc}
            onValueChange={(val) => updateFilter("pc", val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {pcs.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Executive Assistant */}
      {userRole === "MD" && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Executive Assistant
          </label>
          <Select
            value={filters.ea}
            onValueChange={(val) => updateFilter("ea", val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {eas.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  // Helper function to get workshop type name from ID
  const getWorkshopTypeName = (taskId) => {
    if (!taskId || !workshopTypes || workshopTypes.length === 0) return "-";
    const abbreviation = taskId.split("-")[0];
    const foundType = workshopTypes.find(
      (type) => type.abbreviation === abbreviation,
    );
    return foundType ? foundType.name : abbreviation;
  };
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalTasks, setTotalTasks] = useState(0);
  // 🚀 2. API Fetch Function with Query Parameters
  const fetchCompletedTasks = () => {
    setLoading(true);

    const params = {
      page,
      limit,
      workshop: filters.workshop !== "all" ? filters.workshop : undefined,
      doer: filters.doer !== "all" ? filters.doer : undefined,
      department: filters.department !== "all" ? filters.department : undefined,
      pc: filters.pc !== "all" ? filters.pc : undefined,
      ea: filters.ea !== "all" ? filters.ea : undefined,
      critical: filters.critical !== "all" ? filters.critical : undefined,
      documents: filters.documents !== "all" ? filters.documents : undefined,
      escalation: filters.escalation !== "all" ? filters.escalation : undefined,
      comments: filters.comments !== "all" ? filters.comments : undefined,
      naRemark: filters.naRemark !== "all" ? filters.naRemark : undefined,
      startDate: filters.endDate[0]
        ? format(filters.endDate[0], "yyyy-MM-dd")
        : undefined,
      endDate: filters.endDate[1]
        ? format(filters.endDate[1], "yyyy-MM-dd")
        : undefined,
    };

    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/tasks/completed`, {
        params,
        withCredentials: true,
      })
      .then((res) => {
        setCompletedTasks(res.data.completedTasks || []);
        if (res.data.pagination) {
          setTotalTasks(res.data.pagination.totalTasks || 0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setLoading(false);
      });
  };

  // Auto Refetch when filters or pagination change
  useEffect(() => {
    fetchCompletedTasks();
  }, [page, limit, filters]);
  useEffect(() => {
    setLoading(true);
    // Fetch workshop types
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/setup/templates/types`, {
        withCredentials: true,
      })
      .then((res) => {
        setWorkshopTypes(res.data.workshopTypes || []);
      })
      .catch((err) => {
        console.error("Error fetching workshop types:", err);
      });
    // Fetch completed tasks
    // axios
    //   .get(`${import.meta.env.VITE_API_BASE_URL}/tasks/completed`, {
    //     withCredentials: true,
    //   })
    //   .then((res) => {
    //     setCompletedTasks(res.data.completedTasks || []);
    //     setLoading(false);
    //   })
    //   .catch(() => {
    //     setError("Failed to fetch completed tasks");
    //     setLoading(false);
    //   });
  }, []);
  // If navigation state changes (e.g. user comes from Dashboard), update filters
  useEffect(() => {
    if (location.state && location.state.filters) {
      setFilters((f) => ({ ...f, ...location.state.filters }));
    }
    // eslint-disable-next-line
  }, [location.state]);

  const handleOpenDocumentModal = async (taskId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/documents/upload/task/${taskId}`,
        { withCredentials: true },
      );
      setDocumentModal({
        open: true,
        taskId,
        documents: response.data || [],
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
        toast.error("Error fetching documents");
      }
    }
  };

  const columns = [
    {
      header: "Workshop Name",
      accessorKey: "workshopName",
      cell: (info) => getWorkshopTypeName(info.row.original.taskId) || "-",
      meta: { minWidth: 250, width: 250 },
    },
    {
      header: "Task ID",
      accessorKey: "taskId",
      cell: (info) => info.getValue() || "-",
      meta: { minWidth: 200, width: 200 },
    },
    {
      header: "Task Narration",
      accessorKey: "narration",
      cell: (info) => info.getValue() || "-",
      meta: { minWidth: 500, width: 500 },
    },
    // Role-based columns
    ...(userRole === "PC"
      ? [
          {
            header: "Doer",
            accessorKey: "doer",
            cell: (info) => info.row.original.doer?.name || "-",
            meta: { minWidth: 200, width: 200 },
          },
        ]
      : []),
    ...(userRole === "EA"
      ? [
          {
            header: "Process Coordinator",
            accessorKey: "pc",
            cell: (info) => info.row.original.pc?.name || "-",
            meta: { minWidth: 200, width: 200 },
          },
          {
            header: "Doer",
            accessorKey: "doer",
            cell: (info) => info.row.original.doer?.name || "-",
            meta: { minWidth: 200, width: 200 },
          },
        ]
      : []),
    ...(userRole === "MD"
      ? [
          {
            header: "Executive Assistant",
            accessorKey: "ea",
            cell: (info) => info.row.original.ea?.name || "-",
            meta: { minWidth: 200, width: 200 },
          },
          {
            header: "Process Coordinator",
            accessorKey: "pc",
            cell: (info) => info.row.original.pc?.name || "-",
            meta: { minWidth: 200, width: 200 },
          },
          {
            header: "Doer",
            accessorKey: "doer",
            cell: (info) => info.row.original.doer?.name || "-",
            meta: { minWidth: 200, width: 200 },
          },
        ]
      : []),
    {
      header: () => <div className="text-center">Checklist</div>,
      headerText: "Checklist",
      accessorKey: "checklist",
      cell: (info) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setChecklistModal({
                open: true,
                checklist: info.row.original.checklist || [],
              })
            }
            className="hover:bg-gray-100 p-2"
            title="View Checklist"
          >
            <ClipboardList className="w-4 h-4" />
          </Button>
        </div>
      ),
      meta: { minWidth: 140, width: 140 },
    },
    {
      header: () => <div className="text-center">Document</div>,
      headerText: "Document",
      accessorKey: "document",
      cell: (info) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDocumentModal(info.row.original._id)}
            className="hover:bg-gray-100"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      ),
      meta: { minWidth: 150, width: 150 },
    },
    {
      header: () => <div className="text-center">Comments</div>,
      headerText: "Comments",
      accessorKey: "comments",
      cell: (info) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCommentsModal({ open: true, taskId: info.row.original._id })
            }
            className="hover:bg-gray-100 p-2"
            title="View Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      ),
      meta: { minWidth: 150, width: 150 },
    },
    {
      header: "End Date",
      accessorKey: "endDate",
      cell: (info) => {
        const date = info.row.original.endDate;
        return date ? format(new Date(date), "PPP") : "-";
      },
      meta: { minWidth: 180, width: 180 },
    },
    {
      header: "Days Delayed",
      accessorKey: "daysDelayed",
      cell: (info) => {
        const end = info.row.original.endDate;
        const completed = info.row.original.completedOn;
        if (!end || !completed) return "-";
        const endDate = new Date(end);
        const completedDate = new Date(completed);
        const diff = Math.max(
          0,
          differenceInCalendarDays(completedDate, endDate),
        );
        return diff;
      },
      meta: { minWidth: 200, width: 200 },
    },
    {
      header: () => <div className="text-center">Escalation</div>,
      headerText: "Escalation",
      accessorKey: "escalation",
      cell: (info) => {
        const task = info.row.original;
        return (
          <div className="flex justify-center">
            {task.escalationId ? (
              <AlertTriangle
                className="w-5 h-5 text-yellow-500 cursor-pointer"
                title="View Escalation"
                onClick={() =>
                  setViewEscalationModal({ open: true, taskId: task._id })
                }
              />
            ) : (
              "-"
            )}
          </div>
        );
      },
      meta: { minWidth: 180, width: 180 },
    },
    {
      header: "NA Remark",
      accessorKey: "naRemark",
      cell: (info) => {
        const naRemark = info.row.original.NARemark;
        return (
          <div className="break-words whitespace-normal">
            {naRemark && naRemark.trim() ? (
              <span className="text-sm text-gray-800">{naRemark}</span>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        );
      },
      meta: { minWidth: 250, width: 250 },
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50">
      <div className="p-8 flex-none">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Completed Tasks
          </h1>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition shadow-sm"
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            {showFilters ? (
              <>
                <X className="h-4 w-4" />
                Hide Filters
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                Show Filters
              </>
            )}
          </button>
        </div>

        {showFilters && FilterBar}
      </div>

      <div className="px-8 flex-grow overflow-hidden flex flex-col">
        <div className="rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 h-full flex flex-col">
          <div className="p-6 flex-grow overflow-hidden">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-center py-10">{error}</div>
            ) : (
              <div className="h-full">
                <TasksTable
                  columns={columns}
                  data={completedTasks}
                  visibleColumns={visibleColumns}
                  toggleColumnVisibility={toggleColumnVisibility}
                  loading={loading}
                  pagination={{
                    page,
                    limit,
                    totalTasks,
                    totalPages: Math.ceil(totalTasks / limit),
                  }}
                  onPageChange={({ page: newPage, limit: newLimit }) => {
                    setPage(newPage);
                    setLimit(newLimit);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <ChecklistModal
        open={checklistModal.open}
        onOpenChange={(open) =>
          setChecklistModal((prev) => ({ ...prev, open }))
        }
        checklist={checklistModal.checklist}
      />
      <DocumentModal
        open={documentModal.open}
        onOpenChange={(open) => setDocumentModal((prev) => ({ ...prev, open }))}
        documents={documentModal.documents}
      />
      <CommentsModal
        open={commentsModal.open}
        onOpenChange={(open) => setCommentsModal((prev) => ({ ...prev, open }))}
        taskId={commentsModal.taskId}
      />
      <ViewEscalationModal
        open={viewEscalationModal.open}
        onOpenChange={(open) =>
          setViewEscalationModal((prev) => ({ ...prev, open }))
        }
        taskId={viewEscalationModal.taskId}
      />
    </div>
  );
}
