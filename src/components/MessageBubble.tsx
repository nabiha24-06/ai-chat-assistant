import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { User, Bot } from 'lucide-react';
import type { Message } from '@/lib/supabase';
import ToolBadge from './ToolBadge';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  if (isTool) {
    return (
      <div className="flex justify-center py-1">
        <ToolBadge toolName={message.tool_name || 'unknown'} input={message.tool_input || undefined} result={message.tool_result || undefined} />
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center py-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
            : 'bg-gradient-to-br from-cyan-500 to-teal-500'
        }`}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
          }`}
        >
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none [&_math]:overflow-x-auto [&_math]:overflow-y-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p className="my-1">{children}</p>,
                ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                h1: ({ children }) => <h1 className="text-lg font-semibold my-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
                code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 text-sm font-mono">{children}</code>
                  ) : (
                    <pre className="my-2 p-3 rounded-lg bg-slate-800 text-slate-100 text-xs overflow-x-auto">
                      <code>{children}</code>
                    </pre>
                  ),
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto">
                    <table className="min-w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50 text-left">{children}</th>,
                td: ({ children }) => <td className="border border-slate-300 px-3 py-1.5">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
