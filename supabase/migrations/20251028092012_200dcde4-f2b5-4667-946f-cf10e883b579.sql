-- Update app_role enum to include subscribed_user
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'subscribed_user';

-- Create details_of_subscribed_user table
CREATE TABLE IF NOT EXISTS public.details_of_subscribed_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  plan_name text NOT NULL,
  payment_id text NOT NULL,
  plan_start_date date NOT NULL,
  plan_expiry_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, payment_id)
);

-- Enable RLS
ALTER TABLE public.details_of_subscribed_user ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription details
CREATE POLICY "Users can view their own subscription details"
ON public.details_of_subscribed_user
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all subscription details
CREATE POLICY "Admins can view all subscription details"
ON public.details_of_subscribed_user
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow inserts from service role (edge functions)
CREATE POLICY "Service role can insert subscription details"
ON public.details_of_subscribed_user
FOR INSERT
WITH CHECK (true);