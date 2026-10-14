/*
# Create conversations and messages tables

## Overview
This migration creates the core tables for the AI assistant app — storing
conversations and individual chat messages. It is a single-tenant app (no
sign-in), so all policies allow anon + authenticated access.

## New Tables

### conversations
- `id` (uuid, primary key)
- `title` (text, default 'New Conversation')
- `document_text` (text, nullable — stores the extracted text of an uploaded document)
- `document_name` (text, nullable — original filename of the uploaded document)
- `document_type` (text, nullable — file extension: pdf, txt, docx)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### messages
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key → conversations.id ON DELETE CASCADE)
- `role` (text: 'user' | 'assistant' | 'system' | 'tool')
- `content` (text, not null)
- `tool_name` (text, nullable — name of the tool invoked, if any)
- `tool_input` (text, nullable — JSON string of tool input)
- `tool_result` (text, nullable — JSON string of tool result)
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on both tables.
- Policies: anon + authenticated full CRUD (single-tenant, intentionally public).
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  document_text text,
  document_name text,
  document_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL DEFAULT '',
  tool_name text,
  tool_input text,
  tool_result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
