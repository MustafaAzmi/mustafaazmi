
-- Allow admins to manage puzzles
CREATE POLICY "Admins can insert puzzles"
ON public.puzzles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update puzzles"
ON public.puzzles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete puzzles"
ON public.puzzles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clear old puzzles and insert new AI-resistant ones
DELETE FROM public.puzzle_progress;
DELETE FROM public.puzzles;

INSERT INTO public.puzzles (level, question, answer, hint_reward, difficulty) VALUES
(1, 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', 'map', 'Reveals visitor city/location', 'easy'),
(2, 'The more you take, the more you leave behind. What are they?', 'footsteps', 'Reveals visitor device type', 'easy'),
(3, 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', 'echo', 'Reveals first visit timestamp', 'medium'),
(4, 'You see a boat filled with people. It has not sunk, but when you look again you don''t see a single person on the boat. Why?', 'married', 'Reveals session fingerprint', 'medium'),
(5, 'A man pushes his car to a hotel and tells the owner he is bankrupt. Why?', 'monopoly', 'Reveals proximity/distance info', 'hard'),
(6, 'What disappears as soon as you say its name?', 'silence', 'Reveals visitor city/location', 'easy'),
(7, 'I can be cracked, made, told, and played. What am I?', 'joke', 'Reveals visitor device type', 'medium'),
(8, 'The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they''re using it. What is it?', 'coffin', 'Reveals first visit timestamp', 'hard'),
(9, 'I have keys but no locks. I have space but no room. You can enter but can''t go inside. What am I?', 'keyboard', 'Reveals session fingerprint', 'medium'),
(10, 'What has 13 hearts but no other organs?', 'deck', 'Reveals proximity/distance info', 'hard');
