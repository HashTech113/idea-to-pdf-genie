-- Add plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro'));

-- Add index for faster plan lookups
CREATE INDEX idx_profiles_plan ON public.profiles(plan);