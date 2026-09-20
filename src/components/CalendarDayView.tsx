import React from 'react';
import { Plan, User } from '../types';
import { Plus, Star, Volume2, Share2, MessageSquare, Clock, CheckSquare, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';

interface CalendarDayViewProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  plans: Plan[];
  onOpenPlan: (plan: Plan) => void;
  onCreatePlan: (dateStr: string, time?: string) => void;
  currentUser: User;
  onOpenAudioBriefing: () => void;
  onOpenExportShare: () => void;
  isFollowed?: boolean;
  onToggleFollowDate?: (dateStr: string) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  selectedDate,
  plans,
  onOpenPlan,
  onCreatePlan,
  currentUser,
  onOpenAudioBriefing,
  onOpenExportShare,
  isFollowed = false,
  onToggleFollowDate,
}) => {
  const isViewer = currentUser.role === 'viewer';
  const dayPlans = plans.filter((p) => p.date === selectedDate);
  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Time grid slots
  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Day View Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-display">{formattedDate}</h2>
              {onToggleFollowDate && (
                <button
                  id="toggle-follow-date-btn"
                  onClick={() => onToggleFollowDate(selectedDate)}
                  className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
                    isFollowed
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={isFollowed ? 'Unfollow this date' : 'Follow this date for collaborative notifications'}
                >
                  <Star className={`w-3.5 h-3.5 ${isFollowed ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span className="hidden sm:inline">{isFollowed ? 'Following Date' : 'Follow Date'}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {dayPlans.length} {dayPlans.length === 1 ? 'plan' : 'plans'} scheduled for this date
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 no-print">
          <button
            id="day-audio-briefing-btn"
            onClick={onOpenAudioBriefing}
            className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio Briefing (TTS)</span>
          </button>

          <button
            id="day-share-export-btn"
            onClick={onOpenExportShare}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share & PDF</span>
          </button>

          {!isViewer && (
            <button
              id="day-new-plan-btn"
              onClick={() => onCreatePlan(selectedDate, '09:00')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Daily Content: Hourly timeline + cards */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {dayPlans.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 font-display">No Plans Scheduled</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Collaborate with team members by scheduling a meeting, milestone, or task for this day.
            </p>
            {!isViewer && (
              <button
                onClick={() => onCreatePlan(selectedDate, '09:00')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule First Plan
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {dayPlans.map((plan) => {
              return (
                <div
                  key={plan.id}
                  onClick={() => onOpenPlan(plan)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:border-slate-300 group bg-white ${
                    plan.color === 'emerald'
                      ? 'border-emerald-200'
                      : plan.color === 'indigo'
                      ? 'border-indigo-200'
                      : plan.color === 'amber'
                      ? 'border-amber-200'
                      : plan.color === 'rose'
                      ? 'border-rose-200'
                      : 'border-violet-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          plan.color === 'emerald'
                            ? 'bg-emerald-500'
                            : plan.color === 'indigo'
                            ? 'bg-indigo-500'
                            : plan.color === 'amber'
                            ? 'bg-amber-500'
                            : plan.color === 'rose'
                            ? 'bg-rose-500'
                            : 'bg-violet-500'
                        }`}
                      />
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-display">
                        {plan.title}
                      </h3>
                      {plan.timeStart && (
                        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {plan.timeStart} {plan.timeEnd ? `– ${plan.timeEnd}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <img
                          src={plan.lastEditedBy.avatar}
                          alt={plan.lastEditedBy.name}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                        />
                        <span className="text-[11px] font-medium hidden sm:inline">
                          Edited by {plan.lastEditedBy.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {plan.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Render Plan Blocks Snapshot */}
                  <div className="space-y-3 pt-3">
                    {plan.blocks.map((block) => (
                      <div key={block.id} className="text-xs text-slate-700">
                        {block.type === 'text' && (
                          <div
                            className={`p-3 rounded-xl ${
                              block.style === 'callout'
                                ? 'bg-indigo-50/50 border border-indigo-100 text-indigo-950'
                                : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            {block.title && <h5 className="font-bold text-slate-900 mb-1">{block.title}</h5>}
                            <p className="whitespace-pre-line leading-relaxed">{block.content}</p>
                          </div>
                        )}

                        {block.type === 'checklist' && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                            {block.title && <h5 className="font-semibold text-slate-900">{block.title}</h5>}
                            <div className="space-y-1">
                              {block.items.map((it) => (
                                <div key={it.id} className="flex items-center gap-2 text-xs">
                                  <CheckSquare
                                    className={`w-3.5 h-3.5 ${it.done ? 'text-indigo-600' : 'text-slate-300'}`}
                                  />
                                  <span className={it.done ? 'line-through text-slate-400' : 'text-slate-700'}>
                                    {it.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {block.type === 'image' && block.url && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 max-w-sm max-h-48 bg-slate-50">
                            <img src={block.url} alt="block" className="max-h-48 w-auto object-cover rounded-xl" />
                            {block.caption && <p className="p-1.5 text-[11px] text-slate-500 italic">{block.caption}</p>}
                          </div>
                        )}

                        {block.type === 'link' && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800">{block.title}</span>
                            <span className="text-slate-400 text-[11px] truncate">{block.url}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reactions & Comments Count */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      {plan.reactions?.map((r) => (
                        <span
                          key={r.emoji}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold"
                        >
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      {plan.comments?.length > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          {plan.comments.length} comments
                        </span>
                      )}
                      <span className="text-indigo-600 font-semibold group-hover:underline">
                        Open Editor →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
