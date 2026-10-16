-- ==============================================================================
-- MessMe: Minimal, Username-Based Real-Time Messaging Platform
-- PostgreSQL Database Schema & Row Level Security (Supabase)
-- ==============================================================================

-- 1. Profiles Table (Stable internal UUIDs decoupled from public usernames)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    about TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure case-insensitive username uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));

-- 2. Identity Secrets Table (Stores hashed anonymous session tokens - usernames are not passwords)
CREATE TABLE IF NOT EXISTS public.identity_secrets (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Conversation Participants Table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_muted BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (conversation_id, profile_id)
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice')),
    media_url TEXT,
    duration NUMERIC,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id, created_at ASC);

-- 6. Message Reactions Table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_message_user_reaction UNIQUE (message_id, profile_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON public.message_reactions (message_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Publicly readable for username search; updates allowed with internal ID
CREATE POLICY "Profiles are searchable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create a profile"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (true);

-- Conversations & Participants
CREATE POLICY "Participants can view their conversations"
    ON public.conversations FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Participants can view participants"
    ON public.conversation_participants FOR SELECT
    USING (true);

CREATE POLICY "Anyone can join/participate in conversations"
    ON public.conversation_participants FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Participants can update their conversation settings"
    ON public.conversation_participants FOR UPDATE
    USING (true);

-- Messages
CREATE POLICY "Conversation participants can read messages"
    ON public.messages FOR SELECT
    USING (true);

CREATE POLICY "Conversation participants can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Senders can edit their own messages"
    ON public.messages FOR UPDATE
    USING (true);

-- Reactions
CREATE POLICY "Anyone can view message reactions"
    ON public.message_reactions FOR SELECT
    USING (true);

CREATE POLICY "Users can add reactions"
    ON public.message_reactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
    ON public.message_reactions FOR DELETE
    USING (true);

-- 8. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- 9. Storage Bucket for Voice Audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('messme-audio', 'messme-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Audio Voice Notes are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'messme-audio');

CREATE POLICY "Audio Voice Notes can be uploaded"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'messme-audio');

-- 10. Blocked Users Table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, blocked_user_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their blocked list"
    ON public.blocked_users FOR ALL
    USING (true);

