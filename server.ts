import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy Gemini client helper
let genAIInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

// Convert 24kHz 16-bit mono PCM to valid WAV buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-Memory Seed Data for Collaborative Workspaces & Schedules
const WORKSPACES = [
  {
    id: 'ws-1',
    name: 'Product & Engineering Sprint',
    description: 'Shared sprint schedule, release roadmap, and tech sync plans.',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    members: [
      { userId: 'u-1', role: 'owner' },
      { userId: 'u-2', role: 'editor' },
      { userId: 'u-3', role: 'editor' },
      { userId: 'u-4', role: 'viewer' },
    ],
  },
  {
    id: 'ws-2',
    name: 'Marketing & Event Launch',
    description: 'Keynotes, media campaigns, and launch countdown milestones.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    members: [
      { userId: 'u-1', role: 'editor' },
      { userId: 'u-2', role: 'owner' },
      { userId: 'u-3', role: 'viewer' },
    ],
  },
];

// Today reference string
const today = new Date().toISOString().split('T')[0];
const getRelativeDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

let PLANS: any[] = [
  {
    id: 'plan-1',
    workspaceId: 'ws-1',
    date: today,
    timeStart: '09:30',
    timeEnd: '11:00',
    title: 'Sprint Planning & Architecture Sync',
    tags: ['Engineering', 'High Priority', 'Sprint 42'],
    color: 'emerald',
    createdBy: {
      id: 'u-1',
      name: 'Sarah Chen (Lead)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    lastEditedBy: {
      id: 'u-2',
      name: 'Alex Rivera (Dev)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 60000 * 15).toISOString(),
    },
    followedBy: ['u-1', 'u-2', 'u-3'],
    blocks: [
      {
        id: 'b-1',
        type: 'text',
        title: 'Meeting Objective',
        content: 'Align on Q3 real-time synchronization architecture, collaborative lock strategy, and Gemini search integration endpoints.',
        style: 'callout',
      },
      {
        id: 'b-2',
        type: 'checklist',
        title: 'Action Items & Deliverables',
        items: [
          { id: 'c-1', text: 'Benchmark WebSocket vs SSE latency in production container', done: true },
          { id: 'c-2', text: 'Implement optimistic UI updates for plan drag-and-drop', done: true },
          { id: 'c-3', text: 'Finalize Cloud Storage presigned URL media upload pipeline', done: false },
          { id: 'c-4', text: 'Conduct team code review on Gemini TTS integration', done: false },
        ],
      },
      {
        id: 'b-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
        caption: 'Architecture whiteboard draft: Collaborative state synchronizer with conflict resolution.',
        alt: 'System architecture sketch',
      },
      {
        id: 'b-4',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        platform: 'youtube',
        caption: 'Tech Talk: Designing Real-time Collaborative Systems with WebSockets.',
      },
      {
        id: 'b-5',
        type: 'link',
        url: 'https://github.com/google-gemini',
        title: 'Google GenAI SDK Documentation',
        description: 'Official developer guidelines for @google/genai and multimodal APIs.',
      },
    ],
    comments: [
      {
        id: 'comm-1',
        authorId: 'u-3',
        authorName: 'Marcus Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        content: 'I verified the SSE connection on mobile browsers. Smooth fallback is in place!',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'comm-2',
        authorId: 'u-1',
        authorName: 'Sarah Chen (Lead)',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Awesome. Remember to run the Gemini TTS preview for daily briefing audio.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    reactions: [
      { emoji: '🚀', count: 3, userIds: ['u-1', 'u-2', 'u-3'] },
      { emoji: '👍', count: 2, userIds: ['u-1', 'u-2'] },
      { emoji: '❤️', count: 1, userIds: ['u-3'] },
    ],
  },
  {
    id: 'plan-2',
    workspaceId: 'ws-1',
    date: today,
    timeStart: '14:00',
    timeEnd: '15:30',
    title: 'Customer Experience Review & Design Polish',
    tags: ['Design', 'UI/UX', 'Review'],
    color: 'indigo',
    createdBy: {
      id: 'u-2',
      name: 'Alex Rivera (Dev)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    lastEditedBy: {
      id: 'u-2',
      name: 'Alex Rivera (Dev)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    followedBy: ['u-1', 'u-2'],
    blocks: [
      {
        id: 'b-201',
        type: 'text',
        title: 'Design Critique Points',
        content: 'Review contrast ratios, mobile touch target sizes (minimum 44px), and seamless block reordering animations with Motion.',
        style: 'p',
      },
      {
        id: 'b-202',
        type: 'checklist',
        title: 'Review Checklist',
        items: [
          { id: 'c-201', text: 'Ensure proper WCAG AA contrast on badges', done: true },
          { id: 'c-202', text: 'Verify block drag-and-drop handles on mobile viewports', done: false },
          { id: 'c-203', text: 'Check printable day schedule layout styling', done: false },
        ],
      },
    ],
    comments: [],
    reactions: [
      { emoji: '🎨', count: 2, userIds: ['u-1', 'u-2'] },
    ],
  },
  {
    id: 'plan-3',
    workspaceId: 'ws-1',
    date: getRelativeDate(1),
    timeStart: '10:00',
    timeEnd: '12:00',
    title: 'Collaborative Media Pipeline Testing',
    tags: ['Media', 'Cloud Storage'],
    color: 'amber',
    createdBy: {
      id: 'u-1',
      name: 'Sarah Chen (Lead)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    lastEditedBy: {
      id: 'u-3',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
    },
    followedBy: ['u-1'],
    blocks: [
      {
        id: 'b-301',
        type: 'text',
        title: 'Test Cases for Media Embeds',
        content: 'Test video block embedding with YouTube and direct MP4 playback, plus image paste from clipboard with instant Gemini image analysis.',
        style: 'p',
      },
    ],
    comments: [],
    reactions: [],
  },
  {
    id: 'plan-4',
    workspaceId: 'ws-1',
    date: getRelativeDate(3),
    timeStart: '13:00',
    timeEnd: '14:30',
    title: 'Cloud Run Deployment & Load Readiness',
    tags: ['DevOps', 'Milestone'],
    color: 'rose',
    createdBy: {
      id: 'u-3',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    lastEditedBy: {
      id: 'u-3',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    followedBy: ['u-1', 'u-3'],
    blocks: [
      {
        id: 'b-401',
        type: 'text',
        title: 'Release Criteria',
        content: 'Check container build flags, port 3000 binding, and environment secret injection.',
        style: 'callout',
      },
    ],
    comments: [],
    reactions: [{ emoji: '🚀', count: 1, userIds: ['u-3'] }],
  },
  {
    id: 'plan-5',
    workspaceId: 'ws-1',
    date: getRelativeDate(-2),
    timeStart: '11:00',
    timeEnd: '12:30',
    title: 'Retrospective: Last Cycle Key Learnings',
    tags: ['Agile', 'Team'],
    color: 'violet',
    createdBy: {
      id: 'u-1',
      name: 'Sarah Chen (Lead)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    lastEditedBy: {
      id: 'u-1',
      name: 'Sarah Chen (Lead)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    followedBy: ['u-1', 'u-2'],
    blocks: [
      {
        id: 'b-501',
        type: 'text',
        title: 'Summary',
        content: 'Achieved 99.9% uptime on collaborative synchronization. Real-time typing awareness reduced double edits by 80%.',
        style: 'p',
      },
    ],
    comments: [],
    reactions: [{ emoji: '🎉', count: 4, userIds: ['u-1', 'u-2', 'u-3', 'u-4'] }],
  }
];

let NOTIFICATIONS: any[] = [
  {
    id: 'notif-1',
    type: 'plan_updated',
    title: 'Plan Updated',
    message: 'Alex Rivera updated "Sprint Planning & Architecture Sync" action items.',
    timestamp: new Date(Date.now() - 60000 * 15).toISOString(),
    planId: 'plan-1',
    date: today,
    actor: {
      id: 'u-2',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    read: false,
  },
  {
    id: 'notif-2',
    type: 'comment_added',
    title: 'New Comment',
    message: 'Sarah Chen commented on the sprint architecture plan.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    planId: 'plan-1',
    date: today,
    actor: {
      id: 'u-1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    read: false,
  },
  {
    id: 'notif-3',
    type: 'date_alert',
    title: 'Date Followed Update',
    message: 'A new plan "Collaborative Media Pipeline Testing" was scheduled for tomorrow.',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    planId: 'plan-3',
    date: getRelativeDate(1),
    actor: {
      id: 'u-3',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
    read: true,
  }
];

// Active collaborator presence tracker
const PRESENCE_MAP = new Map<string, {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  activePlanId?: string;
  activeDate?: string;
  lastSeen: number;
  isEditing?: boolean;
}>();

// Seed initial presence for collaborative feeling
PRESENCE_MAP.set('u-2', {
  userId: 'u-2',
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  color: '#3b82f6',
  activePlanId: 'plan-1',
  activeDate: today,
  lastSeen: Date.now(),
  isEditing: true,
});
PRESENCE_MAP.set('u-3', {
  userId: 'u-3',
  name: 'Marcus Vance',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  color: '#10b981',
  activeDate: today,
  lastSeen: Date.now(),
  isEditing: false,
});

// Broadcast helper for notifications
function createNotification(notif: any) {
  NOTIFICATIONS.unshift(notif);
  if (NOTIFICATIONS.length > 50) {
    NOTIFICATIONS = NOTIFICATIONS.slice(0, 50);
  }
}

// ---------------- REST API ROUTES ----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Workspaces
app.get('/api/workspaces', (req: Request, res: Response) => {
  res.json(WORKSPACES);
});

// Plans for workspace
app.get('/api/workspaces/:workspaceId/plans', (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const filtered = PLANS.filter((p) => p.workspaceId === workspaceId);
  res.json(filtered);
});

// Create plan
app.post('/api/workspaces/:workspaceId/plans', (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const newPlan = {
    id: `plan-${Date.now()}`,
    workspaceId,
    tags: [],
    blocks: [],
    comments: [],
    reactions: [],
    followedBy: [req.body.createdBy?.id || 'u-1'],
    ...req.body,
  };
  PLANS.push(newPlan);

  // Trigger notification to followers
  createNotification({
    id: `notif-${Date.now()}`,
    type: 'plan_created',
    title: 'New Plan Added',
    message: `${newPlan.createdBy?.name || 'A teammate'} created "${newPlan.title}" on ${newPlan.date}.`,
    timestamp: new Date().toISOString(),
    planId: newPlan.id,
    date: newPlan.date,
    actor: newPlan.createdBy || { id: 'u-1', name: 'Teammate', avatar: '' },
    read: false,
  });

  res.status(201).json(newPlan);
});

// Update plan
app.put('/api/workspaces/:workspaceId/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = PLANS.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const existing = PLANS[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    workspaceId: existing.workspaceId,
    lastEditedBy: {
      ...req.body.lastEditedBy,
      timestamp: new Date().toISOString(),
    },
  };
  PLANS[index] = updated;

  createNotification({
    id: `notif-${Date.now()}`,
    type: 'plan_updated',
    title: 'Plan Updated',
    message: `${updated.lastEditedBy?.name || 'A teammate'} edited "${updated.title}".`,
    timestamp: new Date().toISOString(),
    planId: updated.id,
    date: updated.date,
    actor: updated.lastEditedBy || { id: 'u-1', name: 'Teammate', avatar: '' },
    read: false,
  });

  res.json(updated);
});

// Delete plan
app.delete('/api/workspaces/:workspaceId/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = PLANS.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  const deleted = PLANS.splice(index, 1)[0];
  res.json({ success: true, deletedPlanId: deleted.id });
});

// Add comment to plan
app.post('/api/workspaces/:workspaceId/plans/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const newComment = {
    id: `comm-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  plan.comments.push(newComment);

  createNotification({
    id: `notif-${Date.now()}`,
    type: 'comment_added',
    title: 'New Comment',
    message: `${newComment.authorName} commented: "${newComment.content.slice(0, 40)}..."`,
    timestamp: new Date().toISOString(),
    planId: plan.id,
    date: plan.date,
    actor: {
      id: newComment.authorId,
      name: newComment.authorName,
      avatar: newComment.authorAvatar,
    },
    read: false,
  });

  res.status(201).json(newComment);
});

// Toggle reaction on plan
app.post('/api/workspaces/:workspaceId/plans/:id/reactions', (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji, userId } = req.body;
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  let reaction = plan.reactions.find((r: any) => r.emoji === emoji);
  if (!reaction) {
    reaction = { emoji, count: 1, userIds: [userId] };
    plan.reactions.push(reaction);
  } else {
    const userIndex = reaction.userIds.indexOf(userId);
    if (userIndex > -1) {
      reaction.userIds.splice(userIndex, 1);
      reaction.count -= 1;
    } else {
      reaction.userIds.push(userId);
      reaction.count += 1;
    }
  }

  // Remove empty reactions
  plan.reactions = plan.reactions.filter((r: any) => r.count > 0);
  res.json(plan.reactions);
});

// Toggle follow date/plan
app.post('/api/workspaces/:workspaceId/plans/:id/follow', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  if (!plan.followedBy) plan.followedBy = [];
  const idx = plan.followedBy.indexOf(userId);
  let isFollowing = false;
  if (idx > -1) {
    plan.followedBy.splice(idx, 1);
    isFollowing = false;
  } else {
    plan.followedBy.push(userId);
    isFollowing = true;
  }
  res.json({ isFollowing, followedBy: plan.followedBy });
});

// Presence & Collaborators
app.get('/api/workspaces/:workspaceId/presence', (req: Request, res: Response) => {
  const now = Date.now();
  // Keep collaborators active in the last 2 minutes
  const active: any[] = [];
  PRESENCE_MAP.forEach((val) => {
    if (now - val.lastSeen < 120000) {
      active.push(val);
    }
  });
  res.json(active);
});

app.post('/api/workspaces/:workspaceId/presence', (req: Request, res: Response) => {
  const { userId, name, avatar, color, activePlanId, activeDate, isEditing } = req.body;
  if (userId) {
    PRESENCE_MAP.set(userId, {
      userId,
      name,
      avatar,
      color,
      activePlanId,
      activeDate,
      lastSeen: Date.now(),
      isEditing: !!isEditing,
    });
  }
  res.json({ success: true });
});

// Notifications
app.get('/api/workspaces/:workspaceId/notifications', (req: Request, res: Response) => {
  res.json(NOTIFICATIONS);
});

app.post('/api/workspaces/:workspaceId/notifications/read', (req: Request, res: Response) => {
  NOTIFICATIONS.forEach((n) => (n.read = true));
  res.json({ success: true });
});

// Simulated cloud storage media upload
app.post('/api/upload/image', (req: Request, res: Response) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'dataUrl is required' });
  }
  // In production, this generates a presigned GCS / S3 PUT URL.
  // In development, return the stored URI.
  res.json({
    url: dataUrl,
    filename: filename || 'uploaded_image.png',
    storageProvider: 'Cloud Storage (Presigned URL Architecture)',
  });
});

// ---------------- GEMINI AI ENDPOINTS ----------------

// 1. Convert Text to Speech (TTS) using `gemini-3.1-flash-tts-preview`
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required for TTS.' });
    }

    const ai = getGeminiClient();
    const prompt = `Read the following schedule or plan briefing clearly, warmly, and professionally:\n\n${text.slice(0, 1200)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      return res.status(502).json({ error: 'No audio stream returned from Gemini TTS preview.' });
    }

    const rawPcmBase64 = audioPart.inlineData.data;
    const pcmBuffer = Buffer.from(rawPcmBase64, 'base64');
    // Convert 24kHz raw PCM to playable standard WAV format
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString('base64');

    res.json({
      audioUrl: `data:audio/wav;base64,${wavBase64}`,
      durationEstimateSeconds: Math.round((pcmBuffer.length / 48000) * 10) / 10,
      model: 'gemini-3.1-flash-tts-preview',
    });
  } catch (err: any) {
    console.error('Gemini TTS Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate speech audio.' });
  }
});

// 2. Google Search Grounding using `gemini-3.5-flash` with `{ googleSearch: {} }`
app.post('/api/gemini/search-assistant', async (req: Request, res: Response) => {
  try {
    const { query, planContext } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required for Search Grounding.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are an expert collaborative schedule planning assistant. Provide accurate, current, grounded scheduling recommendations, venue details, agenda ideas, or travel/time estimates. Extract real-world data where relevant.`;
    const userPrompt = `Context of plan: ${planContext || 'General Schedule'}\n\nUser request: ${query}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || 'No response generated.';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .filter((c: any) => c.web && c.web.uri)
      .map((c: any) => ({
        title: c.web.title || c.web.uri,
        uri: c.web.uri,
      }));

    res.json({
      text: responseText,
      sources: webSources,
      model: 'gemini-3.5-flash',
    });
  } catch (err: any) {
    console.error('Gemini Search Grounding Error:', err);
    res.status(500).json({ error: err.message || 'Failed to query search-grounded assistant.' });
  }
});

// 3. Analyze Images using `gemini-3.1-pro-preview`
app.post('/api/gemini/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt = 'Analyze this schedule, whiteboard, or document. Extract key events, dates, action items, or bullet points that can be turned into calendar blocks.' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required for image understanding.' });
    }

    // Clean base64 string if data URL prefix was included
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const ai = getGeminiClient();
    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts: [imagePart, textPart] },
    });

    const analysisText = response.text || 'No analysis could be completed.';

    res.json({
      analysis: analysisText,
      model: 'gemini-3.1-pro-preview',
    });
  } catch (err: any) {
    console.error('Gemini Image Analysis Error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze image with gemini-3.1-pro-preview.' });
  }
});

// ---------------- VITE MIDDLEWARE / STATIC ASSETS ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Collaborative Schedule Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
