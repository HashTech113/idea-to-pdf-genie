-- Make business-plans bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'business-plans';

-- Create RLS policies for user-specific access
CREATE POLICY "Users can view their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-plans' 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-plans'
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update their own PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-plans'
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-plans'
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);