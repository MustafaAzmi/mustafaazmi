
-- Create chat_messages table for sender-receiver conversations
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  anonymous_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('owner', 'visitor')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Profile owners can read their own chat messages
CREATE POLICY "Owners can view their chat messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = chat_messages.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Profile owners can insert replies (sender_type = 'owner')
CREATE POLICY "Owners can reply in chat"
ON public.chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = chat_messages.profile_id
    AND profiles.user_id = auth.uid()
  )
  AND sender_type = 'owner'
);

-- Anyone can insert visitor messages (anonymous, no auth required)
CREATE POLICY "Visitors can send chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (sender_type = 'visitor');

-- Anyone can read visitor-accessible messages (for the chat view on visitor page)
CREATE POLICY "Visitors can read their chat thread"
ON public.chat_messages FOR SELECT
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
