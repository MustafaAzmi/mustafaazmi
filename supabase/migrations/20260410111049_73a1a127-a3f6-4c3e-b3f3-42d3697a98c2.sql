
-- Add is_blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Admin can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update any profile (for blocking, VIP etc)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all puzzle progress
CREATE POLICY "Admins can view all puzzle progress"
ON public.puzzle_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete puzzle progress
CREATE POLICY "Admins can delete puzzle progress"
ON public.puzzle_progress
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all guesses
CREATE POLICY "Admins can view all guesses"
ON public.guesses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete guesses
CREATE POLICY "Admins can delete guesses"
ON public.guesses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all chat messages
CREATE POLICY "Admins can view all chat messages"
ON public.chat_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete chat messages
CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
