import { NotificationItem } from '../types';
import { Bell, Check, Clock, Calendar, MessageSquare, Sparkles, X } from 'lucide-react';

interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectPlan: (planId?: string, date?: string) => void;
}

export const NotificationsDropdown = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onSelectPlan,
}: NotificationsDropdownProps) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'plan_created':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'plan_updated':
        return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'date_alert':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div
      id="notifications-dropdown"
      className="absolute right-0 top-12 w-84 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-900">Activity & Alerts</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={onMarkAllRead}
              className="p-1.5 text-xs text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 flex items-center gap-1 transition-colors"
              title="Mark all read"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No notifications yet. Activity on plans you follow will appear here.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectPlan(item.planId, item.date);
                onClose();
              }}
              className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start ${
                !item.read ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                  {item.message}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <img
                    src={item.actor.avatar}
                    alt={item.actor.name}
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {item.actor.name}
                  </span>
                  {item.date && (
                    <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.2 rounded ml-auto">
                      {item.date}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
