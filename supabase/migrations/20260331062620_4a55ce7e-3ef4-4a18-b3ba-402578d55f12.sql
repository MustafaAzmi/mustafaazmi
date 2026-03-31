
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (needed for visitor pages)
CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create interaction types enum
CREATE TYPE public.interaction_type AS ENUM ('interested', 'curious', 'message');

-- Create interactions table
CREATE TABLE public.interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_type public.interaction_type NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert interactions (anonymous visitors)
CREATE POLICY "Anyone can create interactions" ON public.interactions FOR INSERT WITH CHECK (true);
-- Profile owners can view their own interactions
CREATE POLICY "Profile owners can view interactions" ON public.interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE profiles.id = interactions.profile_id AND profiles.user_id = auth.uid()
    )
  );

-- Create trigger function for profile auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for fast username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);
-- Index for fast interaction queries
CREATE INDEX idx_interactions_profile_id ON public.interactions(profile_id);
