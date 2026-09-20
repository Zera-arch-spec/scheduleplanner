import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Bell,
  Search,
  Users,
  Volume2,
  Share2,
  Layers,
  Check,
  ChevronDown,
  Lock,
  Plus
} from 'lucide-react';
import { User, Workspace, NotificationItem, CollaboratorPresence } from '../types';
import { MOCK_USERS } from '../data/mockUsers';
import { NotificationsDropdown } from './NotificationsDropdown';

interface HeaderProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (ws: Workspace) => void;
  currentUser: User;
  onSelectUser: (u: User) => void;
  viewMode: 'month' | 'week' | 'day' | 'agenda';
  onChangeViewMode: (mode: 'month' | 'week' | 'day' | 'agenda') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string | null;
  onSelectTag: (t: string | null) => void;
  availableTags: string[];
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  onSelectPlanFromNotification: (planId?: string, date?: string) => void;
  collaborators: CollaboratorPresence[];
  onOpenTechSpecs: () => void;
  onOpenAudioBriefing: () => void;
  onOpenShareExport: () => void;
  onCreateNewPlan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  currentUser,
  onSelectUser,
  viewMode,
  onChangeViewMode,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  availableTags,
  notifications,
  onMarkAllNotificationsRead,
  onSelectPlanFromNotification,
  collaborators,
  onOpenTechSpecs,
  onOpenAudioBriefing,
  onOpenShareExport,
  onCreateNewPlan,
}) => {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Top Level Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Workspace Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20 font-bold">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-slate-900 font-display leading-tight">PlanSync</h1>
                <p className="text-[10px] text-slate-500 font-medium">Collaborative Scheduling</p>
              </div>
            </div>

            {/* Workspace Switcher dropdown */}
            <div className="relative">
              <button
                id="workspace-switcher-btn"
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 text-xs font-semibold text-slate-800 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="truncate max-w-[140px] sm:max-w-[180px]">{currentWorkspace.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isWorkspaceMenuOpen && (
                <div className="absolute left-0 top-11 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Workspace
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                        ws.id === currentWorkspace.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-medium">{ws.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{ws.description}</div>
                      </div>
                      {ws.id === currentWorkspace.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Collaborators Presence indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-600">Online ({collaborators.length}):</span>
            <div className="flex -space-x-2 overflow-hidden">
              {collaborators.map((c) => (
                <img
                  key={c.userId}
                  src={c.avatar}
                  alt={c.name}
                  title={`${c.name} • Active on workspace`}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                />
              ))}
            </div>
          </div>

          {/* Right Action Icons & User Persona Switcher */}
          <div className="flex items-center gap-2">
            {/* Tech Specs Button */}
            <button
              id="header-tech-specs-btn"
              onClick={onOpenTechSpecs}
              className="p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="View Suggested Tech Stack, Database Schema & API Endpoints"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="hidden xl:inline">Tech Specs & Schema</span>
            </button>

            {/* Audio Daily Briefing (TTS) */}
            <button
              id="header-audio-briefing-btn"
              onClick={onOpenAudioBriefing}
              className="p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Daily Audio Schedule Briefing via Gemini TTS"
            >
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Daily TTS Briefing</span>
            </button>

            {/* Share / PDF Export */}
            <button
              id="header-share-btn"
              onClick={onOpenShareExport}
              className="p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Export Day Schedule as Link or PDF"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Share</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => setIsNotifsOpen(!isNotifsOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors relative"
                title="Activity Feed & Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              <NotificationsDropdown
                notifications={notifications}
                isOpen={isNotifsOpen}
                onClose={() => setIsNotifsOpen(false)}
                onMarkAllRead={onMarkAllNotificationsRead}
                onSelectPlan={onSelectPlanFromNotification}
              />
            </div>

            {/* User Profile / Role Switcher */}
            <div className="relative border-l border-slate-200 pl-2">
              <button
                id="user-persona-switcher-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                title="Switch active user to test collaborative roles (Owner, Editor, Viewer)"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <span className="font-bold text-slate-900 block truncate max-w-[90px]">{currentUser.name}</span>
                  <span className="text-[10px] text-indigo-600 uppercase font-bold">{currentUser.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active User (RBAC Test)
                  </div>
                  {MOCK_USERS.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{u.role} role</div>
                        </div>
                      </div>
                      {u.id === currentUser.id && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                  <div className="p-2 border-t border-slate-100 text-[10px] text-slate-400 mt-1">
                    Select <strong>Maya Lin (Viewer)</strong> to test read-only collaborative permissions.
                  </div>
                </div>
              )}
            </div>

            {/* Quick New Plan Button */}
            {currentUser.role !== 'viewer' && (
              <button
                id="header-create-plan-btn"
                onClick={onCreateNewPlan}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Subheader: Views & Search Filters */}
        <div className="py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1">
            {[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
              { id: 'day', label: 'Day' },
              { id: 'agenda', label: 'Agenda & Search' },
            ].map((v) => (
              <button
                key={v.id}
                id={`view-mode-${v.id}-btn`}
                onClick={() => onChangeViewMode(v.id as any)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === v.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Search Input & Tags */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search plans, authors, tags..."
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Tag Filter pills */}
            {availableTags.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto max-w-[200px] no-scrollbar">
                {selectedTag && (
                  <button
                    onClick={() => onSelectTag(null)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white"
                  >
                    Clear #{selectedTag}
                  </button>
                )}
                {availableTags.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                      selectedTag === tag
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
