
-- Add new interaction types
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'proximity_close';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'proximity_circle';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'proximity_often';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'time_past';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'time_recent';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'time_long';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'relationship_friend';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'relationship_know';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'relationship_interested';

-- Add columns to interactions
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS anonymous_id text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS session_fingerprint text;

-- Create puzzles table
CREATE TABLE public.puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  hint_reward text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puzzles are publicly readable"
  ON public.puzzles FOR SELECT
  USING (true);

-- Create puzzle_progress table
CREATE TABLE public.puzzle_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interaction_anonymous_id text NOT NULL,
  puzzle_id uuid NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
  solved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, interaction_anonymous_id, puzzle_id)
);

ALTER TABLE public.puzzle_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own puzzle progress"
  ON public.puzzle_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own puzzle progress"
  ON public.puzzle_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create guesses table
CREATE TABLE public.guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interaction_anonymous_id text NOT NULL,
  guess_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own guesses"
  ON public.guesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guesses"
  ON public.guesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed puzzles
INSERT INTO public.puzzles (level, question, answer, hint_reward, difficulty) VALUES
(1, 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', 'map', 'This person may be closer than you think', 'easy'),
(2, 'The more you take, the more you leave behind. What am I?', 'footsteps', 'They walk a familiar path', 'easy'),
(3, 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?', 'echo', 'Their presence echoes around you', 'easy'),
(4, 'What has keys but no locks, space but no room, and you can enter but can not go inside?', 'keyboard', 'They reached out using a device you know', 'medium'),
(5, 'I am not alive, but I grow; I do not have lungs, but I need air; I do not have a mouth, but water kills me. What am I?', 'fire', 'Their interest burns bright', 'medium'),
(6, 'What comes once in a minute, twice in a moment, but never in a thousand years?', 'letter m', 'The first letter of something meaningful', 'medium'),
(7, 'I can be cracked, made, told, and played. What am I?', 'joke', 'They might share your sense of humor', 'medium'),
(8, 'The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they are. What is it?', 'coffin', 'Some secrets are better left buried', 'hard'),
(9, 'I have branches, but no fruit, trunk, or leaves. What am I?', 'bank', 'They value connections', 'hard'),
(10, 'What disappears as soon as you say its name?', 'silence', 'They watch in silence', 'hard'),
(11, 'I am always hungry, I must always be fed. The finger I touch will soon turn red. What am I?', 'fire', 'Their curiosity is consuming', 'hard'),
(12, 'What can travel around the world while staying in a corner?', 'stamp', 'They have left their mark on your world', 'expert');
