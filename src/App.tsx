import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plan, Workspace, User, NotificationItem, CollaboratorPresence } from './types';
import { MOCK_USERS } from './data/mockUsers';
import { Header } from './components/Header';
import { CalendarMonthView } from './components/CalendarMonthView';
import { CalendarWeekView } from './components/CalendarWeekView';
import { CalendarDayView } from './components/CalendarDayView';
import { CalendarAgendaView } from './components/CalendarAgendaView';
import { PlanEditorModal } from './components/PlanEditorModal';
import { AudioBriefingModal } from './components/AudioBriefingModal';
import { ExportShareModal } from './components/ExportShareModal';
import { TechArchitectureModal } from './components/TechArchitectureModal';
import { Plus, Volume2, Share2, Layers, AlertCircle } from 'lucide-react';

export default function App() {
  // Current user persona (defaults to Sarah Chen [owner])
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  // Workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Calendar view navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Check URL param if provided e.g. ?date=2026-09-20
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Search & Tag filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  // Modals state
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
  const [isAudioBriefingOpen, setIsAudioBriefingOpen] = useState(false);
  const [isExportShareOpen, setIsExportShareOpen] = useState(false);
  const [isTechSpecsOpen, setIsTechSpecsOpen] = useState(false);

  // Collaborators & Presence
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followedDates, setFollowedDates] = useState<string[]>([]);

  // Feedback banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch initial workspaces
  useEffect(() => {
    fetch('/api/workspaces')
      .then((res) => res.json())
      .then((data: Workspace[]) => {
        if (data && data.length > 0) {
          setWorkspaces(data);
          setCurrentWorkspace(data[0]);
        }
      })
      .catch((err) => console.error('Failed to fetch workspaces:', err));
  }, []);

  // 2. Fetch plans when currentWorkspace changes
  const fetchPlans = useCallback(async (wsId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${wsId}/plans`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      fetchPlans(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchPlans]);

  // 3. Polling for real-time collaborative updates & notifications
  useEffect(() => {
    if (!currentWorkspace) return;

    const interval = setInterval(() => {
      // Sync plans
      fetch(`/api/workspaces/${currentWorkspace.id}/plans`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPlans(data);
        })
        .catch(() => {});

      // Sync notifications
      fetch(`/api/notifications?userId=${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(() => {});

      // Sync active presence
      fetch(`/api/presence?workspaceId=${currentWorkspace.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCollaborators(data);
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [currentWorkspace, currentUser.id]);

  // 4. Heartbeat presence update
  useEffect(() => {
    if (!currentWorkspace) return;

    const sendHeartbeat = () => {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          userId: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          color: currentUser.color || '#4f46e5',
          activePlanId: editingPlan ? editingPlan.id : null,
          status: editingPlan ? 'editing' : 'viewing',
        }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 8000);
    return () => clearInterval(heartbeatInterval);
  }, [currentWorkspace, currentUser, editingPlan]);

  // Initial notifications fetch
  useEffect(() => {
    fetch(`/api/notifications?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, [currentUser.id]);

  // Compute available tags from all plans
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    plans.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [plans]);

  // Navigation handlers
  const handleNavigateMonth = (offset: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };

  const handleNavigateWeek = (offset: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset * 7);
    setCurrentDate(d);
  };

  // Open existing plan
  const handleOpenPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setIsPlanEditorOpen(true);
  };

  // Create new plan
  const handleCreateNewPlan = (dateStr?: string, timeStart?: string) => {
    if (currentUser.role === 'viewer') {
      showToast('Viewer role cannot create plans. Switch to Owner or Editor in the top right.');
      return;
    }

    const targetDate = dateStr || selectedDate || new Date().toISOString().split('T')[0];
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      workspaceId: currentWorkspace?.id || 'ws-1',
      title: 'New Team Plan',
      date: targetDate,
      timeStart: timeStart || '10:00',
      timeEnd: '11:00',
      color: 'indigo',
      tags: ['planning'],
      createdBy: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        timestamp: new Date().toISOString(),
      },
      lastEditedBy: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        timestamp: new Date().toISOString(),
      },
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'text',
          title: 'Plan Overview',
          content: 'Add agenda notes, action items, or project scope here.',
          style: 'p',
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'checklist',
          title: 'Action Checklist',
          items: [
            { id: `item-1`, text: 'Define agenda and goals', done: false },
            { id: `item-2`, text: 'Assign owners and timeline', done: false },
          ],
        },
      ],
      comments: [],
      reactions: [
        { emoji: '👍', count: 0, userIds: [] },
        { emoji: '🚀', count: 0, userIds: [] },
      ],
      followedBy: [],
    };

    setEditingPlan(newPlan);
    setIsPlanEditorOpen(true);
  };

  // Save plan handler (POST or PUT to backend)
  const handleSavePlan = async (updatedPlan: Plan) => {
    if (!currentWorkspace) return;

    // Optimistic local update
    const existingIndex = plans.findIndex((p) => p.id === updatedPlan.id);
    if (existingIndex >= 0) {
      const nextPlans = [...plans];
      nextPlans[existingIndex] = updatedPlan;
      setPlans(nextPlans);
    } else {
      setPlans([...plans, updatedPlan]);
    }

    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
      });
      const saved = await res.json();
      if (res.ok && saved) {
        showToast(`Saved plan "${updatedPlan.title}" successfully.`);
      }
    } catch (err) {
      console.error('Failed to persist plan:', err);
      showToast('Error saving plan to server. Saved locally.');
    }
  };

  // Delete plan handler
  const handleDeletePlan = async (planId: string) => {
    if (!currentWorkspace) return;
    setPlans(plans.filter((p) => p.id !== planId));

    try {
      await fetch(`/api/workspaces/${currentWorkspace.id}/plans/${planId}`, {
        method: 'DELETE',
      });
      showToast('Plan deleted.');
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  // Add comment handler
  const handleAddComment = async (planId: string, text: string) => {
    const commentPayload = {
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: text,
    };

    try {
      const res = await fetch(`/api/plans/${planId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentPayload),
      });
      const newComment = await res.json();

      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, comments: [...p.comments, newComment] } : p))
      );

      if (editingPlan && editingPlan.id === planId) {
        setEditingPlan((prev) => (prev ? { ...prev, comments: [...prev.comments, newComment] } : null));
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  // Toggle reaction handler
  const handleToggleReaction = async (planId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/plans/${planId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, emoji }),
      });
      const data = await res.json();

      if (data.reactions) {
        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, reactions: data.reactions } : p))
        );
        if (editingPlan && editingPlan.id === planId) {
          setEditingPlan((prev) => (prev ? { ...prev, reactions: data.reactions } : null));
        }
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  // Toggle follow date handler
  const handleToggleFollowDate = (dateStr: string) => {
    const isFollowed = followedDates.includes(dateStr);
    const nextFollowed = isFollowed
      ? followedDates.filter((d) => d !== dateStr)
      : [...followedDates, dateStr];
    setFollowedDates(nextFollowed);

    fetch('/api/notifications/follow-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, date: dateStr, follow: !isFollowed }),
    }).catch(() => {});

    showToast(isFollowed ? `Unfollowed alerts for ${dateStr}` : `Following alerts for ${dateStr}!`);
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  // Notification click handler
  const handleSelectPlanFromNotification = (planId?: string, date?: string) => {
    if (date) {
      setSelectedDate(date);
      setCurrentDate(new Date(date + 'T00:00:00'));
    }
    if (planId) {
      const found = plans.find((p) => p.id === planId);
      if (found) {
        setEditingPlan(found);
        setIsPlanEditorOpen(true);
      }
    }
  };

  // Active collaborators inside the currently open plan
  const planActiveCollaborators = useMemo(() => {
    if (!editingPlan) return [];
    return collaborators
      .filter((c) => c.activePlanId === editingPlan.id)
      .map((c) => ({
        name: c.name,
        avatar: c.avatar,
        color: c.color,
        isEditing: c.status === 'editing',
      }));
  }, [collaborators, editingPlan]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-3 fade-in border border-slate-700">
          <AlertCircle className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header component */}
      {currentWorkspace && (
        <Header
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          onSelectWorkspace={(ws) => {
            setCurrentWorkspace(ws);
            fetchPlans(ws.id);
          }}
          currentUser={currentUser}
          onSelectUser={setCurrentUser}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          availableTags={availableTags}
          notifications={notifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onSelectPlanFromNotification={handleSelectPlanFromNotification}
          collaborators={collaborators}
          onOpenTechSpecs={() => setIsTechSpecsOpen(true)}
          onOpenAudioBriefing={() => setIsAudioBriefingOpen(true)}
          onOpenShareExport={() => setIsExportShareOpen(true)}
          onCreateNewPlan={() => handleCreateNewPlan()}
        />
      )}

      {/* Main Workspace Calendar Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Active role banner if in viewer mode */}
        {currentUser.role === 'viewer' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 px-2 py-0.5 rounded-md text-amber-900">
                Viewer Mode Active
              </span>
              <span>
                You are testing the app as <strong>{currentUser.name}</strong>. You can browse plans, listen to audio briefings, comment, and react. Switch persona in the header to edit plans.
              </span>
            </div>
            <button
              onClick={() => setCurrentUser(MOCK_USERS[0])}
              className="px-3 py-1 bg-amber-200 hover:bg-amber-300 font-semibold rounded-lg text-amber-900 transition-colors"
            >
              Switch to Owner
            </button>
          </div>
        )}

        {/* Calendar View Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          {viewMode === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              onNavigateMonth={handleNavigateMonth}
              onSelectDate={(dateStr) => {
                setSelectedDate(dateStr);
                setViewMode('day');
              }}
              selectedDate={selectedDate}
              plans={plans}
              onOpenPlan={handleOpenPlan}
              onCreatePlan={(dateStr) => handleCreateNewPlan(dateStr)}
              currentUser={currentUser}
              followedDates={followedDates}
              onToggleFollowDate={handleToggleFollowDate}
            />
          )}

          {viewMode === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              onNavigateWeek={handleNavigateWeek}
              onSelectDate={(dateStr) => {
                setSelectedDate(dateStr);
              }}
              selectedDate={selectedDate}
              plans={plans}
              onOpenPlan={handleOpenPlan}
              onCreatePlan={(dateStr) => handleCreateNewPlan(dateStr)}
              currentUser={currentUser}
              followedDates={followedDates}
              onToggleFollowDate={handleToggleFollowDate}
            />
          )}

          {viewMode === 'day' && (
            <CalendarDayView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              plans={plans}
              onOpenPlan={handleOpenPlan}
              onCreatePlan={(dateStr, time) => handleCreateNewPlan(dateStr, time)}
              currentUser={currentUser}
              onOpenAudioBriefing={() => setIsAudioBriefingOpen(true)}
              onOpenExportShare={() => setIsExportShareOpen(true)}
              isFollowed={followedDates.includes(selectedDate)}
              onToggleFollowDate={handleToggleFollowDate}
            />
          )}

          {viewMode === 'agenda' && (
            <CalendarAgendaView
              plans={plans}
              onOpenPlan={handleOpenPlan}
              onCreatePlan={(dateStr) => handleCreateNewPlan(dateStr)}
              currentUser={currentUser}
              searchQuery={searchQuery}
              selectedTag={selectedTag}
              selectedAuthor={selectedAuthor}
            />
          )}
        </div>
      </main>

      {/* Printable Schedule view footer (only seen on print or print preview) */}
      <div className="hidden print:block p-8 bg-white border-t border-slate-300 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span>PlanSync Collaborative Schedule Document</span>
          <span>Printed on {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Modals */}
      {isPlanEditorOpen && editingPlan && (
        <PlanEditorModal
          plan={editingPlan}
          isOpen={isPlanEditorOpen}
          onClose={() => {
            setIsPlanEditorOpen(false);
            setEditingPlan(null);
          }}
          currentUser={currentUser}
          onSavePlan={handleSavePlan}
          onDeletePlan={handleDeletePlan}
          onAddComment={handleAddComment}
          onToggleReaction={handleToggleReaction}
          activeCollaborators={planActiveCollaborators}
        />
      )}

      {isAudioBriefingOpen && (
        <AudioBriefingModal
          isOpen={isAudioBriefingOpen}
          onClose={() => setIsAudioBriefingOpen(false)}
          plans={plans}
          selectedDate={selectedDate}
        />
      )}

      {isExportShareOpen && (
        <ExportShareModal
          isOpen={isExportShareOpen}
          onClose={() => setIsExportShareOpen(false)}
          selectedDate={selectedDate}
          plans={plans}
        />
      )}

      {isTechSpecsOpen && (
        <TechArchitectureModal
          isOpen={isTechSpecsOpen}
          onClose={() => setIsTechSpecsOpen(false)}
        />
      )}
    </div>
  );
}
