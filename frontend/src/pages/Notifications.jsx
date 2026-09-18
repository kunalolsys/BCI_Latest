import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui/tabs';
import {
  Loader2,
  Bell,
  CheckCircle,
  FileText,
  MessageSquare,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSearchParams, useNavigate } from 'react-router-dom';

const NOTIF_TYPES = [
  {
    key: 'comment',
    label: 'Comments',
    icon: <MessageSquare className='w-4 h-4 mr-1' />,
  },
  {
    key: 'document',
    label: 'Documents',
    icon: <FileText className='w-4 h-4 mr-1' />,
  },
  {
    key: 'escalation',
    label: 'Escalations',
    icon: <AlertTriangle className='w-4 h-4 mr-1' />,
  },
  {
    key: 'daily',
    label: 'Daily',
    icon: <CalendarDays className='w-4 h-4 mr-1' />,
  },
];

const PAGE_SIZE = 10;

export default function Notifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'comment';
  const initialRead = searchParams.get('read') || 'unread';
  const [mainTab, setMainTab] = useState(initialTab);
  const [readTab, setReadTab] = useState(initialRead);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [mainTab, readTab, page]);

  // Update URL when mainTab or readTab changes
  useEffect(() => {
    setSearchParams({ tab: mainTab, read: readTab });
  }, [mainTab, readTab, setSearchParams]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        type: mainTab,
        read: readTab === 'read',
        page,
        limit: PAGE_SIZE,
      };
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/notifications`,
        {
          params,
          withCredentials: true,
        }
      );
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      setNotifications([]);
      setTotalPages(1);
      setTotal(0);
    }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${id}/read`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  // Pagination controls
  const Pagination = () => (
    <div className='flex items-center justify-between mt-8 gap-4'>
      <span className='text-xs text-gray-500 font-medium'>
        Page <span className='font-semibold text-gray-700'>{page}</span> of{' '}
        <span className='font-semibold text-gray-700'>{totalPages}</span>{' '}
        <span className='text-xs text-gray-400'>({total} notifications)</span>
      </span>
      <div className='flex gap-2'>
        <button
          type='button'
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className='px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition disabled:opacity-40'
        >
          Prev
        </button>
        <button
          type='button'
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className='px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition disabled:opacity-40'
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className='p-8 w-full bg-gray-50 min-h-screen'>
      <h1 className='text-3xl font-bold mb-8 ml-1.5 flex items-center gap-3 text-gray-800 tracking-tight'>
        Notifications
      </h1>
      <Tabs
        value={mainTab}
        onValueChange={(tab) => {
          setMainTab(tab);
          setPage(1);
        }}
        className='w-full'
      >
        <TabsList className='mb-6 bg-gray-100 rounded-lg border border-gray-200 p-1 gap-2'>
          {NOTIF_TYPES.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className='flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-5 py-2 font-semibold text-gray-700 transition'
            >
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {NOTIF_TYPES.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <div className='flex gap-2 mb-4 ml-1'>
              <button
                type='button'
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  readTab === 'unread'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setReadTab('unread');
                  setPage(1);
                }}
              >
                Unread
              </button>
              <button
                type='button'
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  readTab === 'read'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setReadTab('read');
                  setPage(1);
                }}
              >
                Read
              </button>
            </div>
            {loading ? (
              <div className='flex justify-center py-10'>
                <Loader2 className='animate-spin w-8 h-8 text-indigo-600' />
              </div>
            ) : notifications.length === 0 ? (
              <div className='text-center text-gray-500 py-10'>
                No notifications found.
              </div>
            ) : (
              <div className='space-y-4'>
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`rounded-xl border bg-white dark:bg-gray-900 px-6 py-4 flex flex-col gap-2 ${
                      n.read
                        ? 'border-gray-200 dark:border-gray-800'
                        : 'border-indigo-400 ring-2 ring-indigo-100'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <span className='flex items-center text-indigo-600'>
                        {t.icon}
                      </span>
                      <span className='flex-1 text-base font-medium text-gray-800'>
                        {n.message}
                      </span>
                      {!n.read && (
                        <button
                          type='button'
                          className='px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
                          onClick={() => markAsRead(n._id)}
                        >
                          Mark as read
                        </button>
                      )}
                      {n.read && (
                        <CheckCircle className='w-5 h-5 text-green-500' />
                      )}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                <Pagination />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
