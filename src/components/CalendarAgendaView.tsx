import React from 'react';
import { Plan, User } from '../types';
import { Calendar, Clock, MessageSquare, Plus, CheckSquare } from 'lucide-react';

interface CalendarAgendaViewProps {
  plans: Plan[];
  onOpenPlan: (plan: Plan) => void;
  onCreatePlan: (dateStr: string) => void;
  currentUser: User;
  searchQuery: string;
  selectedTag: string | null;
  selectedAuthor: string | null;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  plans,
  onOpenPlan,
  onCreatePlan,
  currentUser,
  searchQuery,
  selectedTag,
  selectedAuthor,
}) => {
  const isViewer = currentUser.role === 'viewer';

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      const matchBlocks = p.blocks.some((b: any) => {
        if (b.type === 'text') return b.content?.toLowerCase().includes(q) || b.title?.toLowerCase().includes(q);
        if (b.type === 'link') return b.title?.toLowerCase().includes(q) || b.url?.toLowerCase().includes(q);
        return false;
      });
      if (!matchTitle && !matchTags && !matchBlocks) return false;
    }
    if (selectedTag && !p.tags.includes(selectedTag)) return false;
    if (selectedAuthor && p.createdBy.id !== selectedAuthor && p.lastEditedBy.id !== selectedAuthor) return false;
    return true;
  });

  // Group by date
  const groupedByDate: { [date: string]: Plan[] } = {};
  filteredPlans
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((p) => {
      if (!groupedByDate[p.date]) groupedByDate[p.date] = [];
      groupedByDate[p.date].push(p);
    });

  const sortedDates = Object.keys(groupedByDate);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 font-display">Schedule Agenda & Filtered Directory</h2>
          <span className="text-xs text-slate-500 font-medium">({filteredPlans.length} plans found)</span>
        </div>

        {!isViewer && (
          <button
            onClick={() => onCreatePlan(todayStr)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> + New Plan
          </button>
        )}
      </div>

      {/* Agenda List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {sortedDates.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-sm font-semibold text-slate-700">No matching plans found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query, selected tag, or author filter.</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const datePlans = groupedByDate[dateStr];
            const isToday = dateStr === todayStr;
            const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isToday ? 'text-indigo-600 font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    {formatted} {isToday && '(Today)'}
                  </span>
                  <span className="text-[11px] text-slate-400">({datePlans.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {datePlans.map((plan) => {
                    const checklistBlock = plan.blocks.find((b) => b.type === 'checklist') as any;
                    const totalChecks = checklistBlock?.items?.length || 0;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => onOpenPlan(plan)}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {plan.timeStart || 'All Day'} {plan.timeEnd ? `- ${plan.timeEnd}` : ''}
                            </span>
                            <div className="flex gap-1">
                              {plan.tags.slice(0, 2).map((t) => (
                                <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 font-display mb-1">{plan.title}</h4>

                          {totalChecks > 0 && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <CheckSquare className="w-3 h-3 text-blue-500" />
                              <span>{totalChecks} tasks in checklist</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={plan.lastEditedBy.avatar}
                              alt={plan.lastEditedBy.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="text-[11px]">Last edited by {plan.lastEditedBy.name}</span>
                          </div>
                          {plan.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <MessageSquare className="w-3 h-3" /> {plan.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
