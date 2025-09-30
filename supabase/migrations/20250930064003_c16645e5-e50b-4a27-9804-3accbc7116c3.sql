-- Create business_plans table
CREATE TABLE IF NOT EXISTS public.business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  business_name TEXT NOT NULL,
  form_data JSONB NOT NULL,
  pdf_path TEXT NOT NULL,
  pdf_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- Policy: users can view their own plans
CREATE POLICY "Users can view their own plans"
ON public.business_plans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: users can view plans they created (even if logged out, for now allow all)
CREATE POLICY "Anyone can view plans"
ON public.business_plans
FOR SELECT
TO anon
USING (true);

-- Create storage bucket for business plans
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-plans', 'business-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read access
CREATE POLICY "Public can view business plan PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-plans');

-- Storage policy: service role can upload
CREATE POLICY "Service role can upload business plans"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'business-plans');