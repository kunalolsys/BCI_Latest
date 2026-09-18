import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import {
  Loader2,
  Users,
  ClipboardList,
  CheckCircle,
  Activity,
  AlertTriangle,
  CalendarDays,
  Flag,
  Clock,
  Flame,
  MessageSquare,
  FileText,
  TrendingUp,
  Bell,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import CountUp from 'react-countup';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const cardData = [
  {
    key: 'totalWorkshops',
    label: 'Total Workshops',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    key: 'totalTasks',
    label: 'Total Tasks',
    icon: ClipboardList,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    key: 'totalCompletedTasks',
    label: 'Completed Tasks',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-600',
    nav: true,
    tooltip: 'Go to Completed Tasks',
  },
  {
    key: 'totalActiveTasks',
    label: 'Active Tasks',
    icon: Activity,
    color: 'bg-cyan-100 text-cyan-600',
    nav: true,
    tooltip: 'Go to Active Tasks',
  },
  {
    key: 'totalOverdueTasks',
    label: 'Overdue Tasks',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-600',
    nav: true,
    tooltip: 'Go to Overdue Tasks',
  },
  {
    key: 'totalTodaysTasks',
    label: "Today's Tasks",
    icon: CalendarDays,
    color: 'bg-yellow-100 text-yellow-600',
    nav: true,
    tooltip: "Go to Today's Tasks",
  },
  {
    key: 'totalEscalations',
    label: 'Tasks with Escalations',
    icon: Flag,
    color: 'bg-orange-100 text-orange-600',
    nav: true,
    tooltip: 'Go to Escalations',
  },
  {
    key: 'totalLateTasksMarked',
    label: 'Late Tasks Marked',
    icon: Clock,
    color: 'bg-gray-100 text-gray-600',
  },
  {
    key: 'totalCriticalOverdueTasks',
    label: 'Critical Overdue Tasks',
    icon: Flame,
    color: 'bg-pink-100 text-pink-600',
    nav: true,
    tooltip: 'Go to Critical Overdue Tasks',
  },
  {
    key: 'totalPendingTasksWithComments',
    label: 'Tasks with Comments',
    icon: MessageSquare,
    color: 'bg-green-50 text-green-700',
    nav: true,
    tooltip: 'Go to Active Tasks with Comments',
  },
  {
    key: 'totalPendingTasksWithDocuments',
    label: 'Tasks with Documents',
    icon: FileText,
    color: 'bg-blue-50 text-blue-700',
    nav: true,
    tooltip: 'Go to Active Tasks with Documents',
  },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/dashboard`, {
        withCredentials: true,
      })
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper for today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Card click handler
  const handleCardClick = (key) => {
    switch (key) {
      case 'totalCompletedTasks':
        navigate('/tasks/completed');
        break;
      case 'totalActiveTasks':
        navigate('/tasks/current', { state: { activeTab: 'active' } });
        break;
      case 'totalOverdueTasks':
        navigate('/tasks/current', { state: { activeTab: 'overdue' } });
        break;
      case 'totalTodaysTasks':
        navigate('/tasks/current', {
          state: {
            activeTab: 'active',
            filters: { plannedDate: [today, today] },
          },
        });
        break;
      case 'totalEscalations':
        navigate('/tasks/current', {
          state: { activeTab: 'overdue', filters: { escalation: 'Yes' } },
        });
        break;
      case 'totalCriticalOverdueTasks':
        navigate('/tasks/current', {
          state: { activeTab: 'overdue', filters: { critical: 'Critical' } },
        });
        break;
      case 'totalPendingTasksWithComments':
        navigate('/tasks/current', {
          state: { activeTab: 'active', filters: { comments: 'Yes' } },
        });
        break;
      case 'totalPendingTasksWithDocuments':
        navigate('/tasks/current', {
          state: { activeTab: 'active', filters: { documents: 'Yes' } },
        });
        break;
      default:
        break;
    }
  };

  // Quick filter row (UI only)
  // const quickFilters = [
  //   { label: "Today", icon: CalendarDays },
  //   { label: "This Week", icon: Clock },
  //   { label: "Critical Only", icon: Flame },
  // ];

  return (
    <div className='p-6'>
      <div className='sticky top-0 z-10 bg-white/30 dark:bg-gray-900/80 pb-4 mb-4'>
        <h1 className='text-3xl font-bold mb-2'>Dashboard</h1>
      </div>
      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
          {cardData.map((card) => (
            <Skeleton key={card.key} className='h-40 rounded-xl' />
          ))}
        </div>
      ) : error ? (
        <div className='text-center text-red-500 py-10'>{error}</div>
      ) : (
        <TooltipProvider>
          <AnimatePresence>
            <motion.div
              className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'
              initial='hidden'
              animate='visible'
              exit='hidden'
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.08 },
                },
              }}
            >
              {cardData.map((card) => {
                // Hide Critical Overdue Tasks for Doer
                if (
                  card.key === 'totalCriticalOverdueTasks' &&
                  data &&
                  data.totalCriticalOverdueTasks === 0 &&
                  JSON.parse(localStorage.getItem('role')) === 'Doer'
                )
                  return null;
                const Icon = card.icon;
                const clickable = !!card.nav;

                // Color coding for special cards
                const borderColor =
                  card.key === 'totalOverdueTasks'
                    ? 'border-red-200'
                    : card.key === 'totalEscalations'
                    ? 'border-yellow-200'
                    : 'border-gray-200';

                const bgColor =
                  card.key === 'totalOverdueTasks'
                    ? 'bg-red-50'
                    : card.key === 'totalEscalations'
                    ? 'bg-yellow-50'
                    : 'bg-white dark:bg-gray-900';

                const iconColor =
                  card.key === 'totalOverdueTasks'
                    ? 'text-red-400'
                    : card.key === 'totalEscalations'
                    ? 'text-yellow-500'
                    : 'text-indigo-500';

                const numberColor =
                  card.key === 'totalOverdueTasks'
                    ? 'text-red-600'
                    : card.key === 'totalEscalations'
                    ? 'text-yellow-600'
                    : 'text-gray-900 dark:text-white';

                return (
                  <motion.div
                    key={card.key}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                group relative flex flex-col justify-between
                rounded-xl p-6 min-h-[148px] shadow border
                ${borderColor} ${bgColor}
                transition-all
                ${
                  clickable
                    ? 'cursor-pointer hover:shadow-md hover:border-indigo-300'
                    : ''
                }
              `}
                          tabIndex={clickable ? 0 : -1}
                          role={clickable ? 'button' : undefined}
                          aria-label={card.label}
                          onClick={
                            clickable
                              ? () => handleCardClick(card.key)
                              : undefined
                          }
                          onKeyDown={
                            clickable
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ')
                                    handleCardClick(card.key);
                                }
                              : undefined
                          }
                        >
                          {/* Icon in top-right */}
                          <div className={`absolute top-4 right-4 opacity-80`}>
                            <Icon className={`w-7 h-7 ${iconColor}`} />
                          </div>
                          {/* Card label */}
                          <div className='text-sm font-medium text-gray-600 mb-1'>
                            {card.label}
                          </div>
                          {/* Card number and progress bar */}
                          <div className='flex flex-col gap-1 mb-1'>
                            <span
                              className={`text-3xl font-bold ${numberColor}`}
                            >
                              <CountUp
                                end={
                                  data && typeof data[card.key] !== 'undefined'
                                    ? data[card.key]
                                    : 0
                                }
                                duration={1.2}
                                separator=','
                              />
                            </span>
                            {/* Progress bar for Completed Tasks */}
                            {card.key === 'totalCompletedTasks' && (
                              <>
                                <div className='w-full h-2 rounded bg-gray-100 mt-1 mb-1'>
                                  <div
                                    className='h-2 rounded bg-green-500 transition-all'
                                    style={{
                                      width: `${
                                        data && data.totalTasks
                                          ? Math.round(
                                              ((data.totalCompletedTasks || 0) /
                                                data.totalTasks) *
                                                100
                                            )
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                                <div className='text-xs text-gray-500 font-medium'>
                                  {data && data.totalTasks
                                    ? `${Math.round(
                                        ((data.totalCompletedTasks || 0) /
                                          data.totalTasks) *
                                          100
                                      )}% completed`
                                    : '0% completed'}
                                </div>
                              </>
                            )}
                          </div>
                          {/* Card description */}
                          <div
                            className={`
                text-xs
                ${
                  card.key === 'totalOverdueTasks'
                    ? 'text-red-400'
                    : card.key === 'totalEscalations'
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                }
              `}
                          >
                            {card.key === 'totalWorkshops' &&
                              'All workshops conducted'}
                            {card.key === 'totalTasks' && 'All tasks created'}
                            {card.key === 'totalCompletedTasks' && ''}
                            {card.key === 'totalActiveTasks' &&
                              'Currently ongoing workshops'}
                            {card.key === 'totalOverdueTasks' &&
                              'Tasks past their due date'}
                            {card.key === 'totalTodaysTasks' &&
                              'Tasks due today'}
                            {card.key === 'totalEscalations' &&
                              'Tasks requiring immediate attention'}
                            {card.key === 'totalLateTasksMarked' &&
                              'Tasks marked late'}
                            {card.key === 'totalCriticalOverdueTasks' &&
                              'Critical overdue tasks'}
                            {card.key === 'totalPendingTasksWithComments' &&
                              'Tasks with comments'}
                            {card.key === 'totalPendingTasksWithDocuments' &&
                              'Tasks with documents'}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {card.tooltip && (
                        <TooltipContent>{card.tooltip}</TooltipContent>
                      )}
                    </Tooltip>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </TooltipProvider>
      )}
    </div>
  );
}
