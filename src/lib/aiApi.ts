import type { ToolUsage } from './supabase';

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface AIResponse {
  reply: string;
  toolsUsed: ToolUsage[];
}

export async function callAI(
  messages: ChatMessagePayload[],
  conversationId: string | null,
  documentText?: string | null,
  generateType?: string | null,
  tone?: string
): Promise<AIResponse> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      documentText: documentText || undefined,
      conversationId: conversationId || undefined,
      generateType: generateType || null,
      tone: tone || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`AI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    reply: data.reply || '',
    toolsUsed: (data.toolsUsed as ToolUsage[]) || [],
  };
}
