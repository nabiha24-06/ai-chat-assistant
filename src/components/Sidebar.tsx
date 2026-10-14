import { Plus, MessageSquare, FileText, Trash2, X, Bot, Home, LogOut } from 'lucide-react';
import type { Conversation } from '@/lib/supabase';
import { useState } from 'react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
  onHome: () => void;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 24 && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (hours < 48) return 'Yesterday';
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
  onHome,
  userName,
  userEmail,
  onSignOut,
}: SidebarProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed md:static top-0 left-0 h-full z-40 w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <button onClick={onHome} className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <Bot size={16} className="text-white" />
            </span>
            <span className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              AI Assistant
            </span>
          </button>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {conversations.length === 0 && (
            <p className="text-center text-slate-400 text-sm mt-8 px-4">
              No conversations yet. Start a new one to chat with the AI assistant.
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeId === conv.id
                  ? 'bg-blue-50 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare size={16} className="mt-0.5 flex-shrink-0 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {conv.title || 'New Conversation'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">
                    {formatDate(conv.updated_at)}
                  </span>
                  {conv.document_name && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <FileText size={10} />
                      {conv.document_type?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {confirmId === conv.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                    setConfirmId(null);
                  }}
                  className="text-red-500 hover:text-red-600 p-1"
                  title="Click to confirm"
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmId(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onHome}
              className="flex-1 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-700 transition-colors py-1.5 rounded-lg hover:bg-slate-50"
            >
              <Home size={12} />
              Home
            </button>
            <button
              onClick={onSignOut}
              className="flex-1 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-500 transition-colors py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
