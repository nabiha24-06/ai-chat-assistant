import { useState, useRef, useEffect } from 'react';
import { Menu, Send, Paperclip, Sparkles, FileText, Calculator, CloudSun, Bot, LogOut } from 'lucide-react';
import type { Conversation, Message } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { callAI } from '@/lib/aiApi';
import { showToast } from './Toast';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ToolBadge from './ToolBadge';
import DocumentUpload from './DocumentUpload';
import ContentGenerator from './ContentGenerator';
import { chunkText, retrieveRelevantChunks } from '../rag';
const SUGGESTIONS = [
  { icon: Calculator, text: 'What is (342 * 17) + 891?' },
  { icon: CloudSun, text: 'What is the current date and time?' },
  { icon: FileText, text: 'Summarize my uploaded document' },
  { icon: Sparkles, text: 'Write a professional email about a project delay' },
];

interface ChatViewProps {
  onHome: () => void;
  session: Session | null;
}

export default function ChatView({ onHome, session }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [pendingTools, setPendingTools] = useState<{ name: string; input: string; result: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const userEmail = session?.user?.email || '';

  useEffect(() => {
    loadConversations();
  }, [session?.user?.id]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    } else {
      setMessages([]);
    }
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, pendingTools]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) { console.error('Error loading conversations:', error); return; }
    setConversations((data as Conversation[]) || []);
    if (data && data.length > 0 && !activeConv) {
      setActiveConv(data[0] as Conversation);
    }
  };

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (error) { console.error('Error loading messages:', error); return; }
    setMessages((data as Message[]) || []);
  };

  const handleNewConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title: 'New Conversation' })
      .select()
      .single();
    if (error) { console.error('Error creating conversation:', error); return; }
    const newConv = data as Conversation;
    setConversations((prev) => [newConv, ...prev]);
    setActiveConv(newConv);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) { console.error('Error deleting conversation:', error); return; }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConv?.id === id) { setActiveConv(null); setMessages([]); }
  };

  const handleDocumentUpload = async (text: string, fileName: string, fileType: string) => {
    let conv = activeConv;
    if (!conv) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title: `Document: ${fileName}` })
        .select()
        .single();
      if (error) { console.error('Error creating conversation:', error); return; }
      conv = data as Conversation;
      setConversations((prev) => [conv!, ...prev]);
      setActiveConv(conv);
    }
    const { data: updated, error } = await supabase
      .from('conversations')
      .update({ document_text: text, document_name: fileName, document_type: fileType, updated_at: new Date().toISOString() })
      .eq('id', conv.id)
      .select()
      .single();
    if (error) { console.error('Error updating conversation:', error); return; }
    const updatedConv = updated as Conversation;
    setActiveConv(updatedConv);
    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    const docMessage: Message = {
      id: `doc-${Date.now()}`, conversation_id: conv.id, role: 'system',
      content: `Document uploaded: ${fileName} (${fileType.toUpperCase()}). The AI can now answer questions about this document.`,
      tool_name: null, tool_input: null, tool_result: null, created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, docMessage]);
    setShowUpload(false);
  };

  const buildMessageHistory = () => {
    return messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  };

  const getDocumentText = () => {
    return activeConv?.document_text || null;
  };

const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    let conv = activeConv;
    if (!conv) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title: text.slice(0, 60) })
        .select()
        .single();
      if (error) { console.error('Error creating conversation:', error); return; }
      conv = data as Conversation;
      setConversations((prev) => [conv!, ...prev]);
      setActiveConv(conv);
    }
    const userMsg: Message = {
      id: `temp-user-${Date.now()}`, conversation_id: conv.id, role: 'user', content: text,
      tool_name: null, tool_input: null, tool_result: null, created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setPendingTools([]);
    try {
      const history = [...buildMessageHistory(), { role: 'user' as const, content: text }];
      const docText = getDocumentText();
      
      // --- RAG PIPELINE INTEGRATION ---
      let processedDocContext = docText;
      if (docText) {
        const chunks = chunkText(docText, activeConv?.document_name || 'document');
        const relevantChunks = retrieveRelevantChunks(text, chunks, 3);
        processedDocContext = relevantChunks
          .map(c => `[Excerpt from ${c.fileName}]:\n${c.content}`)
          .join('\n\n');
      }
      // --------------------------------

      const result = await callAI(history, conv.id, processedDocContext, null, undefined);
      for (const tool of result.toolsUsed) { setPendingTools((prev) => [...prev, tool]); }
      const aiMsg: Message = {
        id: `temp-ai-${Date.now()}`, conversation_id: conv.id, role: 'assistant', content: result.reply,
        tool_name: null, tool_input: null, tool_result: null, created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setPendingTools([]);
      await loadConversations();
    } catch (e) {
      const errorMsg = (e as Error).message;
      showToast(`I couldn't get a response. ${errorMsg}`, 'error');
      const errMsg: Message = {
        id: `temp-err-${Date.now()}`, conversation_id: conv.id, role: 'assistant',
        content: `Sorry, I encountered an error. Please try again — the AI service may be temporarily busy.`,
        tool_name: null, tool_input: null, tool_result: null, created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setPendingTools([]);
    }
  };



  const handleGenerateResult = (content: string) => {
    if (!activeConv) return;
    const aiMsg: Message = {
      id: `temp-gen-${Date.now()}`, conversation_id: activeConv.id, role: 'assistant', content,
      tool_name: null, tool_input: null, tool_result: null, created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setShowGenerator(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onHome();
  };

  const hasMessages = messages.length > 0;
  const hasDocument = !!activeConv?.document_text;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeConv?.id || null}
        onSelect={(id) => {
          const conv = conversations.find((c) => c.id === id);
          if (conv) setActiveConv(conv);
          setSidebarOpen(false);
        }}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHome={onHome}
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-900">
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium truncate text-slate-900">
              {activeConv?.title || 'New Conversation'}
            </h2>
            {hasDocument && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <FileText size={12} className="text-blue-600" />
                <span className="text-xs text-blue-600 truncate">{activeConv?.document_name}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span className="hidden sm:inline">Generate</span>
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Paperclip size={14} className="text-blue-600" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            title="Sign out"
          >
            <LogOut size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50">
          <div className="max-w-3xl mx-auto space-y-4">
            {!hasMessages && !loading && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                  <Bot size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Assistant</h3>
                <p className="text-sm text-slate-500 max-w-md mb-8">
                  Ask me anything, upload a document for analysis, or generate content. I can use tools like a calculator and weather lookup when needed.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {SUGGESTIONS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSend(s.text)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-sm text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all group"
                      >
                        <Icon size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="flex-1">{s.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {pendingTools.map((tool, i) => (
              <div key={`pending-${i}`} className="flex justify-center py-1">
                <ToolBadge toolName={tool.name} input={tool.input} result={tool.result} />
              </div>
            ))}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-white rounded-2xl border border-slate-300 focus-within:border-blue-500 transition-colors px-4 py-3 shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, request a calculation, or chat..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              AI may use tools (calculator, weather/date) when needed. Always verify important information.
            </p>
          </div>
        </div>
      </div>

      {showUpload && <DocumentUpload onUpload={handleDocumentUpload} onClose={() => setShowUpload(false)} />}
      {showGenerator && <ContentGenerator conversation={activeConv} onResult={handleGenerateResult} onClose={() => setShowGenerator(false)} />}
    </div>
  );
}
