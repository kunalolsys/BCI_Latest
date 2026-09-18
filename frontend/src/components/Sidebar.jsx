import React, { useState, useRef } from 'react';
import {
  BarChart,
  Bell,
  CheckSquare,
  ChevronRight,
  LogOut,
  Database,
  Settings,
  Wrench,
  Menu,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Sidebar({ children, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Submenu open state
  const [setupOpen, setSetupOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  // Submenu flyout top positions
  const [setupFlyoutTop, setSetupFlyoutTop] = useState(0);
  const [masterFlyoutTop, setMasterFlyoutTop] = useState(0);
  const [workshopFlyoutTop, setWorkshopFlyoutTop] = useState(0);
  const [tasksFlyoutTop, setTasksFlyoutTop] = useState(0);
  const [reportsFlyoutTop, setReportsFlyoutTop] = useState(0);

  // Button refs
  const setupBtnRef = useRef(null);
  const masterBtnRef = useRef(null);
  const workshopBtnRef = useRef(null);
  const tasksBtnRef = useRef(null);
  const reportsBtnRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const role = JSON.parse(localStorage.getItem('role') || '');

  const hasWorkshopPermissions = permissions.some((perm) =>
    ['Workshop Template', 'Plan & Launch', 'Workshop History'].includes(perm)
  );
  const hasTemplatePermission = permissions.includes('Workshop Template');
  const hasPlanLaunchPermission = permissions.includes('Plan & Launch');
  const hasHistoryPermission = permissions.includes('Workshop History');
  const hasTaskPermissions = permissions.some((perm) =>
    ['Doer', 'EA', 'PC'].includes(perm)
  );
  const hasTaskRole = ['EA', 'PC', 'Doer'].includes(role);
  const hasMasterPermissions = permissions.some((perm) =>
    ['Admin', 'Setup'].includes(perm)
  );
  const allowedDashboardRoles = ['Doer', 'EA', 'PC', 'MD'];
  const allowedTasksRoles = ['Doer', 'EA', 'PC', 'MD'];


  // DELEGATE LOGIN
  const handleDelegateLogin = async () => {
    try {
      const b64email = btoa(user.email);
      window.open(`https://delegate.businesscoachingindia.com/dothis-login/${b64email}`, "_blank")
      // console.log(b64email);
      
    } catch (err) {
      alert('Delegate login failed');
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      if (window.socket && typeof window.socket.disconnect === 'function') {
        window.socket.disconnect();
        window.socket = null;
      }
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    } catch (err) {
      alert('Logout failed');
    }
  };

  // SWITCH USER
  const handleSwitchRole = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const isSecondaryLoggedIn = localStorage.getItem('isSecondaryLoggedIn');
    const permissions = localStorage.getItem('permissions');
    const secondaryPermissions = localStorage.getItem('secondaryPermissions');
    const role = localStorage.getItem('role');
    const secondaryRole = localStorage.getItem('secondaryRole');
    const userId = localStorage.getItem('userId');
    const secondaryUserId = localStorage.getItem('secondaryUserId');

    localStorage.setItem('isLoggedIn', isSecondaryLoggedIn);
    localStorage.setItem('isSecondaryLoggedIn', isLoggedIn);
    localStorage.setItem('permissions', secondaryPermissions);
    localStorage.setItem('secondaryPermissions', permissions);
    localStorage.setItem('role', secondaryRole);
    localStorage.setItem('secondaryRole', role);
    localStorage.setItem('userId', secondaryUserId);
    localStorage.setItem('secondaryUserId', userId);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/switch-user`,
        {},
        { withCredentials: true }
      );
      window.location.reload();
    } catch (err) {
      alert('Failed to switch user');
    }
  };

  // Helper for dynamic flyout
  const flyoutStyle = (top) => ({
    position: 'fixed',
    left: 80, // w-20 = 80px
    top: top,
    width: 224, // w-56 = 224px
    zIndex: 50,
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0',
  });

  // Mouse enter/leave handlers for each submenu
  const handleSetupMouseEnter = () => {
    if (collapsed && setupBtnRef.current) {
      setSetupOpen(true);
      setSetupFlyoutTop(setupBtnRef.current.getBoundingClientRect().top);
    }
  };
  const handleSetupMouseLeave = () => {
    if (collapsed) setSetupOpen(false);
  };

  const handleMasterMouseEnter = () => {
    if (collapsed && masterBtnRef.current) {
      setMasterOpen(true);
      setMasterFlyoutTop(masterBtnRef.current.getBoundingClientRect().top);
    }
  };
  const handleMasterMouseLeave = () => {
    if (collapsed) setMasterOpen(false);
  };

  const handleWorkshopMouseEnter = () => {
    if (collapsed && workshopBtnRef.current) {
      setWorkshopOpen(true);
      setWorkshopFlyoutTop(workshopBtnRef.current.getBoundingClientRect().top);
    }
  };
  const handleWorkshopMouseLeave = () => {
    if (collapsed) setWorkshopOpen(false);
  };

  const handleTasksMouseEnter = () => {
    if (collapsed && tasksBtnRef.current) {
      setTasksOpen(true);
      setTasksFlyoutTop(tasksBtnRef.current.getBoundingClientRect().top);
    }
  };
  const handleTasksMouseLeave = () => {
    if (collapsed) setTasksOpen(false);
  };

  const handleReportsMouseEnter = () => {
    if (collapsed && reportsBtnRef.current) {
      setReportsOpen(true);
      setReportsFlyoutTop(reportsBtnRef.current.getBoundingClientRect().top);
    }
  };
  const handleReportsMouseLeave = () => {
    if (collapsed) setReportsOpen(false);
  };

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Hamburger for mobile */}
      <button
        className='fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow lg:hidden'
        onClick={() => setSidebarOpen(true)}
        aria-label='Open sidebar'
      >
        <Menu className='w-6 h-6 text-gray-700' />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/30 lg:hidden'
          onClick={() => setSidebarOpen(false)}
          aria-label='Close sidebar'
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-white to-gray-100 border-r border-gray-200 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-20' : 'w-64'}
          lg:translate-x-0 lg:static lg:h-screen
          flex flex-col flex-shrink-0
          overflow-x-hidden
        `}
        onClick={() => collapsed && setCollapsed(false)}
      >
        {/* Close button on mobile */}
        <div className='flex justify-end lg:hidden p-4'>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label='Close sidebar'
            className='p-2 rounded-lg hover:bg-gray-100'
          >
            <svg
              className='w-6 h-6 text-gray-700'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto'>
          {/* Logo with Collapse Button */}
          <div
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'justify-between'
            } py-6 px-4 border-b border-gray-200`}
          >
            <img
              src='/image.png'
              alt='Logo'
              className={`h-16 object-contain ${collapsed ? 'w-10' : 'w-auto'}`}
            />
            {!collapsed && (
              <button
                className='p-1 rounded-full bg-gray-200 shadow transition-transform duration-300 ease-in-out transform hover:bg-gray-300'
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsed((prev) => !prev);
                }}
                aria-label='Toggle sidebar'
              >
                <ChevronLeft className='w-4 h-4 text-gray-700' />
              </button>
            )}
          </div>

          {/* Dashboard */}
          {allowedDashboardRoles.includes(role) && (
            <div className='mt-4 px-2'>
              <Link
                to='/dashboard'
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-100'
                }`}
              >
                <BarChart className='w-4 h-4' />
                <span className={`${collapsed ? 'hidden' : 'block'}`}>
                  Dashboard
                </span>
              </Link>
            </div>
          )}

          {/* Setup */}
          {permissions.includes('Setup') && (
            <div className='mt-4 px-2'>
              <button
                ref={setupBtnRef}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-sm font-semibold text-left rounded-lg transition-colors ${
                  location.pathname.startsWith('/setup')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-100'
                }`}
                onClick={() => setSetupOpen((prev) => !prev)}
                onMouseEnter={handleSetupMouseEnter}
                onMouseLeave={handleSetupMouseLeave}
              >
                <Settings className='w-4 h-4 mr-3' />
                <span className={`${collapsed ? 'hidden' : 'flex-1'}`}>
                  Setup
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    setupOpen ? 'rotate-90' : ''
                  } ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {setupOpen && !collapsed && (
                <div className='flex flex-col gap-1 ml-8 mt-2'>
                  <div className='absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>
                  {['department', 'role', 'employee'].map((item) => (
                    <Link
                      key={item}
                      to={`/setup/${item}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                        location.pathname === `/setup/${item}`
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <div className='absolute top-1/2 w-2 h-px bg-gray-200 -left-4'></div>
                      <span>
                        {item === 'department'
                          ? 'Department Settings'
                          : item === 'role'
                          ? 'Role & Permissions'
                          : 'Employee Settings'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {setupOpen && collapsed && (
                <div
                  style={flyoutStyle(setupFlyoutTop)}
                  onMouseEnter={() => setSetupOpen(true)}
                  onMouseLeave={() => setSetupOpen(false)}
                >
                  {['department', 'role', 'employee'].map((item) => (
                    <Link
                      key={item}
                      to={`/setup/${item}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === `/setup/${item}`
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span>
                        {item === 'department'
                          ? 'Department Settings'
                          : item === 'role'
                          ? 'Role & Permissions'
                          : 'Employee Settings'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Master */}
          {hasMasterPermissions && (
            <div className='mt-4 px-2'>
              <button
                ref={masterBtnRef}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-sm font-semibold text-left rounded-lg transition-colors ${
                  location.pathname.startsWith('/master')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-100'
                }`}
                onClick={() => setMasterOpen((prev) => !prev)}
                onMouseEnter={handleMasterMouseEnter}
                onMouseLeave={handleMasterMouseLeave}
              >
                <Database className='w-4 h-4 mr-3' />
                <span className={`${collapsed ? 'hidden' : 'flex-1'}`}>
                  Master
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    masterOpen ? 'rotate-90' : ''
                  } ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {masterOpen && !collapsed && (
                <div className='flex flex-col gap-1 ml-8 mt-2'>
                  <div className='absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>
                  {['locations', 'holidays', 'workshop-types'].map((item) => (
                    <Link
                      key={item}
                      to={`/master/${item}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                        location.pathname === `/master/${item}`
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <div className='absolute top-1/2 w-2 h-px bg-gray-200 -left-4'></div>
                      <span>
                        {item === 'workshop-types'
                          ? 'Workshop Types'
                          : item.charAt(0).toUpperCase() + item.slice(1)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {masterOpen && collapsed && (
                <div
                  style={flyoutStyle(masterFlyoutTop)}
                  onMouseEnter={() => setMasterOpen(true)}
                  onMouseLeave={() => setMasterOpen(false)}
                >
                  {['locations', 'holidays', 'workshop-types'].map((item) => (
                    <Link
                      key={item}
                      to={`/master/${item}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === `/master/${item}`
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span>
                        {item === 'workshop-types'
                          ? 'Workshop Types'
                          : item.charAt(0).toUpperCase() + item.slice(1)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workshop */}
          {hasWorkshopPermissions && (
            <div className='mt-4 px-2'>
              <button
                ref={workshopBtnRef}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-sm font-semibold text-left rounded-lg transition-colors ${
                  location.pathname.startsWith('/workshop')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-100'
                }`}
                onClick={() => setWorkshopOpen((prev) => !prev)}
                onMouseEnter={handleWorkshopMouseEnter}
                onMouseLeave={handleWorkshopMouseLeave}
              >
                <Wrench className='w-4 h-4 mr-3' />
                <span className={`${collapsed ? 'hidden' : 'flex-1'}`}>
                  Workshop
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    workshopOpen ? 'rotate-90' : ''
                  } ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {workshopOpen && !collapsed && (
                <div className='flex flex-col gap-1 ml-8 mt-2'>
                  <div className='absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>
                  {hasTemplatePermission && (
                    <Link
                      to='/workshop/templates'
                      className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                        location.pathname === '/workshop/templates'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <div className='absolute -left-4 top-1/2 w-2 h-px bg-gray-200'></div>
                      <span>Templates</span>
                    </Link>
                  )}
                  {hasPlanLaunchPermission && (
                    <Link
                      to='/workshop/plan'
                      className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                        location.pathname === '/workshop/plan'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <div className='absolute -left-4 top-1/2 w-2 h-px bg-gray-200'></div>
                      <span>Plan & Launch</span>
                    </Link>
                  )}
                  {hasHistoryPermission && (
                    <Link
                      to='/workshop/history'
                      className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                        location.pathname === '/workshop/history'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <div className='absolute -left-4 top-1/2 w-2 h-px bg-gray-200'></div>
                      <span>Workshop History</span>
                    </Link>
                  )}
                </div>
              )}
              {workshopOpen && collapsed && (
                <div
                  style={flyoutStyle(workshopFlyoutTop)}
                  onMouseEnter={() => setWorkshopOpen(true)}
                  onMouseLeave={() => setWorkshopOpen(false)}
                >
                  {hasTemplatePermission && (
                    <Link
                      to='/workshop/templates'
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === '/workshop/templates'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span>Templates</span>
                    </Link>
                  )}
                  {hasPlanLaunchPermission && (
                    <Link
                      to='/workshop/plan'
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === '/workshop/plan'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span>Plan & Launch</span>
                    </Link>
                  )}
                  {hasHistoryPermission && (
                    <Link
                      to='/workshop/history'
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === '/workshop/history'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span>Workshop History</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          {allowedTasksRoles.includes(role) && hasTaskPermissions && (
            <div className='mt-4 px-2'>
              <button
                ref={tasksBtnRef}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-sm font-semibold text-left rounded-lg transition-colors ${
                  location.pathname.startsWith('/tasks')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-100'
                }`}
                onClick={() => setTasksOpen((prev) => !prev)}
                onMouseEnter={handleTasksMouseEnter}
                onMouseLeave={handleTasksMouseLeave}
              >
                <CheckSquare className='w-4 h-4 mr-3' />
                <span className={`${collapsed ? 'hidden' : 'flex-1'}`}>
                  {role === 'Doer'
                    ? 'My Tasks'
                    : role === 'EA'
                    ? 'EA Tasks Management'
                    : role === 'PC'
                    ? 'PC Tasks Management'
                    : 'All Tasks'}
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    tasksOpen ? 'rotate-90' : ''
                  } ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {tasksOpen && !collapsed && (
                <div className='flex flex-col gap-1 ml-8 mt-2'>
                  <div className='absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>
                  <Link
                    to='/tasks/current'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                      location.pathname === '/tasks/my-tasks'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <div className='absolute -left-4 top-1/2 w-2 h-px bg-gray-200'></div>
                    <span>Current Tasks</span>
                  </Link>
                  <Link
                    to='/tasks/completed'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                      location.pathname === '/tasks/team-tasks'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <div className='absolute -left-4 top-1/2 w-2 h-px bg-gray-200'></div>
                    <span>Completed Tasks</span>
                  </Link>
                </div>
              )}
              {tasksOpen && collapsed && (
                <div
                  style={flyoutStyle(tasksFlyoutTop)}
                  onMouseEnter={() => setTasksOpen(true)}
                  onMouseLeave={() => setTasksOpen(false)}
                >
                  <Link
                    to='/tasks/current'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      location.pathname === '/tasks/my-tasks'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span>Current Tasks</span>
                  </Link>
                  <Link
                    to='/tasks/completed'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      location.pathname === '/tasks/team-tasks'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span>Completed Tasks</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Reports */}
          {['EA', 'PC', 'MD', 'Doer'].includes(role) && (
            <div className='mt-4 px-2'>
              <button
                ref={reportsBtnRef}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-sm font-semibold text-left rounded-lg transition-colors ${
                  location.pathname.startsWith('/reports')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-100'
                }`}
                onClick={() => setReportsOpen((prev) => !prev)}
                onMouseEnter={handleReportsMouseEnter}
                onMouseLeave={handleReportsMouseLeave}
              >
                <FileText className='w-4 h-4 mr-3' />
                <span className={`${collapsed ? 'hidden' : 'flex-1'}`}>
                  Reports
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    reportsOpen ? 'rotate-90' : ''
                  } ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {reportsOpen && !collapsed && (
                <div className='flex flex-col gap-1 ml-8 mt-2'>
                  <div className='absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>
                  <Link
                    to='/reports/fms-performance'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors relative ${
                      location.pathname === '/reports/fms-performance'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <div className='absolute -left-4 top-1/2 w-2 h-px bg-gray-200'></div>
                    <span>FMS Performance Report</span>
                  </Link>
                  
                </div>
              )}
              {reportsOpen && collapsed && (
                <div
                  style={flyoutStyle(reportsFlyoutTop)}
                  onMouseEnter={() => setReportsOpen(true)}
                  onMouseLeave={() => setReportsOpen(false)}
                >
                  <Link
                    to='/reports/fms-performance'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      location.pathname === '/reports/fms-performance'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span>FMS Performance Report</span>
                  </Link>
                  <Link
                    to='/reports/fms-summary'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      location.pathname === '/reports/fms-summary'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span>FMS Summary Report</span>
                  </Link>
                  <Link
                    to='/reports/fms-detailed'
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      location.pathname === '/reports/fms-detailed'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span>FMS Detailed Report</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {allowedDashboardRoles.includes(role) && (
            <div className='mt-4 px-2'>
              <Link
                to='/notifications'
                className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-100 font-medium text-sm rounded-lg transition-colors mt-4'
              >
                <Bell className='w-4 h-4' />
                <span className={`${collapsed ? 'hidden' : 'block'}`}>
                  Notifications
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-gray-200'>
          {localStorage.getItem('isSecondaryLoggedIn') === 'true' && (
            <button
              className='cursor-pointer w-full mb-2 border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold rounded-lg py-2 hover:bg-indigo-100 transition flex items-center justify-center gap-2'
              onClick={handleSwitchRole}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='lucide lucide-switch-user'
              >
                <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                <circle cx='9' cy='7' r='4' />
                <path d='M22 21v-2a4 4 0 0 0-3-3.87' />
                <path d='M16 3.13a4 4 0 0 1 0 7.75' />
              </svg>
              <span className={`${collapsed ? 'hidden' : 'block'}`}>
                {`Switch to ${JSON.parse(
                  localStorage.getItem('secondaryRole') || '"Secondary Role"'
                )}`}
              </span>
            </button>
          )}
          <button
            onClick={handleDelegateLogin}
            className='cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg border-blue-600 border-1 py-2 bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition mb-2'
          >
            <LogOut className='w-5 h-5 text-blue-600' />
            <span className={`${collapsed ? 'hidden' : 'block'}`}>Dothis2 Login</span>
          </button>

          <button
            onClick={handleLogout}
            className='cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg border-rose-600 border-1 py-2 bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 transition'
          >
            <LogOut className='w-5 h-5 text-rose-600' />
            <span className={`${collapsed ? 'hidden' : 'block'}`}>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className='flex-1 overflow-x-auto overflow-y-auto max-h-screen bg-gray-50 dark:bg-gray-900'>
        {children}
      </main>
    </div>
  );
}
