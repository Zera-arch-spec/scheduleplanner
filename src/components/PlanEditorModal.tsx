import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Video,
  CheckSquare,
  Link as LinkIcon,
  Sparkles,
  Search,
  Volume2,
  MessageSquare,
  Send,
  Lock,
  Clock,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Plan, ContentBlock, User, TextBlock, ImageBlock, VideoBlock, ChecklistBlock, LinkBlock } from '../types';

interface PlanEditorModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSavePlan: (updated: Plan) => void;
  onDeletePlan: (planId: string) => void;
  onAddComment: (planId: string, text: string) => void;
  onToggleReaction: (planId: string, emoji: string) => void;
  activeCollaborators?: { name: string; avatar: string; color: string; isEditing?: boolean }[];
}

export const PlanEditorModal = ({
  plan,
  isOpen,
  onClose,
  currentUser,
  onSavePlan,
  onDeletePlan,
  onAddComment,
  onToggleReaction,
  activeCollaborators = [],
}: PlanEditorModalProps) => {
  if (!isOpen || !plan) return null;

  const isViewer = currentUser.role === 'viewer';
  const [title, setTitle] = useState(plan.title);
  const [date, setDate] = useState(plan.date);
  const [timeStart, setTimeStart] = useState(plan.timeStart || '09:00');
  const [timeEnd, setTimeEnd] = useState(plan.timeEnd || '10:00');
  const [tags, setTags] = useState<string[]>(plan.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [color, setColor] = useState(plan.color || 'indigo');
  const [blocks, setBlocks] = useState<ContentBlock[]>(plan.blocks || []);

  // Comments state
  const [commentInput, setCommentInput] = useState('');

  // AI Assistant Drawer state (Search Grounding & TTS)
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ text: string; sources?: { title: string; uri: string }[] } | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image analysis loading state
  const [analyzingBlockId, setAnalyzingBlockId] = useState<string | null>(null);

  // Save changes handler
  const handleSave = () => {
    if (isViewer) return;
    const updated: Plan = {
      ...plan,
      title: title.trim() || 'Untitled Plan',
      date,
      timeStart,
      timeEnd,
      color,
      tags,
      blocks,
      lastEditedBy: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        timestamp: new Date().toISOString(),
      },
    };
    onSavePlan(updated);
    onClose();
  };

  // Block handlers
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (isViewer) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    setBlocks(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    if (isViewer) return;
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleAddBlock = (type: ContentBlock['type']) => {
    if (isViewer) return;
    const id = `block-${Date.now()}`;
    let newBlock: ContentBlock;
    if (type === 'text') {
      newBlock = { id, type: 'text', title: '', content: '', style: 'p' };
    } else if (type === 'image') {
      newBlock = { id, type: 'image', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80', caption: 'Team brainstorming session' };
    } else if (type === 'video') {
      newBlock = { id, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', platform: 'youtube', caption: '' };
    } else if (type === 'checklist') {
      newBlock = { id, type: 'checklist', title: 'Task Checklist', items: [{ id: `item-${Date.now()}-1`, text: 'Review agenda notes', done: false }] };
    } else {
      newBlock = { id, type: 'link', url: 'https://google.com', title: 'Resource Reference', description: '' };
    }
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    if (isViewer) return;
    setBlocks(blocks.map((b) => (b.id === id ? ({ ...b, ...updates } as ContentBlock) : b)));
  };

  // Checklist items helper
  const toggleChecklistItem = (blockId: string, itemId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId && b.type === 'checklist') {
          return {
            ...b,
            items: b.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
          };
        }
        return b;
      })
    );
  };

  const addChecklistItem = (blockId: string) => {
    if (isViewer) return;
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId && b.type === 'checklist') {
          return {
            ...b,
            items: [...b.items, { id: `item-${Date.now()}`, text: '', done: false }],
          };
        }
        return b;
      })
    );
  };

  // Image Upload helper (supports file input to data URL)
  const handleImageUpload = (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateBlock(blockId, { url: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // Analyze Image with Gemini Vision (gemini-3.1-pro-preview)
  const handleAnalyzeImage = async (blockId: string, imageUrl: string) => {
    setAnalyzingBlockId(blockId);
    try {
      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageUrl,
          prompt: 'Analyze this schedule photo, whiteboard diagram, or visual document. Summarize the key schedule milestones, agenda points, and actionable tasks clearly.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze image');
      updateBlock(blockId, { aiAnalysis: data.analysis });
    } catch (err: any) {
      alert(`Image Analysis Error: ${err.message}`);
    } finally {
      setAnalyzingBlockId(null);
    }
  };

  // Video URL helper to convert standard YouTube watch link to embed format
  const handleVideoUrlChange = (blockId: string, rawUrl: string) => {
    if (isViewer) return;
    let embedUrl = rawUrl;
    let platform: 'youtube' | 'direct' | 'vimeo' = 'direct';

    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      platform = 'youtube';
      const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) {
        embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}`;
      }
    } else if (rawUrl.includes('vimeo.com')) {
      platform = 'vimeo';
      const match = rawUrl.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        embedUrl = `https://player.vimeo.com/video/${match[1]}`;
      }
    }

    updateBlock(blockId, { url: rawUrl, embedUrl, platform });
  };

  // Gemini Google Search Grounding Assistant
  const handleSearchAssistant = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/gemini/search-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          planContext: `${title} on ${date}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query assistant');
      setAiResult({ text: data.text, sources: data.sources });
    } catch (err: any) {
      alert(`AI Assistant Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Gemini TTS for this plan
  const handleReadPlanAloud = async () => {
    setTtsLoading(true);
    try {
      const summary = `Schedule Plan for ${title} on ${date}, from ${timeStart} to ${timeEnd}. ${blocks
        .filter((b) => b.type === 'text')
        .map((b: any) => b.content)
        .join('. ')}`;

      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary, voiceName: 'Kore' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to read plan aloud');
      setAudioUrl(data.audioUrl);
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
      }
    } catch (err: any) {
      alert(`TTS Error: ${err.message}`);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(plan.id, commentInput.trim());
    setCommentInput('');
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div id="plan-editor-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm ${
                color === 'emerald'
                  ? 'bg-emerald-500'
                  : color === 'indigo'
                  ? 'bg-indigo-500'
                  : color === 'amber'
                  ? 'bg-amber-500'
                  : color === 'rose'
                  ? 'bg-rose-500'
                  : 'bg-violet-500'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-display">
                  {isViewer ? 'Plan Details (View-Only)' : 'Collaborative Plan Editor'}
                </h2>
                {isViewer && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Viewer
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Created by {plan.createdBy.name}</span>
                <span>•</span>
                <span>Last edited by {plan.lastEditedBy.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active collaborators avatar group */}
            {activeCollaborators.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-slate-500 font-medium">Viewing:</span>
                <div className="flex -space-x-1.5">
                  {activeCollaborators.map((c, i) => (
                    <img
                      key={i}
                      src={c.avatar}
                      alt={c.name}
                      title={`${c.name} ${c.isEditing ? '(editing now)' : '(viewing)'}`}
                      className="w-5 h-5 rounded-full ring-1 ring-white object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Read Aloud TTS button */}
            <button
              id="read-plan-aloud-btn"
              onClick={handleReadPlanAloud}
              disabled={ttsLoading}
              className="p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Read plan aloud with Gemini TTS"
            >
              {ttsLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
              <span className="hidden md:inline">Listen (TTS)</span>
            </button>

            {/* AI Assistant drawer toggle */}
            <button
              id="ai-assistant-toggle-btn"
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium ${
                isAiOpen ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
              title="Open Gemini AI Assistant with Search Grounding"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">AI Research</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden Audio Player for plan readout */}
        <audio ref={audioRef} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left / Center: Editor Canvas */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Title & Metadata Inputs */}
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  disabled={isViewer}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Plan title (e.g., Team Sprint Review)"
                  className="w-full text-xl font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none pb-1 transition-all font-display disabled:bg-transparent"
                />
              </div>

              {/* Schedule times & color picker */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="date"
                    disabled={isViewer}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent focus:outline-none font-medium text-slate-700"
                  />
                  <input
                    type="time"
                    disabled={isViewer}
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="bg-transparent focus:outline-none font-medium text-slate-700 border-l border-slate-200 pl-2"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    disabled={isViewer}
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="bg-transparent focus:outline-none font-medium text-slate-700"
                  />
                </div>

                {/* Color Selector */}
                {!isViewer && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                    {[
                      { id: 'indigo', bg: 'bg-indigo-500' },
                      { id: 'emerald', bg: 'bg-emerald-500' },
                      { id: 'amber', bg: 'bg-amber-500' },
                      { id: 'rose', bg: 'bg-rose-500' },
                      { id: 'violet', bg: 'bg-violet-500' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`w-4 h-4 rounded-full ${c.bg} transition-transform ${
                          color === c.id ? 'scale-125 ring-2 ring-slate-400' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tags Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    #{tag}
                    {!isViewer && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {!isViewer && (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="+ tag"
                      className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-slate-600 focus:outline-none focus:border-indigo-400 w-20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content Blocks Canvas */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rich Content Blocks ({blocks.length})
                </span>
                {!isViewer && (
                  <div className="text-[11px] text-slate-400">
                    Use Up/Down arrows to reorder blocks within this plan
                  </div>
                )}
              </div>

              {blocks.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 p-6">
                  <Type className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No content blocks yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Add notes, images with AI analysis, video embeds, checklists, or links below.
                  </p>
                </div>
              ) : (
                blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-shadow shadow-xs relative group"
                  >
                    {/* Block Action Controls */}
                    {!isViewer && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 bg-white/90 p-1 rounded-lg border border-slate-200 shadow-xs z-10">
                        <button
                          onClick={() => handleMoveBlock(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveBlock(index, 'down')}
                          disabled={index === blocks.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 ml-1"
                          title="Delete block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* 1. Text Block */}
                    {block.type === 'text' && (
                      <div className="space-y-2 pr-16">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4 text-indigo-500 shrink-0" />
                          <input
                            type="text"
                            disabled={isViewer}
                            value={block.title || ''}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Section Title (optional)"
                            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none w-full border-b border-transparent focus:border-indigo-300"
                          />
                        </div>
                        <textarea
                          disabled={isViewer}
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Write plan details, meeting agenda, or notes here..."
                          rows={3}
                          className={`w-full text-xs text-slate-700 p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-y ${
                            block.style === 'callout'
                              ? 'bg-indigo-50/40 border-indigo-200 font-medium'
                              : 'bg-slate-50 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}

                    {/* 2. Image Block */}
                    {block.type === 'image' && (
                      <div className="space-y-3 pr-16">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800">Image Asset</span>
                        </div>
                        {block.url && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 max-h-64 bg-slate-900/5 flex items-center justify-center">
                            <img
                              src={block.url}
                              alt={block.alt || 'Plan image'}
                              className="max-h-64 w-auto object-contain rounded-lg"
                            />
                          </div>
                        )}
                        {!isViewer && (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <input
                              type="text"
                              value={block.url}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              placeholder="Image URL or paste data..."
                              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                            />
                            <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer transition-colors shrink-0">
                              Upload File
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(block.id, e)}
                                className="hidden"
                              />
                            </label>
                            {/* Gemini Vision Analyze Button */}
                            <button
                              id={`analyze-image-btn-${block.id}`}
                              type="button"
                              onClick={() => handleAnalyzeImage(block.id, block.url)}
                              disabled={analyzingBlockId === block.id || !block.url}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                            >
                              {analyzingBlockId === block.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Analyze with Gemini
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          disabled={isViewer}
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Image caption or notes..."
                          className="w-full text-[11px] text-slate-500 italic bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none"
                        />
                        {/* Render Gemini AI Vision Result */}
                        {block.aiAnalysis && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Gemini Vision Analysis:</span>
                            </div>
                            <p className="whitespace-pre-line text-emerald-950 font-normal leading-relaxed">
                              {block.aiAnalysis}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Video Block */}
                    {block.type === 'video' && (
                      <div className="space-y-3 pr-16">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800">Video Embed</span>
                        </div>
                        {block.embedUrl ? (
                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black">
                            <iframe
                              src={block.embedUrl}
                              title="Video player"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                            Enter a YouTube, Vimeo, or video link below to embed.
                          </div>
                        )}
                        {!isViewer && (
                          <input
                            type="text"
                            value={block.url}
                            onChange={(e) => handleVideoUrlChange(block.id, e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                          />
                        )}
                        <input
                          type="text"
                          disabled={isViewer}
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Video description or timestamp notes..."
                          className="w-full text-[11px] text-slate-500 italic bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* 4. Checklist Block */}
                    {block.type === 'checklist' && (
                      <div className="space-y-3 pr-16">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                          <input
                            type="text"
                            disabled={isViewer}
                            value={block.title || ''}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Checklist title"
                            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none w-full border-b border-transparent focus:border-blue-300"
                          />
                        </div>
                        <div className="space-y-2 pl-2">
                          {block.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => toggleChecklistItem(block.id, item.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <input
                                type="text"
                                disabled={isViewer}
                                value={item.text}
                                onChange={(e) => {
                                  const newItems = block.items.map((it) =>
                                    it.id === item.id ? { ...it, text: e.target.value } : it
                                  );
                                  updateBlock(block.id, { items: newItems });
                                }}
                                placeholder="Task description..."
                                className={`text-xs flex-1 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 ${
                                  item.done ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}
                              />
                            </div>
                          ))}
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => addChecklistItem(block.id)}
                              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1"
                            >
                              <Plus className="w-3 h-3" /> Add item
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. Link Block */}
                    {block.type === 'link' && (
                      <div className="space-y-2 pr-16">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800">Resource Link</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            disabled={isViewer}
                            value={block.title}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Link title (e.g. Design Specs)"
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              disabled={isViewer}
                              value={block.url}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              placeholder="https://..."
                              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none font-mono"
                            />
                            {block.url && (
                              <a
                                href={block.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Quick Add Block Toolbar */}
              {!isViewer && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">Add Content Block:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      id="add-text-block-btn"
                      type="button"
                      onClick={() => handleAddBlock('text')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Type className="w-3.5 h-3.5 text-indigo-500" /> + Text
                    </button>
                    <button
                      id="add-image-block-btn"
                      type="button"
                      onClick={() => handleAddBlock('image')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> + Image
                    </button>
                    <button
                      id="add-video-block-btn"
                      type="button"
                      onClick={() => handleAddBlock('video')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5 text-rose-500" /> + Video
                    </button>
                    <button
                      id="add-checklist-block-btn"
                      type="button"
                      onClick={() => handleAddBlock('checklist')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> + Checklist
                    </button>
                    <button
                      id="add-link-block-btn"
                      type="button"
                      onClick={() => handleAddBlock('link')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-amber-500" /> + Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reactions & Comments Section */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Reactions Bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Reactions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['👍', '❤️', '🚀', '👀', '🎉'].map((emoji) => {
                    const reaction = plan.reactions?.find((r) => r.emoji === emoji);
                    const hasReacted = reaction?.userIds?.includes(currentUser.id);
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onToggleReaction(plan.id, emoji)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all ${
                          hasReacted
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{emoji}</span>
                        {reaction && reaction.count > 0 && (
                          <span className="font-semibold text-[11px]">{reaction.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion & Comments ({plan.comments?.length || 0})</span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {plan.comments?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No comments yet. Leave the first remark!</p>
                  ) : (
                    plan.comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <img
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{comment.authorName}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment or question for teammates..."
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    id="submit-comment-btn"
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right: Gemini AI Research Assistant Drawer */}
          {isAiOpen && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50/70 p-5 flex flex-col space-y-4 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-display">Schedule AI Assistant</h4>
                    <span className="text-[10px] text-slate-500">Grounded via Google Search (gemini-3.5-flash)</span>
                  </div>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAssistant()}
                    placeholder="Search venue info, agenda ideas, time estimates..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  id="search-grounding-btn"
                  onClick={handleSearchAssistant}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Search Live Google Data
                </button>
              </div>

              {/* AI Research Result */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {aiResult && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                    <span className="font-semibold text-slate-900 block text-[11px] text-indigo-600">
                      Grounded Recommendation:
                    </span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{aiResult.text}</p>

                    {/* Grounded Web Sources with Links */}
                    {aiResult.sources && aiResult.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Verified Web Sources:
                        </span>
                        <div className="space-y-1">
                          {aiResult.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline truncate"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{src.title || src.uri}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {!isViewer && (
              <button
                id="delete-plan-btn"
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this plan? This action will synchronize across all workspaces.')) {
                    onDeletePlan(plan.id);
                    onClose();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Plan
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            {!isViewer && (
              <button
                id="save-plan-btn"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
