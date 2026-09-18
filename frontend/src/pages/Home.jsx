import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';

/**
 * Home page shown after login. Now shows user details and session expiry info.
 */
export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user details from backend using /currentDetails endpoint
    axios
      .get(
        `${import.meta.env.VITE_API_BASE_URL}/setup/employees/currentDetails`,
        { withCredentials: true }
      )
      .then((res) => {
        setUser(res.data.employee || null);
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch user details.');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Session expiry: Not available (httpOnly cookie)
  // TODO: If backend provides expiry info, display countdown here.

  return (
    <div className='p-4 md:p-8 flex flex-col items-center justify-center h-full min-h-[60vh] bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-gray-950'>
      <div className='w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'>
        <div className='flex flex-col items-center px-8 pt-10'>
          {/* Simple Avatar */}
          <div className='mb-4'>
            <div className='w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-200 shadow'>
              {user?.name?.[0]?.toUpperCase() || (
                <Loader2 className='animate-spin w-8 h-8 text-indigo-400' />
              )}
            </div>
          </div>
          <h2 className='text-3xl font-bold mb-1 text-center text-gray-800 dark:text-white'>
            Welcome Home!
          </h2>
          <div className='mb-2 text-center text-gray-500 dark:text-gray-300'>
            {user ? 'Glad to see you back.' : 'Loading your info...'}
          </div>
        </div>
        <div className='px-8 pb-10'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='animate-spin w-8 h-8 text-indigo-500' />
            </div>
          ) : error ? (
            <div className='text-red-500 text-center py-4'>{error}</div>
          ) : user ? (
            <div className='space-y-3'>
              <div className='flex flex-col items-center gap-1'>
                <div className='text-lg font-semibold text-gray-800 dark:text-white'>
                  {user.name}
                </div>
                <div className='text-gray-500 dark:text-gray-300'>
                  {user.email}
                </div>
                <div className='text-sm text-gray-600 dark:text-gray-200'>
                  <span className='font-semibold text-indigo-600 dark:text-indigo-300'>
                    Role:
                  </span>{' '}
                  <span className='font-medium'>{user.role?.name || '-'}</span>
                </div>
                <div className='text-sm text-gray-600 dark:text-gray-200'>
                  <span className='font-semibold text-indigo-600 dark:text-indigo-300'>
                    Department:
                  </span>{' '}
                  <span className='font-medium'>
                    {user.departments?.map((d) => d.name).join(', ') || '-'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
