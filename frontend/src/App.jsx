import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import DepartmentSettings from './pages/DepartmentSettings';
import RolePermissions from './pages/RolePermissions';
import EmployeeSettings from './pages/EmployeeSettings';
import ProtectedRoute from './ProtectedRoute';
import { Toaster } from 'sonner';
import Templates from './pages/Templates';
import ProtectedLayout from './ProtectedLayout';
import CreateTemplate from './pages/CreateTemplate';
import ViewTemplate from './pages/ViewTemplate';
import EditTemplate from './pages/EditTemplate';
import WorkshopPlan from './pages/WorkshopPlan';
import CreateWorkshop from './pages/CreateWorkshop';
import ViewWorkshop from './pages/ViewWorkshop';
import ManageWorkshop from './pages/ManageWorkshop';
import PermissionRoute from './PermissionRoute';
import WorkshopHistory from './pages/WorkshopHistory';
import WorkshopHistoryView from './pages/WorkshopHistoryView';
import CurrentTasks from './pages/CurrentTasks';
import CompletedTasks from './pages/CompletedTasks';
import Locations from './pages/Locations';
import Holidays from './pages/Holidays';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import FMSPerformanceReport from './pages/FMSPerformanceReport';
import WorkshopType from './pages/WorkshopType';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import NotificationDialog from './components/NotificationDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { Button } from './components/ui/button';
import axios from 'axios';
import { useSessionTimeout } from './contexts/SessionTimeoutContext';

/**
 * Top-level component for the application.
 *
 * Contains the Toaster for displaying notifications, and the Router for client-side
 * routing. The Routes component defines two routes: one for the login page, and one
 * for the root path which redirects to the login page.
 *
 * @returns {ReactElement} JSX for the App component.
 */

// Global Session Timeout Modal
function GlobalSessionTimeoutModal() {
  const { sessionTimeout } = useSessionTimeout();
  return (
    <Dialog open={sessionTimeout}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Session Timed Out</DialogTitle>
        </DialogHeader>
        <div className='py-4 text-center'>
          <div className='mb-2 text-lg font-semibold'>
            Your session has expired.
          </div>
          <div className='text-gray-500 mb-4'>
            Please log in again to continue.
          </div>
          <Button
            className='w-full'
            onClick={async () => {
              try {
                await axios.post(
                  `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
                  {},
                  { withCredentials: true }
                );
              } catch (e) {
                // Ignore errors
              }
              localStorage.clear();
              window.location.href = '/login';
            }}
          >
            Go to Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const { setSessionTimeout } = useSessionTimeout();
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    if (window.socket && typeof window.socket.disconnect === 'function') {
      window.socket.disconnect();
    }
    const socket = io(import.meta.env.VITE_SOCKET_BASE_URL, {
      withCredentials: true,
    });
    window.socket = socket;
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('register', userId);
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    socket.on('notification', (data) => {
      console.log('Notification received:', data);
      setNotifMessage(data.message);
      setNotifType(data.type);
      setNotifDialogOpen(true);
    });
    return () => socket.disconnect();
  }, [userId]);

  return (
    <>
      <Toaster richColors position='top-center' />
      <Router>
        <NotificationDialog
          open={notifDialogOpen}
          onOpenChange={setNotifDialogOpen}
          message={notifMessage}
          type={notifType}
        />
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path='/' element={<Home />} />
            <Route
              path='/setup/department'
              element={
                <PermissionRoute required='Setup'>
                  <DepartmentSettings />
                </PermissionRoute>
              }
            />
            <Route
              path='/setup/role'
              element={
                <PermissionRoute required='Setup'>
                  <RolePermissions />
                </PermissionRoute>
              }
            />
            <Route
              path='/setup/employee'
              element={
                <PermissionRoute required='Setup'>
                  <EmployeeSettings />
                </PermissionRoute>
              }
            />
            <Route path='/workshop/templates' element={<Templates />} />
            <Route
              path='/workshop/templates/new'
              element={<CreateTemplate />}
            />
            <Route path='/workshop/templates/:id' element={<ViewTemplate />} />
            <Route
              path='/workshop/templates/:id/edit'
              element={<EditTemplate />}
            />
            <Route
              path='/workshop/plan'
              element={
                <PermissionRoute required='Plan & Launch'>
                  <WorkshopPlan />
                </PermissionRoute>
              }
            />
            <Route
              path='/workshop/create'
              element={
                <PermissionRoute required='Plan & Launch'>
                  <CreateWorkshop />
                </PermissionRoute>
              }
            />
            <Route
              path='/workshop/:id'
              element={
                <PermissionRoute required='Plan & Launch'>
                  <ViewWorkshop />
                </PermissionRoute>
              }
            />
            <Route
              path='/workshop/:id/manage'
              element={
                <PermissionRoute required='Plan & Launch'>
                  <ManageWorkshop />
                </PermissionRoute>
              }
            />
            <Route
              path='/workshop/workshop-history/:id'
              element={
                <PermissionRoute required='Workshop History'>
                  <WorkshopHistoryView />
                </PermissionRoute>
              }
            />
            {/* <Route path="/workshop/workshop-history/:id/manage" element={<PermissionRoute required="Workshop History"><ManageWorkshop /></PermissionRoute>} /> */}
            <Route
              path='/workshop/history'
              element={
                <PermissionRoute required='Workshop History'>
                  <WorkshopHistory />
                </PermissionRoute>
              }
            />
            {/* <Route path="/workshop/:id/history" element={<WorkshopHistoryView />} /> */}
            <Route path='/tasks/current' element={<CurrentTasks />} />
            <Route path='/tasks/completed' element={<CompletedTasks />} />
            <Route
              path='/master/locations'
              element={
                <PermissionRoute required='Setup'>
                  <Locations />
                </PermissionRoute>
              }
            />
            <Route
              path='/master/holidays'
              element={
                <PermissionRoute required='Setup'>
                  <Holidays />
                </PermissionRoute>
              }
            />
            <Route
              path='/master/workshop-types'
              element={
                <PermissionRoute required='Setup'>
                  <WorkshopType />
                </PermissionRoute>
              }
            />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/notifications' element={<Notifications />} />
            <Route
              path='/reports/fms-performance'
              element={
                <ProtectedRoute>
                  <FMSPerformanceReport />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
      <GlobalSessionTimeoutModal />
    </>
  );
}

export default App;
