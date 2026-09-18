import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  Bell,
  MessageSquare,
  FileText,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
  comment: <MessageSquare className='w-7 h-7 text-blue-500' />,
  document: <FileText className='w-7 h-7 text-yellow-500' />,
  escalation: <AlertTriangle className='w-7 h-7 text-red-500' />,
  daily: <CalendarDays className='w-7 h-7 text-green-500' />,
  default: <Bell className='w-7 h-7 text-primary' />,
};

export default function NotificationDialog({
  open,
  onOpenChange,
  message,
  type,
}) {
  const navigate = useNavigate();
  // Determine tab for navigation
  const tab =
    type === 'comment' || type === 'document' || type === 'escalation'
      ? type
      : 'daily';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md rounded-2xl border border-gray-200 bg-white dark:bg-gray-900'>
        <DialogHeader>
          <div className='flex flex-col items-center gap-2 mb-2'>
            {typeIcons[type] || typeIcons.default}
            <DialogTitle className='text-xl font-bold text-center text-gray-800'>
              New {tab.charAt(0).toUpperCase() + tab.slice(1)} Notification
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className='py-4 text-lg text-center text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2 border border-gray-200 dark:border-gray-800'>
          {message}
        </div>
        <DialogFooter className='flex flex-col gap-2 items-stretch'>
          <button
            type='button'
            className='text-base py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition'
            onClick={() => {
              onOpenChange(false);
              navigate(`/notifications?tab=${tab}&read=unread`);
            }}
          >
            Go to {tab.charAt(0).toUpperCase() + tab.slice(1)} Inbox
          </button>
          <button
            type='button'
            className='py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition'
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
