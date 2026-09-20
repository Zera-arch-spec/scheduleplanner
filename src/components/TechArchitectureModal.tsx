import { useState } from 'react';
import { X, Layers, Database, Globe, HardDrive, Check, Copy } from 'lucide-react';

interface TechArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechArchitectureModal = ({ isOpen, onClose }: TechArchitectureModalProps) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'schema' | 'endpoints' | 'media' | 'ui'>('stack');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const sqlSchema = `-- ============================================================
-- COLLABORATIVE SCHEDULING PLATFORM DATABASE SCHEMA (POSTGRESQL)
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  color_code VARCHAR(16) DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKSPACES TABLE
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKSPACE MEMBERS TABLE (RBAC: owner, editor, viewer)
CREATE TYPE workspace_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- 4. SCHEDULES / CALENDARS
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  timezone VARCHAR(64) DEFAULT 'UTC',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PLANS (SCHEDULE ENTRIES)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(32) DEFAULT 'indigo',
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  last_edited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_workspace_date ON plans(workspace_id, plan_date);

-- 6. CONTENT BLOCKS (Reorderable Polymorphic Blocks)
CREATE TYPE block_type AS ENUM ('text', 'image', 'video', 'checklist', 'link');

CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  block_order INT NOT NULL,
  type block_type NOT NULL,
  payload JSONB NOT NULL, -- Flexible structure per block type
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_plan_block_order UNIQUE (plan_id, block_order)
);

-- 7. COMMENTS & THREADS
CREATE TABLE plan_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REACTIONS
CREATE TABLE plan_reactions (
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (plan_id, user_id, emoji)
);

-- 9. DATE & PLAN FOLLOWERS (For instant activity alerts)
CREATE TABLE plan_followers (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_date DATE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div id="tech-architecture-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">System Architecture & Technical Specifications</h2>
              <p className="text-xs text-slate-500">Tech Stack, Relational Data Schema, Real-time Protocols & Cloud Media Strategy</p>
            </div>
          </div>
          <button
            id="close-architecture-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 overflow-x-auto text-sm font-medium">
          <button
            id="tab-stack-btn"
            onClick={() => setActiveTab('stack')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'stack' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> (a) Suggested Tech Stack
          </button>
          <button
            id="tab-schema-btn"
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'schema' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" /> (b) Database Schema (SQL/DDL)
          </button>
          <button
            id="tab-endpoints-btn"
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'endpoints' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" /> (c) Key API Endpoints
          </button>
          <button
            id="tab-media-btn"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'media' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" /> Media Storage (Presigned URLs)
          </button>
          <button
            id="tab-ui-btn"
            onClick={() => setActiveTab('ui')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'ui' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            (d) Plan Editor UI Layout
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'stack' && (
            <div className="space-y-6 text-sm text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-base">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Frontend Architecture
                  </h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><strong className="text-slate-800">Framework:</strong> React 19 + TypeScript with Vite build system.</li>
                    <li><strong className="text-slate-800">Styling:</strong> Tailwind CSS with CSS Grid for robust 7-day calendar layouts.</li>
                    <li><strong className="text-slate-800">Motion & Animation:</strong> Motion (layout animations for seamless block reordering).</li>
                    <li><strong className="text-slate-800">State Management:</strong> Optimistic local state with live synchronization.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-base">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Backend & Real-time Layer
                  </h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><strong className="text-slate-800">Server:</strong> Node.js + Express with TypeScript execution (via tsx and esbuild).</li>
                    <li><strong className="text-slate-800">Real-time Collaboration:</strong> Server-Sent Events (SSE) or WebSockets (Socket.io) with Redis Pub/Sub for horizontal scaling.</li>
                    <li><strong className="text-slate-800">Conflict Resolution:</strong> Last-Write-Wins (LWW) with block-level granular locking (so two members can edit different blocks concurrently).</li>
                    <li><strong className="text-slate-800">Alternative:</strong> Firebase Firestore (provides native real-time listeners and offline sync).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-base">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Database Strategy
                  </h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><strong className="text-slate-800">Primary DB:</strong> PostgreSQL 16 on Cloud SQL / Supabase.</li>
                    <li><strong className="text-slate-800">JSONB Polymorphism:</strong> Used for content block payloads (text, image, video, checklist, link) allowing flexible block schema evolution without migration locks.</li>
                    <li><strong className="text-slate-800">Cache / Presence:</strong> Redis for active ephemeral collaborator presences and typing indicators (TTL 60s).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-base">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Multimodal AI Capabilities
                  </h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><strong className="text-slate-800">Text-to-Speech (TTS):</strong> Gemini <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">gemini-3.1-flash-tts-preview</code> for audio briefings of daily agendas.</li>
                    <li><strong className="text-slate-800">Search Grounding:</strong> Gemini <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">gemini-3.5-flash</code> with Google Search tool for live venue & scheduling lookups.</li>
                    <li><strong className="text-slate-800">Image Understanding:</strong> Gemini <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">gemini-3.1-pro-preview</code> for extracting plans from whiteboards and flyers.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">PostgreSQL Schema Definition (DDL)</span>
                <button
                  id="copy-sql-schema-btn"
                  onClick={() => copyToClipboard(sqlSchema, 'schema')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  {copied === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'schema' ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto leading-relaxed max-h-[500px]">
                {sqlSchema}
              </pre>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3">Method</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Description & Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-3 text-emerald-600 font-bold">GET</td>
                      <td className="p-3">/api/workspaces</td>
                      <td className="p-3 font-sans text-slate-600">List all workspaces accessible to current authenticated user.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-emerald-600 font-bold">GET</td>
                      <td className="p-3">/api/workspaces/:wsId/plans?date=YYYY-MM-DD</td>
                      <td className="p-3 font-sans text-slate-600">Fetch plans for date range or month view with content blocks.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 font-bold">POST</td>
                      <td className="p-3">/api/workspaces/:wsId/plans</td>
                      <td className="p-3 font-sans text-slate-600">Create a new schedule plan (Requires: Editor or Owner role).</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-amber-600 font-bold">PUT</td>
                      <td className="p-3">/api/workspaces/:wsId/plans/:id</td>
                      <td className="p-3 font-sans text-slate-600">Update plan metadata, reorder content blocks, updates lastEditedBy timestamp.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-rose-600 font-bold">DELETE</td>
                      <td className="p-3">/api/workspaces/:wsId/plans/:id</td>
                      <td className="p-3 font-sans text-slate-600">Delete a plan and its attached blocks (Requires: Editor or Owner).</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 font-bold">POST</td>
                      <td className="p-3">/api/workspaces/:wsId/plans/:id/comments</td>
                      <td className="p-3 font-sans text-slate-600">Add feedback comment (Available to all roles including Viewers).</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 font-bold">POST</td>
                      <td className="p-3">/api/workspaces/:wsId/plans/:id/reactions</td>
                      <td className="p-3 font-sans text-slate-600">Toggle emoji reaction count.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-purple-600 font-bold">WS / SSE</td>
                      <td className="p-3">/api/workspaces/:wsId/presence</td>
                      <td className="p-3 font-sans text-slate-600">Real-time presence stream broadcasting active users and editing indicators.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 font-bold">POST</td>
                      <td className="p-3">/api/gemini/tts</td>
                      <td className="p-3 font-sans text-slate-600">Convert schedule plan to spoken audio via <code className="bg-slate-100 px-1 py-0.5 rounded">gemini-3.1-flash-tts-preview</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 font-bold">POST</td>
                      <td className="p-3">/api/gemini/search-assistant</td>
                      <td className="p-3 font-sans text-slate-600">Ground plan details with live Google Search info via <code className="bg-slate-100 px-1 py-0.5 rounded">gemini-3.5-flash</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-600 font-bold">POST</td>
                      <td className="p-3">/api/gemini/analyze-image</td>
                      <td className="p-3 font-sans text-slate-600">Multimodal vision analysis of timetable/whiteboard via <code className="bg-slate-100 px-1 py-0.5 rounded">gemini-3.1-pro-preview</code>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="font-semibold text-slate-900 text-base">Secure Cloud Media Pipeline (Images & Videos)</h3>
                <p className="text-slate-600 leading-relaxed">
                  Direct media uploads through application servers create bottlenecks and memory bloat. The recommended architecture uses <strong>Pre-Signed URLs</strong> on Google Cloud Storage (GCS) or Amazon S3 with an edge CDN.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Step 1: Request Presigned URL</span>
                    <p className="text-xs text-slate-600 mt-1">
                      Client requests a short-lived PUT URL from <code className="bg-slate-100 px-1 py-0.5 rounded">POST /api/upload/presign</code> with MIME type and file hash.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Step 2: Direct Upload to Bucket</span>
                    <p className="text-xs text-slate-600 mt-1">
                      Browser streams media directly to Cloud Storage using HTTP PUT without touching backend container RAM.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Step 3: CDN Distribution</span>
                    <p className="text-xs text-slate-600 mt-1">
                      Media is served via Cloudflare or Cloud CDN with automatic WebP/AVIF transcoding and virus scanning triggers.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                  <strong>Video Embed Handling:</strong> For video blocks, YouTube and Vimeo URLs are converted to standard privacy-enhanced embed iframes (<code className="bg-slate-100 px-1 py-0.5 rounded">youtube-nocookie.com</code>). Direct MP4 uploads utilize standard HTML5 video players.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="font-semibold text-slate-900 text-base">Plan Editor UI Layout & Component Hierarchy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-800">1. Header & Live Collaboration Bar</h4>
                    <p className="text-xs text-slate-600">
                      Displays Plan Title, Date, Start/End Time picker, tag chips, and visual collaborator status showing active editors with glowing borders.
                    </p>
                    <h4 className="font-medium text-slate-800 pt-2">2. Reorderable Block Canvas</h4>
                    <p className="text-xs text-slate-600">
                      Vertical stack of cards for Text, Image, Video, Checklist, and Link blocks. Each block has up/down reorder buttons and delete controls.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-800">3. Quick Insert Toolbar</h4>
                    <p className="text-xs text-slate-600">
                      Floating or bottom dock with one-click buttons to add <strong>+ Text</strong>, <strong>+ Image</strong>, <strong>+ Video</strong>, <strong>+ Checklist</strong>, or <strong>+ Link</strong>.
                    </p>
                    <h4 className="font-medium text-slate-800 pt-2">4. Sidebar: Comments & AI Tools</h4>
                    <p className="text-xs text-slate-600">
                      Real-time threaded comments with avatars, emoji reactions bar, Gemini Speech TTS briefing generator, and Google Search grounded assistant.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
