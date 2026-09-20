import React from 'react';
import { Plan, User } from '../types';
import { ChevronLeft, ChevronRight, Plus, Star, MessageSquare, CheckSquare, Image as ImageIcon } from 'lucide-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  onNavigateMonth: (offset: number) => void;
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
  plans: Plan[];
  onOpenPlan: (plan: Plan) => void;
  onCreatePlan: (dateStr: string) => void;
  currentUser: User;
  followedDates?: string[];
  onToggleFollowDate?: (dateStr: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  onNavigateMonth,
  onSelectDate,
  selectedDate,
  plans,
  onOpenPlan,
  onCreatePlan,
  currentUser,
  followedDates = [],
  onToggleFollowDate,
}) => {
  const isViewer = currentUser.role === 'viewer';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-based start
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1; // 0 for Mon, 6 for Sun

  const daysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Build 35 or 42 grid cells
  const calendarCells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = prevDate.toISOString().split('T')[0];
    calendarCells.push({ dateStr, dayNumber: dayNum, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    // Format YYYY-MM-DD cleanly with zero-padding
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;
    calendarCells.push({ dateStr, dayNumber: i, isCurrentMonth: true });
  }

  // Next month leading days to complete grid
  const remaining = 35 - calendarCells.length;
  const daysToAdd = remaining >= 0 ? remaining : 42 - calendarCells.length;
  for (let i = 1; i <= daysToAdd; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = nextDate.toISOString().split('T')[0];
    calendarCells.push({ dateStr, dayNumber: i, isCurrentMonth: false });
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Month Navigation Toolbar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 font-display">{monthName}</h2>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Showing all collaborative team plans
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="prev-month-btn"
            onClick={() => onNavigateMonth(-1)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="today-month-btn"
            onClick={() => onSelectDate(todayStr)}
            className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 border border-slate-200 transition-colors"
          >
            Today
          </button>
          <button
            id="next-month-btn"
            onClick={() => onNavigateMonth(1)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center text-xs font-semibold text-slate-600">
        {weekDays.map((w) => (
          <div key={w} className="py-2.5">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[580px]">
        {calendarCells.map((cell) => {
          const dayPlans = plans.filter((p) => p.date === cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const isFollowed = followedDates.includes(cell.dateStr);

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`p-2 flex flex-col transition-all group relative cursor-pointer min-h-[96px] ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/30 text-slate-300'
                  : isSelected
                  ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-500'
                  : 'bg-white hover:bg-slate-50/60'
              }`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white font-bold'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {isFollowed && (
                    <span title="You are following this date's updates">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    </span>
                  )}
                </div>

                {/* Hover Add Plan & Follow Date buttons */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  {onToggleFollowDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollowDate(cell.dateStr);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100"
                      title={isFollowed ? 'Unfollow date' : 'Follow this date for alerts'}
                    >
                      <Star className={`w-3 h-3 ${isFollowed ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePlan(cell.dateStr);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Add plan on this date"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Plans List in Day Cell */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-24 no-scrollbar">
                {dayPlans.map((p) => {
                  const hasChecklist = p.blocks.some((b) => b.type === 'checklist');
                  const hasImage = p.blocks.some((b) => b.type === 'image');
                  const commentsCount = p.comments?.length || 0;

                  return (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPlan(p);
                      }}
                      className={`p-1.5 rounded-lg text-[11px] font-medium border flex flex-col gap-0.5 transition-all hover:scale-[1.01] shadow-2xs ${
                        p.color === 'emerald'
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                          : p.color === 'indigo'
                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 hover:bg-indigo-100/70'
                          : p.color === 'amber'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/70'
                          : p.color === 'rose'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900 hover:bg-rose-100/70'
                          : 'bg-violet-50/80 border-violet-200 text-violet-900 hover:bg-violet-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-[11px] leading-tight">{p.title}</span>
                        {p.timeStart && (
                          <span className="text-[9px] opacity-75 whitespace-nowrap font-mono">{p.timeStart}</span>
                        )}
                      </div>

                      {/* Micro badges: collaborator avatar & indicators */}
                      <div className="flex items-center justify-between text-[9px] opacity-80 pt-0.5">
                        <div className="flex items-center gap-1">
                          <img
                            src={p.lastEditedBy.avatar}
                            alt={p.lastEditedBy.name}
                            title={`Last edited by ${p.lastEditedBy.name}`}
                            className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-white"
                          />
                          {hasChecklist && (
                            <span title="Has checklist">
                              <CheckSquare className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {hasImage && (
                            <span title="Has image">
                              <ImageIcon className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        {commentsCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {commentsCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
