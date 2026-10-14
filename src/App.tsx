import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Home from '@/components/Home';
import ChatView from '@/components/ChatView';
import Auth from '@/components/Auth';
import ToastContainer from '@/components/Toast';

export default function App() {
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setAuthReady(true);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showAuth && !session) {
    return (
      <>
        <Auth
          onSuccess={() => {
            setShowAuth(false);
            setView('chat');
          }}
          onBack={() => setShowAuth(false)}
        />
        <ToastContainer />
      </>
    );
  }

  if (view === 'chat' && !session) {
    return (
      <>
        <Auth onSuccess={() => setView('chat')} onBack={() => setView('home')} />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      {view === 'home' ? (
        <Home
          onLaunch={() => {
            if (session) setView('chat');
            else setShowAuth(true);
          }}
        />
      ) : (
        <ChatView
          onHome={() => setView('home')}
          session={session}
        />
      )}
      <ToastContainer />
    </>
  );
}
