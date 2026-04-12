-- Fix 1: Create a public view for puzzles that hides answers
CREATE VIEW public.puzzles_public AS
SELECT id, level, question, hint_reward, difficulty, created_at
FROM public.puzzles;

-- Remove the public read policy on puzzles
DROP POLICY IF EXISTS "Puzzles are publicly readable" ON public.puzzles;

-- Only admins and authenticated users can read puzzles (with answers for verification)
CREATE POLICY "Authenticated users can read puzzles"
ON public.puzzles
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Replace overly permissive chat_messages SELECT policy
DROP POLICY IF EXISTS "Visitors can read their chat thread" ON public.chat_messages;
