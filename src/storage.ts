import { ChatSession } from './types';

const STORAGE_KEY = 'ai_assistant_chat_sessions';

export const getSavedSessions = (): ChatSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load chat sessions', e);
    return [];
  }
};

export const saveSessions = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save chat sessions', e);
  }
};