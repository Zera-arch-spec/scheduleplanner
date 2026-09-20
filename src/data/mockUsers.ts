import { User } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@team.internal',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'owner',
    color: '#8b5cf6',
  },
  {
    id: 'u-2',
    name: 'Alex Rivera',
    email: 'alex.rivera@team.internal',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'editor',
    color: '#3b82f6',
  },
  {
    id: 'u-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@team.internal',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    role: 'editor',
    color: '#10b981',
  },
  {
    id: 'u-4',
    name: 'Maya Lin',
    email: 'maya.lin@guest.internal',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'viewer',
    color: '#f59e0b',
  },
];
