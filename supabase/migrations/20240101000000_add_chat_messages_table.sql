-- supabase/migrations/0018_add_chat_messages_table.sql

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id UUID,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- The user can only see their own chat messages.
CREATE POLICY "Allow individual read access" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

-- The user can only insert messages for themselves.
CREATE POLICY "Allow individual insert access" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- The user can only update their own messages.
CREATE POLICY "Allow individual update access" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- The user can only delete their own messages.
CREATE POLICY "Allow individual delete access" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.chat_messages IS 'Stores chat messages for user interactions with the AI assistant.'; 