import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Filter, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

// Custom date formatting function
const formatDate = (date) => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(date).toLocaleDateString('en-US', options);
};

// Timezone-safe date to YYYY-MM-DD format
const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FMSPerformanceReport = () => {
  // Permission check
  const role = JSON.parse(localStorage.getItem('role') || '');
  const allowedRoles = ['EA', 'PC', 'MD', 'Doer'];
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doers, setDoers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filters state
  const [selectedDoer, setSelectedDoer] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    // Custom current week calculation (Monday to Sunday) using UTC
    const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - daysToMonday);
    
    console.log('Initial state:', {
      today: today.toISOString(),
      dayOfWeek,
      daysToMonday,
      monday: monday.toISOString(),
      mondayDay: monday.getUTCDay() // Should be 1 (Monday)
    });
    
    return monday;
  });
  const [weekNumberInput, setWeekNumberInput] = useState('');
  const [weekNumberTimeout, setWeekNumberTimeout] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get current week dates
  const getCurrentWeek = () => {
    // Always calculate Monday to Sunday week based on currentWeekStart
    const currentDate = new Date(currentWeekStart);
    
    // Find the Monday of the week containing currentWeekStart
    const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(currentDate);
    monday.setUTCDate(currentDate.getUTCDate() - daysToMonday);
    
    // Sunday is 6 days after Monday
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    
    // Verify the calculation is correct
    if (monday.getUTCDay() !== 1 || sunday.getUTCDay() !== 0) {
      console.error('Week calculation error:', {
        currentDate: currentDate.toISOString(),
        dayOfWeek,
        daysToMonday,
        monday: monday.toISOString(),
        mondayDay: monday.getUTCDay(),
        sunday: sunday.toISOString(),
        sundayDay: sunday.getUTCDay()
      });
    }
    
    return {
      startDate: formatDateToYYYYMMDD(monday),
      endDate: formatDateToYYYYMMDD(sunday)
    };
  };

  // Week navigation functions
  const goToPreviousWeek = () => {
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prevWeekStart);
  };

  const goToNextWeek = () => {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(nextWeekStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    // Custom current week calculation (Monday to Sunday) using UTC
    const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - daysToMonday);
    
    setCurrentWeekStart(monday);
  };

  // Get current week number
  const getCurrentWeekNumber = () => {
    const currentYear = new Date().getFullYear();
    
    // Find the first Monday of the year using UTC to avoid timezone issues
    const firstDayOfYear = new Date(Date.UTC(currentYear, 0, 1));
    let firstMondayOfYear = new Date(firstDayOfYear);
    while (firstMondayOfYear.getUTCDay() !== 1) { // 1 = Monday
      firstMondayOfYear.setUTCDate(firstMondayOfYear.getUTCDate() + 1);
    }
    
    // Get the Monday of the current week from currentWeekStart
    const currentDate = new Date(currentWeekStart);
    const dayOfWeek = currentDate.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayOfCurrentWeek = new Date(currentDate);
    mondayOfCurrentWeek.setUTCDate(currentDate.getUTCDate() - daysToMonday);
    
    // Calculate week number
    const diffTime = mondayOfCurrentWeek.getTime() - firstMondayOfYear.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    console.log('getCurrentWeekNumber:', {
      currentYear,
      firstDayOfYear: firstDayOfYear.toISOString(),
      firstMondayOfYear: firstMondayOfYear.toISOString(),
      currentWeekStart: currentWeekStart.toISOString(),
      mondayOfCurrentWeek: mondayOfCurrentWeek.toISOString(),
      diffWeeks,
      weekNumber: diffWeeks + 1
    });
    
    return diffWeeks + 1;
  };

  // Go to specific week number
  const goToWeekNumber = (weekNumber) => {
    if (weekNumber && !isNaN(weekNumber) && weekNumber > 0 && weekNumber <= 53) {
      const currentYear = new Date().getFullYear();
      
      // Find the first Monday of the year using UTC to avoid timezone issues
      const firstDayOfYear = new Date(Date.UTC(currentYear, 0, 1));
      let firstMondayOfYear = new Date(firstDayOfYear);
      while (firstMondayOfYear.getUTCDay() !== 1) { // 1 = Monday
        firstMondayOfYear.setUTCDate(firstMondayOfYear.getUTCDate() + 1);
      }
      
      // Calculate the target Monday for the specified week
      const targetMonday = new Date(firstMondayOfYear);
      targetMonday.setUTCDate(firstMondayOfYear.getUTCDate() + (weekNumber - 1) * 7);
      
      console.log('goToWeekNumber:', {
        weekNumber,
        firstMondayOfYear: firstMondayOfYear.toISOString(),
        targetMonday: targetMonday.toISOString(),
        targetMondayDay: targetMonday.getUTCDay() // Should be 1 (Monday)
      });
      
      setCurrentWeekStart(targetMonday);
    }
  };

  // Fetch doers and departments
  const fetchSetupData = async () => {
    try {
      if (role === 'Doer') {
        // For Doer role, only fetch their own departments
        const currentUserResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/setup/employees/currentDetails`,
          { withCredentials: true }
        );
        
        const currentUser = currentUserResponse.data.employee;
        setDoers([]); // No doer filter for Doer role
        
        // Set departments to only the user's departments
        if (currentUser.departments && Array.isArray(currentUser.departments)) {
          setDepartments(currentUser.departments);
        } else {
          setDepartments([]);
        }
      } else {
        // For other roles, fetch all doers and their departments
        const doersResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/setup/employees/by-role/Doer`,
          { withCredentials: true }
        );
        
        // The response already contains doers with their department details
        const doerEmployees = doersResponse.data.employees || [];
        setDoers(doerEmployees);

        // Extract unique departments from doers
        const departmentSet = new Set();
        doerEmployees.forEach(doer => {
          if (doer.departments && Array.isArray(doer.departments)) {
            doer.departments.forEach(dept => {
              departmentSet.add(JSON.stringify({ _id: dept._id, name: dept.name }));
            });
          }
        });
        
        const uniqueDepartments = Array.from(departmentSet).map(deptStr => JSON.parse(deptStr));
        setDepartments(uniqueDepartments);
      }
    } catch (error) {
      console.error('Error fetching setup data:', error);
    }
  };

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const requestBody = {
        dateFilter: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      };

      // Add doer filter if selected (and not "all") - only for non-Doer roles
      if (role !== 'Doer' && selectedDoer && selectedDoer !== 'all') {
        requestBody.doerFilter = { doerId: selectedDoer };
      }

      // Add department filter if selected (and not "all")
      if (selectedDepartment && selectedDepartment !== 'all') {
        requestBody.departmentFilter = { departmentId: selectedDepartment };
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/reports/fms-performance`,
        requestBody,
        { withCredentials: true }
      );

      setReportData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
      alert('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentage
  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    const percentage = (value / total) * 100;
    return Math.round(percentage);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    fetchReportData();
  };



  // Reset filters
  const resetFilters = () => {
    if (role !== 'Doer') {
      setSelectedDoer('all');
    }
    setSelectedDepartment('all');
    goToCurrentWeek();
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Department', 'Total Tasks', 'WDOT', 'WND', 'WNDOT', 'WDOT %', 'WND %', 'WNDOT %'];
    
    const csvData = reportData.map(item => {
      const deptNames = item.departments.map(dept => dept.name).join(', ');
      return [
        item.name,
        deptNames,
        item.totalTasks,
        item.WDOT,
        item.WND,
        item.WNDOT,
        `${calculatePercentage(item.WDOT, item.totalTasks)}%`,
        `${calculatePercentage(item.WND, item.totalTasks)}%`,
        `${calculatePercentage(item.WNDOT, item.totalTasks)}%`
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fms-performance-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchSetupData();
    const currentWeek = getCurrentWeek();
    setDateRange(currentWeek);
    setWeekNumberInput(getCurrentWeekNumber().toString());
    // Fetch initial data with current week
    if (currentWeek.startDate && currentWeek.endDate) {
      fetchReportData();
    }
  }, []);



  // Update date range when current week changes
  useEffect(() => {
    const currentWeek = getCurrentWeek();
    console.log('Week changed:', {
      currentWeekStart: currentWeekStart.toISOString(),
      calculatedWeek: currentWeek,
      startDay: new Date(currentWeek.startDate).getDay(), // Should be 1 (Monday)
      endDay: new Date(currentWeek.endDate).getDay()      // Should be 0 (Sunday)
    });
    setDateRange(currentWeek);
    setWeekNumberInput(getCurrentWeekNumber().toString());
  }, [currentWeekStart]);



  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (weekNumberTimeout) {
        clearTimeout(weekNumberTimeout);
      }
    };
  }, [weekNumberTimeout]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FMS Performance Report</h1>
          <p className="text-gray-600 mt-2">Track task performance metrics for doers</p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button onClick={exportToCSV} disabled={loading || reportData.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${role === 'Doer' ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}>
            {/* Doer Filter - Only show for non-Doer roles */}
            {role !== 'Doer' && (
              <div className="space-y-2">
                <Label htmlFor="doer">Doer</Label>
                <Select value={selectedDoer} onValueChange={setSelectedDoer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Doers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doers</SelectItem>
                    {doers.map((doer) => (
                      <SelectItem key={doer._id} value={doer._id}>
                        {doer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department Filter */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range with Week Navigation */}
            <div className="space-y-2 md:col-span-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  className="px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal cursor-pointer"
                    >
                      {dateRange.startDate && dateRange.endDate
                        ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
                        : 'Select date range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <div className="flex gap-2 p-2 border-b">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const today = new Date();
                          setDateRange({
                            startDate: formatDateToYYYYMMDD(today),
                            endDate: formatDateToYYYYMMDD(today)
                          });
                          setDatePickerOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          goToCurrentWeek();
                          setDatePickerOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        This Week
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Custom next week calculation (Monday to Sunday)
                          const currentDate = new Date(currentWeekStart);
                          const nextWeekStart = new Date(currentDate);
                          nextWeekStart.setDate(currentDate.getDate() + 7);
                          
                          // Calculate next week's Monday and Sunday
                          const dayOfWeek = nextWeekStart.getDay();
                          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                          const nextMonday = new Date(nextWeekStart);
                          nextMonday.setDate(nextWeekStart.getDate() - daysToMonday);
                          
                          const nextSunday = new Date(nextMonday);
                          nextSunday.setDate(nextMonday.getDate() + 6);
                          
                          setDateRange({
                            startDate: formatDateToYYYYMMDD(nextMonday),
                            endDate: formatDateToYYYYMMDD(nextSunday)
                          });
                          setDatePickerOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        Next Week
                      </Button>
                    </div>
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
                        to: dateRange.endDate ? new Date(dateRange.endDate) : undefined
                      }}
                      onSelect={(range) => {
                        setDateRange({
                          startDate: range?.from ? formatDateToYYYYMMDD(range.from) : '',
                          endDate: range?.to ? formatDateToYYYYMMDD(range.to) : ''
                        });
                        // Don't close the calendar when selecting dates
                      }}
                      initialFocus
                    />
                    <div className="flex justify-end p-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDateRange({ startDate: '', endDate: '' });
                          // Don't close the calendar when clearing dates
                        }}
                        className="cursor-pointer"
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextWeek}
                  className="px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Week Number Input */}
            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  id="weekNumber"
                  placeholder="Week #"
                  value={weekNumberInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers 1-53
                    if (value === '' || /^[1-9][0-9]?$|^5[0-3]$/.test(value)) {
                      setWeekNumberInput(value);
                      
                      // Clear any existing timeout
                      if (weekNumberTimeout) {
                        clearTimeout(weekNumberTimeout);
                      }
                      
                      // Set a timeout to update the calendar display after user stops typing
                      const timeout = setTimeout(() => {
                        const weekNum = parseInt(value);
                        if (weekNum && weekNum >= 1 && weekNum <= 53) {
                          goToWeekNumber(weekNum);
                        }
                      }, 500); // 500ms delay
                      
                      setWeekNumberTimeout(timeout);
                    }
                  }}
                  onBlur={() => {
                    // Clear timeout on blur
                    if (weekNumberTimeout) {
                      clearTimeout(weekNumberTimeout);
                    }
                    
                    // Only reset if input is empty or invalid
                    const weekNum = parseInt(weekNumberInput);
                    if (!weekNumberInput || weekNum < 1 || weekNum > 53) {
                      setWeekNumberInput(getCurrentWeekNumber().toString());
                    }
                  }}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">of {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilterChange} disabled={loading}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No data found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Total Tasks</TableHead>
                    <TableHead className="text-center">WDOT</TableHead>
                    <TableHead className="text-center">WND</TableHead>
                    <TableHead className="text-center">WNDOT</TableHead>
                    <TableHead className="text-center">WDOT %</TableHead>
                    <TableHead className="text-center">WND %</TableHead>
                    <TableHead className="text-center">WNDOT %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.departments.map((dept, idx) => (
                          <Badge key={idx} variant="secondary" className="mr-1">
                            {dept.name}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.totalTasks}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:no-underline cursor-default">
                          {item.WDOT}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 hover:no-underline cursor-default">
                          {item.WND}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:no-underline cursor-default">
                          {item.WNDOT}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {calculatePercentage(item.WDOT, item.totalTasks)}%
                      </TableCell>
                      <TableCell className="text-center font-medium text-red-600">
                        {calculatePercentage(item.WND, item.totalTasks)}%
                      </TableCell>
                      <TableCell className="text-center font-medium text-yellow-600">
                        {calculatePercentage(item.WNDOT, item.totalTasks)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FMSPerformanceReport; 