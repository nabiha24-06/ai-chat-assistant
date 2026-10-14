import { useState } from 'react';
import { Mail, FileText, Share2, ClipboardList, NotebookPen, X, Sparkles, Loader2 } from 'lucide-react';
import { callAI } from '@/lib/aiApi';
import { showToast } from './Toast';
import type { Conversation } from '@/lib/supabase';

interface ContentGeneratorProps {
  conversation: Conversation | null;
  onResult: (content: string) => void;
  onClose: () => void;
}

const GENERATE_TYPES = [
  { id: 'email', label: 'Email', icon: Mail, desc: 'Professional email draft' },
  { id: 'summary', label: 'Summary', icon: FileText, desc: 'Concise summary of key points' },
  { id: 'social', label: 'Social Post', icon: Share2, desc: 'Social media post' },
  { id: 'report', label: 'Report', icon: ClipboardList, desc: 'Structured report' },
  { id: 'meeting_notes', label: 'Meeting Notes', icon: NotebookPen, desc: 'Organized meeting notes' },
] as const;

const TONES = ['Professional', 'Casual', 'Friendly', 'Formal', 'Enthusiastic', 'Urgent', 'Persuasive'];

export default function ContentGenerator({ conversation, onResult, onClose }: ContentGeneratorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [tone, setTone] = useState('Professional');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!selectedType) return;
    setLoading(true);
    setError('');
    try {
      const userMessage = topic.trim()
        ? `Please generate a ${GENERATE_TYPES.find((t) => t.id === selectedType)?.label} about: ${topic}`
        : `Please generate a ${GENERATE_TYPES.find((t) => t.id === selectedType)?.label} based on the conversation context.`;
      const messages = [{ role: 'user' as const, content: userMessage }];
      const result = await callAI(messages, conversation?.id || null, conversation?.document_text || null, selectedType, tone);
      onResult(result.reply);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      showToast('Content generation failed. The AI service may be busy — please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles size={20} className="text-blue-600" />
            Generate Content
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {conversation?.document_text && (
            <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
              Content will be based on your uploaded document: {conversation.document_name}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content Type</label>
            <div className="grid grid-cols-1 gap-2">
              {GENERATE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={20} className={selectedType === type.id ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-slate-400">{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    tone === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Topic / Instructions <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Q3 sales results, project update for stakeholders..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={!selectedType || loading}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </div>
    </div>
  );
}
