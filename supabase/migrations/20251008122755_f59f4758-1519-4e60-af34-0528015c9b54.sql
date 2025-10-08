-- Add last_login column to profiles table to track login/logout times
ALTER TABLE public.profiles 
ADD COLUMN last_login timestamp with time zone;