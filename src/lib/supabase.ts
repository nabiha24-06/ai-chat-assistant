import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Conversation {
  id: string;
  title: string;
  document_text: string | null;
  document_name: string | null;
  document_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_name: string | null;
  tool_input: string | null;
  tool_result: string | null;
  created_at: string;
}

export interface ToolUsage {
  name: string;
  input: string;
  result: string;
}
