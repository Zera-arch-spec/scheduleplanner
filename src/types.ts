export type Role = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  color: string;
}

export interface WorkspaceMember {
  userId: string;
  role: Role;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  members: WorkspaceMember[];
}

export type BlockType = 'text' | 'image' | 'video' | 'checklist' | 'link';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  title?: string;
  content: string;
  style?: 'p' | 'h2' | 'h3' | 'callout' | 'quote';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
  aiAnalysis?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  embedUrl?: string;
  platform?: 'youtube' | 'direct' | 'vimeo';
  caption?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
}

export interface LinkBlock extends BaseBlock {
  type: 'link';
  url: string;
  title: string;
  description?: string;
}

export type ContentBlock = TextBlock | ImageBlock | VideoBlock | ChecklistBlock | LinkBlock;

export interface PlanComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface PlanReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Plan {
  id: string;
  workspaceId: string;
  date: string; // YYYY-MM-DD
  timeStart?: string; // HH:mm
  timeEnd?: string; // HH:mm
  title: string;
  tags: string[];
  color: string;
  blocks: ContentBlock[];
  comments: PlanComment[];
  reactions: PlanReaction[];
  createdBy: {
    id: string;
    name: string;
    avatar: string;
    timestamp: string;
  };
  lastEditedBy: {
    id: string;
    name: string;
    avatar: string;
    timestamp: string;
  };
  followedBy: string[]; // user IDs following this plan or date
}

export interface NotificationItem {
  id: string;
  type: 'plan_created' | 'plan_updated' | 'comment_added' | 'reaction_added' | 'date_alert';
  title: string;
  message: string;
  timestamp: string;
  planId?: string;
  date?: string;
  actor: {
    id: string;
    name: string;
    avatar: string;
  };
  read: boolean;
}

export interface CollaboratorPresence {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  activePlanId?: string;
  activeDate?: string;
  lastSeen: number;
  isEditing?: boolean;
  status?: 'viewing' | 'editing';
}
