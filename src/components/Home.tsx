import { Bot, FileText, Sparkles, Calculator, CloudSun, MessageSquare, ArrowRight, Check } from 'lucide-react';

interface HomeProps {
  onLaunch: () => void;
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Intelligent Chat',
    desc: 'Ask questions in natural language. The assistant maintains conversation context and handles follow-ups seamlessly.',
  },
  {
    icon: FileText,
    title: 'Document Analysis',
    desc: 'Upload PDF, TXT, or DOCX files. Get summaries, extract key information, and ask questions about the content.',
  },
  {
    icon: Sparkles,
    title: 'Content Generation',
    desc: 'Generate emails, reports, social posts, summaries, and meeting notes with customizable tone and format.',
  },
  {
    icon: Calculator,
    title: 'Tool Calling',
    desc: 'The AI dynamically invokes tools like a calculator and weather/date lookup when your question requires them.',
  },
];

const STEPS = [
  { num: '01', title: 'Start a Conversation', desc: 'Type your question or pick a suggested prompt to begin.' },
  { num: '02', title: 'Upload Documents', desc: 'Attach PDF, TXT, or DOCX files for AI-powered analysis.' },
  { num: '03', title: 'Get Smart Responses', desc: 'Receive answers, summaries, and generated content instantly.' },
];

export default function Home({ onLaunch }: HomeProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">AI Assistant</span>
          </div>
          <button
            onClick={onLaunch}
            className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-cyan-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
            <Sparkles size={14} />
            Powered by Google Gemini
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your intelligent AI
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              assistant & document analyst
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Chat naturally, upload documents for analysis, generate professional content,
            and leverage tool-calling — all in one polished interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunch}
              className="group px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all flex items-center gap-2"
            >
              Start Chatting
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#features"
              className="px-7 py-3.5 rounded-xl border border-slate-300 text-slate-700 text-base font-medium hover:bg-slate-50 transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Four powerful capabilities working together in a single, intuitive interface.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-lg hover:border-slate-300 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-slate-600">Three simple steps to get started.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-4xl font-bold text-blue-100 mb-3">{s.num}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 -right-4 text-slate-200">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool calling highlight */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-100">
              <Calculator size={36} className="text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-semibold mb-2">Built-in tool calling</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                The AI dynamically decides when to invoke tools. Ask a math question and it uses the
                calculator. Ask about the date or weather and it fetches live data. No manual switching needed.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                  <Check size={12} /> Calculator
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-medium">
                  <CloudSun size={12} /> Weather & Date-Time
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-600 mb-8">
            Launch the assistant and start chatting, uploading documents, and generating content.
          </p>
          <button
            onClick={onLaunch}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white text-base font-medium shadow-lg hover:bg-slate-800 transition-all"
          >
            Launch AI Assistant
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <p className="text-xs text-slate-400">
            Powered by Google Gemini · Built with React & Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
