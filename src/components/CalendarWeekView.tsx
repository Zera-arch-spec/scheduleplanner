import React from 'react';
import { Plan, User } from '../types';
import { ChevronLeft, ChevronRight, Plus, Star, MessageSquare, Clock, CheckSquare } from 'lucide-react';

interface CalendarWeekViewProps {
  currentDate: Date;
  onNavigateWeek: (offset: number) => void;
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
  plans: Plan[];
  onOpenPlan: (plan: Plan) => void;
  onCreatePlan: (dateStr: string) => void;
  currentUser: User;
  followedDates?: string[];
  onToggleFollowDate?: (dateStr: string) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  onNavigateWeek,
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
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate start of week (Monday)
  const d = new Date(currentDate);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d.setDate(d.getDate() + diffToMonday));

  const weekDays: { dateStr: string; dayName: string; dayNumber: number; fullDate: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    weekDays.push({
      dateStr,
      dayName: dayDate.toLocaleString('default', { weekday: 'short' }),
      dayNumber: dayDate.getDate(),
      fullDate: dayDate,
    });
  }

  const weekTitle = `${weekDays[0].fullDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} – ${weekDays[6].fullDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 font-display">{weekTitle}</h2>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            7-Day Weekly Team Synchronizer
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigateWeek(-1)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 border border-slate-200 transition-colors"
          >
            Current Week
          </button>
          <button
            onClick={() => onNavigateWeek(1)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 flex-1 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-y-auto">
        {weekDays.map((day) => {
          const dayPlans = plans.filter((p) => p.date === day.dateStr);
          const isToday = day.dateStr === todayStr;
          const isSelected = day.dateStr === selectedDate;
          const isFollowed = followedDates.includes(day.dateStr);

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              className={`p-3 flex flex-col min-h-[400px] transition-colors ${
                isSelected ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-500/50' : 'bg-white hover:bg-slate-50/50'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : isSelected
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">{day.dayName}</span>
                    <span className="text-[10px] text-slate-400">{day.dateStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onToggleFollowDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollowDate(day.dateStr);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100"
                      title={isFollowed ? 'Unfollow date' : 'Follow date'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFollowed ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePlan(day.dateStr);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Add plan"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Day Plans */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {dayPlans.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-300">
                    No plans scheduled
                  </div>
                ) : (
                  dayPlans.map((p) => {
                    const checklistBlock = p.blocks.find((b) => b.type === 'checklist') as any;
                    const totalChecks = checklistBlock?.items?.length || 0;
                    const doneChecks = checklistBlock?.items?.filter((it: any) => it.done).length || 0;

                    return (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPlan(p);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-xs hover:scale-[1.01] ${
                          p.color === 'emerald'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : p.color === 'indigo'
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                            : p.color === 'amber'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : p.color === 'rose'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                            : 'bg-violet-50/70 border-violet-200 text-violet-950'
                        }`}
                      >
                        {/* Time and tags */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          {p.timeStart ? (
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Clock className="w-3 h-3" />
                              {p.timeStart} {p.timeEnd ? `- ${p.timeEnd}` : ''}
                            </span>
                          ) : (
                            <span>All Day</span>
                          )}
                          {p.tags.length > 0 && (
                            <span className="font-semibold text-indigo-600 bg-indigo-100/50 px-1.5 py-0.2 rounded">
                              #{p.tags[0]}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 leading-snug">{p.title}</h4>

                        {/* Checklist progress */}
                        {totalChecks > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                            <CheckSquare className="w-3 h-3 text-blue-500" />
                            <span>
                              {doneChecks}/{totalChecks} tasks done
                            </span>
                          </div>
                        )}

                        {/* Footer: collaborator and comments */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <img
                              src={p.lastEditedBy.avatar}
                              alt={p.lastEditedBy.name}
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-white"
                            />
                            <span className="truncate max-w-[70px]">{p.lastEditedBy.name}</span>
                          </div>
                          {p.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 font-medium">
                              <MessageSquare className="w-3 h-3" />
                              {p.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
